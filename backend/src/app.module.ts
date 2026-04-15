import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { SupabaseModule } from './supabase/supabase.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { BooksModule } from './books/books.module';
import { EventsModule } from './events/events.module';
import { InquiriesModule } from './inquiries/inquiries.module';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule, SupabaseModule, AdminModule, PaymentModule, AuthModule, MediaModule, PostsModule, BooksModule, EventsModule, InquiriesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
