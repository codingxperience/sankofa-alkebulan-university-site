import { Body, Controller, Delete, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { pageQuery } from '../common/http/pagination';
import { validate } from '../common/http/zod.pipe';
import { line, optionalParagraph } from '../common/validation/fields';
import { ArticleStatus } from '../generated/prisma/client';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly } from '../staff/staff.guard';
import { JournalService } from './journal.service';

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.')
  .max(160);

const PublicQuery = z.object({
  q: z.string().trim().min(2).max(120).optional(),
  category: z.string().trim().max(120).optional(),
  tag: z.string().trim().toLowerCase().max(80).optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

/**
 * The public journal is read far more than it is written, so responses are
 * cached at Vercel's edge for a few minutes and served stale while refreshing.
 * A published edit reaches readers within that window.
 */
@Controller('journal')
export class PublicJournalController {
  constructor(private readonly journal: JournalService) {}

  @Get('articles')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  list(@Query(validate(PublicQuery)) query: z.infer<typeof PublicQuery>) {
    return this.journal.list(query);
  }

  @Get('facets')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400')
  facets() {
    return this.journal.facets();
  }

  @Get('articles/:slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  article(@Param('slug', validate(slug)) value: string) {
    return this.journal.bySlug(value);
  }
}

const topics = (max: number) => z.array(z.string().trim().min(1).max(80)).max(max);

const ArticleBody = z.object({
  slug,
  title: line('Title', 200, 3),
  excerpt: optionalParagraph('Excerpt', 600),
  bodyHtml: z.string().max(400_000, 'The article is too long.'),
  coverImageUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === '' || value.startsWith('/') || value.startsWith('https://') || /^[a-z0-9]/i.test(value), 'Use an https:// address or a site path.')
    .nullable()
    .optional(),
  authorName: line('Author', 160, 2),
  categories: topics(6).default([]),
  tags: topics(20).default([]),
  status: z.enum(ArticleStatus).default('DRAFT'),
  publishedAt: z.coerce.date().nullable().optional(),
});
const ArticlePatch = ArticleBody.partial().extend({ expectedUpdatedAt: z.coerce.date() });

const AdminQuery = z.object({
  status: z.union([z.enum(ArticleStatus), z.literal('SCHEDULED')]).optional(),
  q: z.string().trim().max(120).optional(),
  ...pageQuery,
});

@Controller('admin/journal/articles')
export class AdminJournalController {
  constructor(private readonly journal: JournalService) {}

  @Get()
  @StaffOnly('journal.read')
  list(@Query(validate(AdminQuery)) query: z.infer<typeof AdminQuery>) {
    return this.journal.adminList(query);
  }

  @Post()
  @StaffOnly('journal.manage')
  create(@CurrentStaff() staff: StaffPrincipal, @Body(validate(ArticleBody)) body: z.infer<typeof ArticleBody>) {
    return this.journal.create(staff, body);
  }

  @Get(':id')
  @StaffOnly('journal.read')
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.journal.adminDetail(id);
  }

  @Patch(':id')
  @StaffOnly('journal.manage')
  update(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(ArticlePatch)) body: z.infer<typeof ArticlePatch>,
  ) {
    return this.journal.update(staff, id, body);
  }

  @Delete(':id')
  @StaffOnly('journal.manage')
  remove(@CurrentStaff() staff: StaffPrincipal, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.journal.remove(staff, id);
  }
}
