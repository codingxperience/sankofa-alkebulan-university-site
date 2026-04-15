import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

type BookAccessType = 'FREE' | 'PAID';
type BookSourceType = 'INTERNAL' | 'EXTERNAL';
type EntitlementSource = 'PURCHASE' | 'ADMIN_GRANT' | 'PROMOTION';

interface CreateBookInput {
  title: string;
  slug?: string;
  description?: string;
  accessType?: BookAccessType;
  sourceType?: BookSourceType;
  isPublished?: boolean;
  isActive?: boolean;
  priceCents?: number;
  currency?: string;
  license?: string;
  externalId?: string;
  externalUrl?: string;
  coverImageUrl?: string;
}

interface AddBookFileInput {
  bucket?: string;
  path: string;
  mimeType?: string;
  fileSize?: number;
  checksum?: string;
  isPrimary?: boolean;
}

interface GrantEntitlementInput {
  userId: string;
  source?: EntitlementSource;
  expiresAt?: string;
  orderRef?: string;
}

interface BookAccessRequest {
  download?: boolean;
}

interface SuccessfulPaymentInput {
  provider: 'STRIPE' | 'FLUTTERWAVE' | 'MTN' | 'AIRTEL' | 'MANUAL';
  providerEventId: string;
  eventType: string;
  userId: string;
  bookId: string;
  idempotencyKey?: string;
  amountCents?: number | null;
  currency?: string | null;
  metadata?: any;
}

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async listPublicBooks() {
    const books = await this.bookModel().findMany({
      where: {
        isPublished: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        accessType: true,
        sourceType: true,
        priceCents: true,
        currency: true,
        license: true,
        externalUrl: true,
        coverImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return books.map((book: any) => ({
      ...book,
      hasExternalAccess: book.sourceType === 'EXTERNAL' && Boolean(book.externalUrl),
      externalUrl: undefined,
    }));
  }

  async getPublicBookBySlug(slug: string) {
    const book = await this.bookModel().findFirst({
      where: {
        slug,
        isPublished: true,
        isActive: true,
      },
      include: {
        files: {
          select: {
            id: true,
            mimeType: true,
            fileSize: true,
            isPrimary: true,
            createdAt: true,
          },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return {
      ...book,
      externalUrl: undefined,
      files: book.files || [],
    };
  }

  async listAdminBooks() {
    return this.bookModel().findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        files: true,
        _count: {
          select: {
            entitlements: true,
            files: true,
          },
        },
      },
    });
  }

  async createBook(input: CreateBookInput, actorId?: string) {
    const title = this.requireString(input.title, 'title');
    const slug = this.toSlug(input.slug || title);
    const accessType = this.toAccessType(input.accessType);
    const sourceType = this.toSourceType(input.sourceType);
    const isPublished = Boolean(input.isPublished);
    const isActive = input.isActive === undefined ? true : Boolean(input.isActive);
    const priceCents = input.priceCents === undefined || input.priceCents === null
      ? null
      : Number(input.priceCents);
    const currency = (input.currency || 'USD').toUpperCase();

    if (accessType === 'PAID' && (!Number.isInteger(priceCents) || (priceCents as number) <= 0)) {
      throw new BadRequestException('priceCents is required for paid books');
    }

    if (accessType === 'FREE' && priceCents && priceCents > 0) {
      throw new BadRequestException('Free books cannot include a positive price');
    }

    if (sourceType === 'EXTERNAL' && !input.externalUrl) {
      throw new BadRequestException('externalUrl is required for external books');
    }

    try {
      return await this.bookModel().create({
        data: {
          title,
          slug,
          description: input.description?.trim() || null,
          accessType,
          sourceType,
          isPublished,
          isActive,
          priceCents: accessType === 'PAID' ? priceCents : null,
          currency,
          license: input.license?.trim() || null,
          externalId: input.externalId?.trim() || null,
          externalUrl: input.externalUrl?.trim() || null,
          coverImageUrl: input.coverImageUrl?.trim() || null,
          createdById: actorId || null,
        },
      });
    } catch (error: any) {
      if (String(error?.message || '').includes('Unique constraint')) {
        throw new BadRequestException('A book with this slug already exists');
      }
      throw error;
    }
  }

  async addBookFile(bookId: string, input: AddBookFileInput) {
    const path = this.requireString(input.path, 'path').replace(/^\/+/, '');
    const bucket = (input.bucket || process.env.BOOKS_STORAGE_BUCKET || 'books').trim();
    const isPrimary = Boolean(input.isPrimary);

    return this.prisma.$transaction(async (tx: any) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) {
        throw new NotFoundException('Book not found');
      }

      if (isPrimary) {
        await tx.bookFile.updateMany({
          where: { bookId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.bookFile.create({
        data: {
          bookId,
          bucket,
          path,
          mimeType: input.mimeType?.trim() || null,
          fileSize: input.fileSize === undefined ? null : Number(input.fileSize),
          checksum: input.checksum?.trim() || null,
          isPrimary,
        },
      });
    });
  }

  async grantEntitlement(bookId: string, input: GrantEntitlementInput, grantedById?: string) {
    const userId = this.requireString(input.userId, 'userId');
    const source = this.toEntitlementSource(input.source);
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('expiresAt must be a valid ISO date');
    }

    const book = await this.bookModel().findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const existing = await this.entitlementModel().findFirst({
      where: { bookId, userId },
    });

    if (existing) {
      return this.entitlementModel().update({
        where: { id: existing.id },
        data: {
          source,
          grantedById: grantedById || existing.grantedById || null,
          orderRef: input.orderRef?.trim() || existing.orderRef || null,
          expiresAt,
        },
      });
    }

    return this.entitlementModel().create({
      data: {
        userId,
        bookId,
        source,
        grantedById: grantedById || null,
        orderRef: input.orderRef?.trim() || null,
        expiresAt,
      },
    });
  }

  async revokeEntitlement(bookId: string, userId: string) {
    const result = await this.entitlementModel().deleteMany({
      where: {
        bookId,
        userId,
      },
    });

    return {
      removed: result.count > 0,
      count: result.count,
    };
  }

  async getBookAccessForUser(slug: string, userId?: string, options: BookAccessRequest = {}) {
    const normalizedUserId = userId ? String(userId).trim() : '';
    const book = await this.bookModel().findFirst({
      where: {
        slug,
        isPublished: true,
        isActive: true,
      },
      include: {
        files: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 1,
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.accessType === 'PAID') {
      if (!normalizedUserId) {
        throw new ForbiddenException('Login is required to access paid books');
      }

      const entitlement = await this.entitlementModel().findFirst({
        where: {
          userId: normalizedUserId,
          bookId: book.id,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (!entitlement) {
        throw new ForbiddenException('Access denied. This book requires a purchase.');
      }
    }

    if (book.sourceType === 'EXTERNAL') {
      if (!book.externalUrl) {
        throw new BadRequestException('This external book is missing an access URL');
      }
      return {
        mode: 'external_redirect',
        url: book.externalUrl,
      };
    }

    const file = (book.files || [])[0];
    if (!file) {
      throw new NotFoundException('No file is configured for this book');
    }

    const expiresIn = this.signedUrlTtlSeconds();
    const downloadName = options.download ? `${book.slug}${this.fileExtension(file.path)}` : false;
    const { data, error } = await this.supabaseService.client.storage
      .from(file.bucket)
      .createSignedUrl(file.path, expiresIn, { download: downloadName });

    if (error || !data?.signedUrl) {
      throw new BadRequestException(`Unable to generate signed URL: ${error?.message || 'unknown error'}`);
    }

    return {
      mode: 'signed_url',
      url: data.signedUrl,
      expiresInSeconds: expiresIn,
    };
  }

  async searchExternalLibrary(query: string) {
    const trimmed = (query || '').trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }

    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=12`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException(`Open Library search failed: ${response.status}`);
    }

    const payload = await response.json();
    const docs = Array.isArray(payload?.docs) ? payload.docs : [];

    return docs.map((doc: any) => ({
      title: doc.title,
      author: Array.isArray(doc.author_name) ? doc.author_name[0] : null,
      year: doc.first_publish_year || null,
      language: Array.isArray(doc.language) ? doc.language[0] : null,
      coverId: doc.cover_i || null,
      openLibraryKey: doc.key || null,
    }));
  }

  async recordSuccessfulPaymentAndGrantEntitlement(input: SuccessfulPaymentInput) {
    const userId = this.requireString(input.userId, 'userId');
    const bookId = this.requireString(input.bookId, 'bookId');
    const providerEventId = this.requireString(input.providerEventId, 'providerEventId');
    const idempotencyKey = input.idempotencyKey?.trim() || null;
    const processedAt = new Date();

    const existingBook = await this.bookModel().findUnique({ where: { id: bookId } });
    if (!existingBook) {
      throw new NotFoundException('Book not found for payment settlement');
    }

    if (existingBook.accessType !== 'PAID') {
      throw new BadRequestException('Entitlements from payments can only be issued for paid books');
    }

    const existingEntitlement = await this.entitlementModel().findFirst({
      where: { userId, bookId },
    });

    const entitlement = existingEntitlement
      ? await this.entitlementModel().update({
          where: { id: existingEntitlement.id },
          data: {
            source: 'PURCHASE',
            orderRef: providerEventId,
            expiresAt: null,
          },
        })
      : await this.entitlementModel().create({
          data: {
            userId,
            bookId,
            source: 'PURCHASE',
            orderRef: providerEventId,
            expiresAt: null,
          },
        });

    const existingEvent = await this.paymentEventModel().findFirst({
      where: {
        provider: input.provider,
        providerEventId,
      },
    });

    if (existingEvent) {
      return this.paymentEventModel().update({
        where: { id: existingEvent.id },
        data: {
          status: 'SUCCEEDED',
          eventType: input.eventType,
          idempotencyKey: idempotencyKey || existingEvent.idempotencyKey || null,
          amountCents: input.amountCents ?? existingEvent.amountCents ?? null,
          currency: (input.currency || existingEvent.currency || null)?.toUpperCase?.() || null,
          userId,
          bookId,
          entitlementId: entitlement.id,
          metadata: input.metadata || {},
          processedAt,
        },
      });
    }

    return this.paymentEventModel().create({
      data: {
        provider: input.provider,
        status: 'SUCCEEDED',
        eventType: input.eventType,
        providerEventId,
        idempotencyKey,
        amountCents: input.amountCents ?? null,
        currency: input.currency ? input.currency.toUpperCase() : null,
        userId,
        bookId,
        entitlementId: entitlement.id,
        metadata: input.metadata || {},
        processedAt,
      },
    });
  }

  private bookModel() {
    return this.getModel('book');
  }

  private entitlementModel() {
    return this.getModel('entitlement');
  }

  private paymentEventModel() {
    return this.getModel('paymentEvent');
  }

  private getModel(name: 'book' | 'bookFile' | 'entitlement' | 'paymentEvent') {
    const model = (this.prisma as any)[name];
    if (!model) {
      throw new Error(
        `Prisma model "${name}" is unavailable. Run "npx prisma generate" after applying migrations.`,
      );
    }
    return model;
  }

  private requireString(value: string, field: string) {
    const normalized = String(value || '').trim();
    if (!normalized) {
      throw new BadRequestException(`${field} is required`);
    }
    return normalized;
  }

  private toSlug(value: string) {
    const slug = String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      throw new BadRequestException('Unable to generate a valid slug');
    }

    return slug;
  }

  private toAccessType(value?: string): BookAccessType {
    const normalized = (value || 'FREE').toUpperCase();
    if (normalized !== 'FREE' && normalized !== 'PAID') {
      throw new BadRequestException('accessType must be FREE or PAID');
    }
    return normalized as BookAccessType;
  }

  private toSourceType(value?: string): BookSourceType {
    const normalized = (value || 'INTERNAL').toUpperCase();
    if (normalized !== 'INTERNAL' && normalized !== 'EXTERNAL') {
      throw new BadRequestException('sourceType must be INTERNAL or EXTERNAL');
    }
    return normalized as BookSourceType;
  }

  private toEntitlementSource(value?: string): EntitlementSource {
    const normalized = (value || 'ADMIN_GRANT').toUpperCase();
    if (normalized !== 'PURCHASE' && normalized !== 'ADMIN_GRANT' && normalized !== 'PROMOTION') {
      throw new BadRequestException('source must be PURCHASE, ADMIN_GRANT, or PROMOTION');
    }
    return normalized as EntitlementSource;
  }

  private signedUrlTtlSeconds() {
    const raw = Number(process.env.BOOK_SIGNED_URL_TTL_SECONDS || 900);
    if (!Number.isFinite(raw) || raw < 60) return 900;
    return Math.min(Math.floor(raw), 60 * 60);
  }

  private fileExtension(path: string) {
    const index = path.lastIndexOf('.');
    if (index === -1) return '';
    return path.slice(index);
  }
}
