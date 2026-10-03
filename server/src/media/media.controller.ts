import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, Res, StreamableFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import { badRequest } from '../common/http/errors';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly } from '../staff/staff.guard';
import { MediaService } from './media.service';

/** A file name the console sent along, made safe to keep: plain text, short. */
function fileNameFrom(req: Request): string | null {
  const header = req.headers['x-file-name'];
  if (typeof header !== 'string' || !header) {
    return null;
  }
  let name: string;
  try {
    name = decodeURIComponent(header);
  } catch {
    return null;
  }
  const cleaned = name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 160);
  return cleaned || null;
}

@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  /** The photo itself is the request body (see the raw parser in bootstrap.ts). */
  @Post()
  @HttpCode(201)
  @StaffOnly('journal.manage')
  upload(@CurrentStaff() staff: StaffPrincipal, @Req() req: Request) {
    if (!Buffer.isBuffer(req.body)) {
      throw badRequest('Send the photo as a JPEG, PNG, WebP or GIF file.', 'unsupported_media_type');
    }
    return this.media.upload(staff, req.body, fileNameFrom(req));
  }
}

@Controller('media')
export class PublicMediaController {
  constructor(private readonly media: MediaService) {}

  /** Each stored photo never changes, so browsers and Vercel's edge keep it for a year. */
  @Get(':id')
  async read(@Param('id', new ParseUUIDPipe()) id: string, @Res({ passthrough: true }) res: Response) {
    const file = await this.media.read(id);
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.setHeader('ETag', `"${file.sha256}"`);
    // Usable in emails and link previews, not only on this site's pages.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return new StreamableFile(file.bytes, { type: file.contentType, length: file.bytes.length, disposition: 'inline' });
  }
}
