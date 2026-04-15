import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';

@Controller('admin/books')
@UseGuards(SupabaseAuthGuard)
export class AdminBooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async listAllBooks() {
    return this.booksService.listAdminBooks();
  }

  @Post()
  async createBook(@Body() body: any, @Req() req: any) {
    const actorId = String(req?.appUser?.id || '').trim() || undefined;
    return this.booksService.createBook(body, actorId);
  }

  @Post(':bookId/files')
  async addBookFile(@Param('bookId') bookId: string, @Body() body: any) {
    return this.booksService.addBookFile(bookId, body);
  }

  @Post(':bookId/entitlements')
  async grantEntitlement(@Param('bookId') bookId: string, @Body() body: any, @Req() req: any) {
    const grantedById = String(req?.appUser?.id || '').trim() || undefined;
    return this.booksService.grantEntitlement(bookId, body, grantedById);
  }

  @Delete(':bookId/entitlements/:userId')
  async revokeEntitlement(@Param('bookId') bookId: string, @Param('userId') userId: string) {
    return this.booksService.revokeEntitlement(bookId, userId);
  }
}
