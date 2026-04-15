import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('admin/posts')
@UseGuards(SupabaseAuthGuard)
export class SupabasePostsController {
  constructor(private supabaseService: SupabaseService) {}

  @Get()
  async findAll() {
    const { data, error } = await this.supabaseService.client.from('post').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  @Post()
  async create(@Body() body: any) {
    const { data, error } = await this.supabaseService.client.from('post').insert([body]);
    if (error) throw error;
    return data;
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const { data, error } = await this.supabaseService.client.from('post').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data;
  }

  @Put(':slug')
  async update(@Param('slug') slug: string, @Body() body: any) {
    const { data, error } = await this.supabaseService.client.from('post').update(body).eq('slug', slug);
    if (error) throw error;
    return data;
  }

  @Delete(':slug')
  async remove(@Param('slug') slug: string) {
    const { data, error } = await this.supabaseService.client.from('post').delete().eq('slug', slug);
    if (error) throw error;
    return data;
  }
}
