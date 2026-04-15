import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { AdminBooksController } from './admin-books.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  providers: [BooksService],
  controllers: [BooksController, AdminBooksController],
  exports: [BooksService],
})
export class BooksModule {}
