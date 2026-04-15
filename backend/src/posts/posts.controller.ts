import { Controller, Get, Param, Post as HttpPost, Body, Put, Delete, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { SupabaseAuthGuard } from '../supabase/supabase-auth.guard';

@Controller('posts')
@UseGuards(SupabaseAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll() {
    return this.postsService.findAll();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @HttpPost()
  async create(@Body() body: { title: string; slug: string; content: string; authorId: string; published?: boolean }) {
    return this.postsService.create(body);
  }

  @Put(':slug')
  async update(@Param('slug') slug: string, @Body() body: Partial<{ title: string; content: string; published: boolean }>) {
    return this.postsService.update(slug, body);
  }

  @Delete(':slug')
  async remove(@Param('slug') slug: string) {
    return this.postsService.remove(slug);
  }
}