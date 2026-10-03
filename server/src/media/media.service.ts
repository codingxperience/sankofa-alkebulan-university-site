import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { notFound, unprocessable } from '../common/http/errors';
import { PrismaService } from '../database/prisma.service';
import type { StaffPrincipal } from '../staff/sessions.service';
import { actorOf } from '../staff/staff.guard';
import { MAX_IMAGE_BYTES, sniffImageType } from './image-type';

export interface StoredImage {
  readonly id: string;
  readonly url: string;
  readonly contentType: string;
  readonly byteSize: number;
}

const mediaUrl = (id: string) => `/api/media/${id}`;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Stores a photograph, or returns the one already stored with the same bytes. */
  async upload(staff: StaffPrincipal, bytes: Uint8Array, fileName: string | null): Promise<StoredImage> {
    if (!bytes.length) {
      throw unprocessable('Choose a photo to upload.', { file: 'The file is empty.' }, 'empty_file');
    }
    if (bytes.length > MAX_IMAGE_BYTES) {
      throw unprocessable('That photo is larger than 4 MB.', { file: 'Larger than 4 MB.' }, 'file_too_large');
    }
    const contentType = sniffImageType(bytes);
    if (!contentType) {
      throw unprocessable('Upload a JPEG, PNG, WebP or GIF photo.', { file: 'Not a supported photo format.' }, 'unsupported_image');
    }

    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const existing = await this.prisma.mediaFile.findUnique({ where: { sha256 }, select: { id: true, contentType: true, byteSize: true } });
    if (existing) {
      return { id: existing.id, url: mediaUrl(existing.id), contentType: existing.contentType, byteSize: existing.byteSize };
    }

    const stored = await this.prisma.mediaFile.create({
      data: { contentType, bytes: Buffer.from(bytes), byteSize: bytes.length, sha256, fileName, uploadedById: staff.id },
      select: { id: true },
    });
    await this.audit.record({
      actor: actorOf(staff),
      action: 'media.uploaded',
      entityType: 'media',
      entityId: stored.id,
      summary: `${staff.name} uploaded a photo${fileName ? ` (${fileName})` : ''}, ${Math.ceil(bytes.length / 1024)} KB.`,
    });
    return { id: stored.id, url: mediaUrl(stored.id), contentType, byteSize: bytes.length };
  }

  async read(id: string): Promise<{ bytes: Buffer; contentType: string; sha256: string }> {
    const file = await this.prisma.mediaFile.findUnique({ where: { id }, select: { bytes: true, contentType: true, sha256: true } });
    if (!file) {
      throw notFound('That photo does not exist.');
    }
    return { bytes: Buffer.from(file.bytes), contentType: file.contentType, sha256: file.sha256 };
  }
}
