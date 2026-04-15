import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.post.findMany({
      include: { author: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(data: { title: string; slug: string; content: string; authorId: string; published?: boolean }) {
    return this.prisma.post.create({ data });
  }

  async update(slug: string, data: Partial<{ title: string; content: string; published: boolean }>) {
    const post = await this.prisma.post.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException('Post not found');
    return this.prisma.post.update({ where: { slug }, data });
  }

  async remove(slug: string) {
    const post = await this.prisma.post.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException('Post not found');
    return this.prisma.post.delete({ where: { slug } });
  }
}