import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabasePostsController } from './supabase.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Module({
  providers: [SupabaseService, SupabaseAuthGuard],
  controllers: [SupabasePostsController],
  exports: [SupabaseService],
})
export class SupabaseModule {}
