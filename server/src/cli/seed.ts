import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { logger } from '../common/logger';
import type { Prisma, ProductKind, ProductStatus } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { OFFICE_DEFAULTS, OFFICE_ORDER } from '../inquiries/offices';
import { cleanArticleHtml, normaliseAssetPath, plainText, readingMinutes } from '../journal/article-html';

/**
 * Loads the university's existing content into an empty database: the seven
 * offices, the store catalogue, the Sankofa Convening and the journal archive.
 *
 * Safe to run on every deploy. It only creates what is missing and never
 * overwrites anything — a price changed in the console stays changed.
 */
const SEED_DIR = path.join(__dirname, '..', '..', 'prisma', 'seed-data');

interface SeedProduct {
  sku: string;
  name: string;
  kind: ProductKind;
  status: ProductStatus;
  priceCents: number;
  hasSizes: boolean;
  isDigital: boolean;
  stockRemaining: number | null;
}

interface ImportedPost {
  title: string;
  published_at: string;
  excerpt: string;
  featured_image: string;
  categories: string[];
  tags: string[];
  author: string;
  slug: string;
  content: string;
}

/**
 * The old journal stored three real section categories; every other
 * "category" was several topic names run together, which cannot be split
 * back apart reliably. Only the real sections are kept — topics live in tags.
 */
const SECTIONS: Record<string, string> = {
  'editors pick': 'Editor’s Pick',
  'trends and analysis': 'Trends and Analysis',
  'current issue': 'Current Issue',
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(SEED_DIR, file), 'utf8')) as T;
}

async function seedOffices(prisma: PrismaService): Promise<number> {
  const result = await prisma.officeRoute.createMany({
    data: OFFICE_ORDER.map((office) => ({
      office,
      label: OFFICE_DEFAULTS[office].label,
      responseTarget: OFFICE_DEFAULTS[office].responseTarget,
      notifyEmails: [],
    })),
    skipDuplicates: true,
  });
  return result.count;
}

async function seedProducts(prisma: PrismaService): Promise<number> {
  const products = readJson<SeedProduct[]>('products.json');
  const result = await prisma.product.createMany({
    data: products.map((product, position) => ({ ...product, currency: 'USD', position })),
    skipDuplicates: true,
  });
  return result.count;
}

async function seedConvening(prisma: PrismaService): Promise<number> {
  const slug = 'sankofa-convening-2026';
  if (await prisma.event.findUnique({ where: { slug } })) {
    return 0;
  }
  await prisma.event.create({
    data: {
      slug,
      title: 'The Sankofa Convening 2026',
      summary:
        'Two flagship programmes launch: the Chancellor’s founding keynote and a mini-conference on cultural identity, indigenous knowledge, and intellectual cooperation. Free and open to all.',
      venue: 'Speke Resort, Munyonyo (Kampala) and online via Zoom',
      timezone: 'Africa/Kampala',
      // Fri 14 August 2026, 5:00 PM EAT (UTC+3); registration ran until the second day began.
      startsAt: new Date('2026-08-14T14:00:00Z'),
      registrationClosesAt: new Date('2026-08-15T14:00:00Z'),
      status: 'PUBLISHED',
      options: {
        attendeeCategories: [
          'Scholar / academic',
          'Government / institutional partner',
          'Student / prospective student',
          'Diaspora',
          'General public',
          'Press / media',
        ],
        attendanceModes: ['In person — Speke Resort', 'Online — Zoom'],
        days: ['Fri 14 — Keynote', 'Sat 15 — Mini-conference', 'Both days'],
        interests: ['Cultural identity', 'Indigenous knowledge', 'Intellectual cooperation'],
      } satisfies Prisma.InputJsonValue,
    },
  });
  return 1;
}

async function seedJournal(prisma: PrismaService): Promise<number> {
  const posts = readJson<ImportedPost[]>('journal.json');
  const existing = new Set((await prisma.article.findMany({ select: { slug: true } })).map((row) => row.slug));
  let created = 0;
  for (const post of posts) {
    if (existing.has(post.slug)) {
      continue;
    }
    const bodyHtml = cleanArticleHtml(post.content);
    await prisma.article.create({
      data: {
        slug: post.slug,
        title: post.title.replace(/\s+/g, ' ').trim(),
        excerpt: post.excerpt.trim() || plainText(bodyHtml).slice(0, 280),
        bodyHtml,
        coverImageUrl: post.featured_image ? normaliseAssetPath(post.featured_image.split('?')[0]) : null,
        authorName: post.author,
        categories: post.categories.map((category) => SECTIONS[category]).filter((value): value is string => Boolean(value)),
        tags: [...new Set(post.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
        readingMinutes: readingMinutes(bodyHtml),
        status: 'PUBLISHED',
        publishedAt: new Date(post.published_at),
      },
    });
    created += 1;
  }
  return created;
}

async function main(): Promise<void> {
  logger.setLevel('warn');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const prisma = app.get(PrismaService);
    const summary = {
      offices: await seedOffices(prisma),
      products: await seedProducts(prisma),
      events: await seedConvening(prisma),
      articles: await seedJournal(prisma),
    };
    process.stdout.write(`Seed complete — created ${JSON.stringify(summary)}\n`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Seed failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
