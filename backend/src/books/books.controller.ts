import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async listPublicBooks() {
    return this.booksService.listPublicBooks();
  }

  @Get('external/search')
  async searchExternal(@Query('q') query: string) {
    return this.booksService.searchExternalLibrary(query);
  }

  @Get(':slug')
  async getPublicBook(@Param('slug') slug: string) {
    return this.booksService.getPublicBookBySlug(slug);
  }

  @Get(':slug/public-access-url')
  async getPublicAccessUrl(@Param('slug') slug: string, @Query('download') download?: string) {
    return this.booksService.getBookAccessForUser(slug, undefined, {
      download: this.toBoolean(download),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':slug/access-url')
  async getAccessUrl(
    @Param('slug') slug: string,
    @Request() req: any,
    @Query('download') download?: string,
  ) {
    const userId = String(req?.user?.id || '').trim();
    return this.booksService.getBookAccessForUser(slug, userId, {
      download: this.toBoolean(download),
    });
  }

  private toBoolean(value?: string) {
    if (!value) return false;
    return ['1', 'true', 'yes', 'y'].includes(value.toLowerCase());
  }
}
