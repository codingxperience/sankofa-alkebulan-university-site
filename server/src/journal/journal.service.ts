import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiError, notFound } from '../common/http/errors';
import { afterCursor, decodeCursor, toPage } from '../common/http/pagination';
import type { Article, ArticleStatus, Prisma } from '../generated/prisma/client';
import { PrismaService, isUniqueViolation, table } from '../database/prisma.service';
import type { StaffPrincipal } from '../staff/sessions.service';
import { actorOf } from '../staff/staff.guard';
import { cleanArticleHtml, normaliseAssetPath, plainText, readingMinutes } from './article-html';

export interface ArticleInput {
  slug: string;
  title: string;
  /** Left empty, an excerpt is written from the opening of the article. */
  excerpt?: string | null;
  bodyHtml: string;
  coverImageUrl?: string | null;
  authorName: string;
  categories: string[];
  tags: string[];
  status: ArticleStatus;
  publishedAt?: Date | null;
}

const PUBLISHED = (now = new Date()): Prisma.ArticleWhereInput => ({ status: 'PUBLISHED', publishedAt: { lte: now } });

function summary(article: Article) {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    coverImageUrl: article.coverImageUrl,
    authorName: article.authorName,
    categories: article.categories,
    tags: article.tags,
    readingMinutes: article.readingMinutes,
    publishedAt: article.publishedAt,
  };
}

/** Keyset cursor over (publishedAt desc, id desc) for the public archive. */
function encodePublishedCursor(article: Article): string {
  return Buffer.from(`${article.publishedAt!.toISOString()}|${article.id}`).toString('base64url');
}

@Injectable()
export class JournalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Public ───────────────────────────────────────────────────────────

  async list(query: { q?: string; category?: string; tag?: string; cursor?: string; limit: number }) {
    if (query.q) {
      return this.search(query.q, query.limit);
    }
    const where: Prisma.ArticleWhereInput = PUBLISHED();
    if (query.category) where.categories = { has: query.category };
    if (query.tag) where.tags = { has: query.tag };

    let after: Prisma.ArticleWhereInput = {};
    if (query.cursor) {
      const [iso, id] = Buffer.from(query.cursor, 'base64url').toString('utf8').split('|');
      const at = new Date(iso ?? '');
      if (!id || Number.isNaN(at.getTime())) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'invalid_cursor', 'That page link is no longer valid.');
      }
      after = { OR: [{ publishedAt: { lt: at } }, { publishedAt: at, id: { lt: id } }] };
    }
    const rows = await this.prisma.article.findMany({
      where: { AND: [where, after] },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    const hasMore = rows.length > query.limit;
    const visible = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      items: visible.map(summary),
      nextCursor: hasMore ? encodePublishedCursor(visible[visible.length - 1]) : null,
    };
  }

  /**
   * Full-text search, ranked. `websearch_to_tsquery` accepts what people
   * naturally type — quoted phrases, OR, a leading minus — and never errors.
   */
  private async search(q: string, limit: number) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM ${table('articles')}
      WHERE "status" = 'PUBLISHED'
        AND "published_at" <= now()
        AND "search_vector" @@ websearch_to_tsquery('simple', ${q})
      ORDER BY ts_rank_cd("search_vector", websearch_to_tsquery('simple', ${q})) DESC, "published_at" DESC
      LIMIT ${Math.min(limit, 50)}
    `;
    if (rows.length === 0) {
      return { items: [], nextCursor: null };
    }
    const articles = await this.prisma.article.findMany({ where: { id: { in: rows.map((row) => row.id) } } });
    const order = new Map(rows.map((row, index) => [row.id, index]));
    articles.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return { items: articles.map(summary), nextCursor: null };
  }

  async bySlug(slug: string) {
    const article = await this.prisma.article.findFirst({ where: { slug, ...PUBLISHED() } });
    if (!article) {
      throw notFound('We could not find that article.');
    }
    const related = await this.prisma.article.findMany({
      where: {
        ...PUBLISHED(),
        id: { not: article.id },
        OR: [{ tags: { hasSome: article.tags } }, { categories: { hasSome: article.categories } }],
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return { ...summary(article), bodyHtml: article.bodyHtml, related: related.map(summary) };
  }

  /** Topics with how many published articles carry each, most used first. */
  async facets() {
    const [categories, tags, total] = await Promise.all([
      this.prisma.$queryRaw<Array<{ value: string; count: bigint }>>`
        SELECT unnest("categories") AS "value", count(*) AS "count" FROM ${table('articles')}
        WHERE "status" = 'PUBLISHED' AND "published_at" <= now()
        GROUP BY 1 ORDER BY 2 DESC, 1 ASC
      `,
      this.prisma.$queryRaw<Array<{ value: string; count: bigint }>>`
        SELECT unnest("tags") AS "value", count(*) AS "count" FROM ${table('articles')}
        WHERE "status" = 'PUBLISHED' AND "published_at" <= now()
        GROUP BY 1 ORDER BY 2 DESC, 1 ASC LIMIT 40
      `,
      this.prisma.article.count({ where: PUBLISHED() }),
    ]);
    return {
      total,
      categories: categories.map((row) => ({ value: row.value, count: Number(row.count) })),
      tags: tags.map((row) => ({ value: row.value, count: Number(row.count) })),
    };
  }

  // ─── Admin ────────────────────────────────────────────────────────────

  async adminList(query: { status?: ArticleStatus | 'SCHEDULED'; q?: string; cursor?: string; limit: number }) {
    const where: Prisma.ArticleWhereInput = {};
    if (query.status === 'SCHEDULED') {
      where.status = 'PUBLISHED';
      where.publishedAt = { gt: new Date() };
    } else if (query.status) {
      where.status = query.status;
    }
    if (query.q) {
      where.OR = [{ title: { contains: query.q, mode: 'insensitive' } }, { slug: { contains: query.q.toLowerCase() } }];
    }
    const rows = await this.prisma.article.findMany({
      where: { AND: [where, afterCursor(decodeCursor(query.cursor))] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      include: { updatedBy: { select: { name: true } } },
    });
    return toPage(rows, query.limit, (row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
      scheduled: row.status === 'PUBLISHED' && row.publishedAt !== null && row.publishedAt > new Date(),
      publishedAt: row.publishedAt,
      readingMinutes: row.readingMinutes,
      updatedBy: row.updatedBy?.name ?? null,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
    }));
  }

  async adminDetail(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true } }, updatedBy: { select: { name: true } } },
    });
    if (!article) {
      throw notFound('That article no longer exists.');
    }
    const { searchVector: _vector, ...visible } = article as Article & { searchVector?: unknown };
    return visible;
  }

  async create(staff: StaffPrincipal, input: ArticleInput) {
    const data = this.prepare(input);
    try {
      const article = await this.prisma.article.create({ data: { ...data, createdById: staff.id, updatedById: staff.id } });
      await this.audit.record({
        actor: actorOf(staff),
        action: 'article.created',
        entityType: 'article',
        entityId: article.id,
        summary: `${staff.name} created “${article.title}” (${article.status.toLowerCase()}).`,
      });
      return this.adminDetail(article.id);
    } catch (error) {
      throw this.slugConflict(error);
    }
  }

  /** `expectedUpdatedAt` stops two editors from silently overwriting each other's work. */
  async update(staff: StaffPrincipal, id: string, input: Partial<ArticleInput> & { expectedUpdatedAt: Date }) {
    const current = await this.prisma.article.findUnique({ where: { id } });
    if (!current) {
      throw notFound('That article no longer exists.');
    }
    if (current.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'stale_article',
        'Someone else saved this article while you were editing. Reload to see their changes before saving yours.',
      );
    }
    const { expectedUpdatedAt: _expected, ...changes } = input;
    const merged = this.prepare({
      slug: changes.slug ?? current.slug,
      title: changes.title ?? current.title,
      excerpt: changes.excerpt === undefined ? current.excerpt : changes.excerpt,
      bodyHtml: changes.bodyHtml ?? current.bodyHtml,
      coverImageUrl: changes.coverImageUrl === undefined ? current.coverImageUrl : changes.coverImageUrl,
      authorName: changes.authorName ?? current.authorName,
      categories: changes.categories ?? current.categories,
      tags: changes.tags ?? current.tags,
      status: changes.status ?? current.status,
      publishedAt: changes.publishedAt === undefined ? current.publishedAt : changes.publishedAt,
    });
    const result = await this.prisma.article
      .updateMany({ where: { id, updatedAt: current.updatedAt }, data: { ...merged, updatedById: staff.id } })
      .catch((error: unknown) => {
        throw this.slugConflict(error);
      });
    if (result.count === 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'stale_article', 'Someone else saved this article a moment ago. Reload before saving.');
    }

    const becamePublic = merged.status === 'PUBLISHED' && current.status !== 'PUBLISHED';
    await this.audit.record({
      actor: actorOf(staff),
      action: becamePublic ? 'article.published' : merged.status !== current.status ? `article.${merged.status.toLowerCase()}` : 'article.updated',
      entityType: 'article',
      entityId: id,
      summary: becamePublic
        ? `${staff.name} published “${merged.title}”${merged.publishedAt && merged.publishedAt > new Date() ? ` for ${merged.publishedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC` : ''}.`
        : `${staff.name} edited “${merged.title}”.`,
    });
    return this.adminDetail(id);
  }

  /** Only drafts that were never public can be deleted; published work is archived instead. */
  async remove(staff: StaffPrincipal, id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw notFound('That article no longer exists.');
    }
    if (article.status !== 'DRAFT' || article.publishedAt) {
      throw new ApiError(HttpStatus.CONFLICT, 'article_was_published', 'Published articles are archived, not deleted, so their links keep a record.');
    }
    await this.prisma.article.delete({ where: { id } });
    await this.audit.record({
      actor: actorOf(staff),
      action: 'article.deleted',
      entityType: 'article',
      entityId: id,
      summary: `${staff.name} deleted the draft “${article.title}”.`,
    });
    return { ok: true };
  }

  private prepare(input: ArticleInput) {
    const bodyHtml = cleanArticleHtml(input.bodyHtml);
    const text = plainText(bodyHtml);
    if (input.status === 'PUBLISHED' && text.length < 200) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'article_too_short', 'An article needs a body of at least a few paragraphs before it can be published.', {
        bodyHtml: 'Too short to publish.',
      });
    }
    const excerpt = input.excerpt?.trim() || (text.length > 280 ? `${text.slice(0, 277).replace(/\s+\S*$/, '')}…` : text);
    // Categories keep the editor's capitalisation; tags are lowercase so "Ubuntu" and "ubuntu" are one topic.
    const dedupe = (list: string[], lowercase: boolean) => {
      const seen = new Map<string, string>();
      for (const raw of list) {
        const value = raw.replace(/\s+/g, ' ').trim();
        if (value && !seen.has(value.toLowerCase())) {
          seen.set(value.toLowerCase(), lowercase ? value.toLowerCase() : value);
        }
      }
      return [...seen.values()];
    };
    return {
      slug: input.slug,
      title: input.title,
      excerpt,
      bodyHtml,
      coverImageUrl: input.coverImageUrl ? normaliseAssetPath(input.coverImageUrl) : null,
      authorName: input.authorName,
      categories: dedupe(input.categories, false),
      tags: dedupe(input.tags, true),
      readingMinutes: readingMinutes(bodyHtml),
      status: input.status,
      // Publishing without a date means "now"; unpublishing keeps the original date for the record.
      publishedAt: input.status === 'PUBLISHED' ? (input.publishedAt ?? new Date()) : (input.publishedAt ?? null),
    };
  }

  private slugConflict(error: unknown): unknown {
    if (isUniqueViolation(error, 'slug')) {
      return new ApiError(HttpStatus.CONFLICT, 'slug_taken', 'Another article already uses that web address.', { slug: 'Choose a different address.' });
    }
    return error;
  }
}

