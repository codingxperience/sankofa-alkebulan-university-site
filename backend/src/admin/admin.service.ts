import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ActivityType = 'post' | 'event' | 'user' | 'order';

export interface DashboardActivity {
  id: string;
  type: ActivityType;
  title: string;
  user: string;
  action: string;
  timestamp: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const now = new Date();
    const [totalPosts, totalEvents, totalProducts, orders, recentPosts, recentEvents, recentOrders] =
      await Promise.all([
        this.prisma.post.count(),
        this.prisma.event.count(),
        this.prisma.product.count(),
        this.prisma.order.findMany({
          select: {
            totalCents: true,
            status: true,
          },
        }),
        this.prisma.post.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { name: true, email: true },
            },
          },
        }),
        this.prisma.event.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        }),
      ]);

    const totalRevenue = orders.reduce((sum, order) => {
      if (String(order.status || '').toLowerCase() === 'canceled') {
        return sum;
      }
      return sum + (order.totalCents || 0);
    }, 0) / 100;

    const activity: DashboardActivity[] = [
      ...recentPosts.map((post) => ({
        id: `post:${post.id}`,
        type: 'post' as const,
        title: post.title,
        user: post.author?.name || post.author?.email || 'System',
        action: post.published ? 'Published a post' : 'Saved a draft',
        timestamp: post.createdAt.toISOString(),
      })),
      ...recentEvents.map((event) => ({
        id: `event:${event.id}`,
        type: 'event' as const,
        title: event.title,
        user: 'Admin',
        action: event.startsAt > now ? 'Scheduled an event' : 'Updated an event',
        timestamp: event.createdAt.toISOString(),
      })),
      ...recentOrders.map((order) => ({
        id: `order:${order.id}`,
        type: 'order' as const,
        title: `Order ${order.id.slice(0, 8)}`,
        user: order.user?.name || order.user?.email || 'Customer',
        action: `Order status: ${order.status}`,
        timestamp: order.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalPosts,
      totalEvents,
      totalProducts,
      totalRevenue,
      recentActivity: activity,
    };
  }

  async getAllPosts() {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { name: true, email: true },
        },
      },
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      author: post.author?.name || post.author?.email || 'Unknown',
      status: post.published ? 'published' : 'draft',
      created_at: post.createdAt.toISOString(),
      published_at: post.published ? post.updatedAt.toISOString() : '',
      content: post.content,
    }));
  }

  async createPost(postData: any, actorId?: string) {
    const title = String(postData?.title || '').trim();
    const content = String(postData?.content || '').trim();
    if (!title || !content) {
      throw new BadRequestException('title and content are required');
    }

    const authorId = await this.resolveAuthorId(actorId);
    const slug = this.makeSlug(postData?.slug || title);

    return this.prisma.post.create({
      data: {
        title,
        slug,
        content,
        published: Boolean(postData?.published),
        authorId,
      },
    });
  }

  async updatePost(id: string, postData: any) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        title: postData?.title ? String(postData.title).trim() : undefined,
        slug: postData?.slug ? this.makeSlug(postData.slug) : undefined,
        content: postData?.content ? String(postData.content).trim() : undefined,
        published: typeof postData?.published === 'boolean' ? postData.published : undefined,
      },
    });
  }

  async deletePost(id: string) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.post.delete({ where: { id } });
  }

  async getAllEvents() {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      orderBy: { startsAt: 'desc' },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.startsAt.toISOString(),
      location: event.location || 'TBD',
      attendees: event.attendees || 0,
      status: this.normalizeEventStatus(
        event.status || (event.startsAt > now ? 'active' : 'inactive'),
      ),
      description: event.description,
    }));
  }

  async createEvent(eventData: any) {
    const title = String(eventData?.title || '').trim();
    const startsAtRaw = eventData?.startsAt || eventData?.date;
    const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;

    if (!title || !startsAt || Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('title and a valid startsAt/date are required');
    }

    const endsAt = eventData?.endsAt ? new Date(eventData.endsAt) : null;
    const attendees = this.toNonNegativeInt(eventData?.attendees, 0);
    const status = this.normalizeEventStatus(eventData?.status || 'draft');

    return this.prisma.event.create({
      data: {
        title,
        startsAt,
        endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null,
        location: eventData?.location ? String(eventData.location).trim() : null,
        description: eventData?.description ? String(eventData.description).trim() : null,
        attendees,
        status,
      },
    });
  }

  async updateEvent(id: string, eventData: any) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    let startsAt: Date | undefined;
    if (eventData?.startsAt || eventData?.date) {
      const parsed = new Date(eventData.startsAt || eventData.date);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('startsAt/date must be a valid date');
      }
      startsAt = parsed;
    }

    let endsAt: Date | null | undefined;
    if (eventData?.endsAt !== undefined) {
      if (!eventData.endsAt) {
        endsAt = null;
      } else {
        const parsed = new Date(eventData.endsAt);
        if (Number.isNaN(parsed.getTime())) {
          throw new BadRequestException('endsAt must be a valid date');
        }
        endsAt = parsed;
      }
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        title: eventData?.title ? String(eventData.title).trim() : undefined,
        startsAt,
        endsAt,
        location: eventData?.location ? String(eventData.location).trim() : undefined,
        description: eventData?.description ? String(eventData.description).trim() : undefined,
        attendees:
          eventData?.attendees !== undefined
            ? this.toNonNegativeInt(eventData.attendees, existing.attendees || 0)
            : undefined,
        status: eventData?.status ? this.normalizeEventStatus(eventData.status) : undefined,
      },
    });
  }

  async deleteEvent(id: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }
    return this.prisma.event.delete({ where: { id } });
  }

  async getAllProducts() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category || 'General',
      price: product.priceCents / 100,
      stock: product.stock || 0,
      status: this.normalizeProductStatus(product.status || 'available'),
      description: product.description,
      created_at: product.createdAt.toISOString(),
    }));
  }

  async createProduct(productData: any) {
    const name = String(productData?.name || '').trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const incomingPrice = productData?.priceCents ?? productData?.price;
    const priceCents = Number(incomingPrice);
    if (!Number.isFinite(priceCents)) {
      throw new BadRequestException('price or priceCents must be numeric');
    }

    const normalizedPriceCents =
      Number.isInteger(priceCents) && productData?.priceCents !== undefined
        ? priceCents
        : Math.round(priceCents * 100);

    if (normalizedPriceCents <= 0) {
      throw new BadRequestException('price must be greater than 0');
    }

    const stock = this.toNonNegativeInt(productData?.stock, 0);
    const status = this.normalizeProductStatus(productData?.status || 'available');
    const category = productData?.category
      ? String(productData.category).trim()
      : 'General';

    return this.prisma.product.create({
      data: {
        name,
        description: productData?.description ? String(productData.description).trim() : null,
        priceCents: normalizedPriceCents,
        stock,
        status,
        category,
        sku: productData?.sku ? String(productData.sku).trim() : null,
      },
    });
  }

  async updateProduct(id: string, productData: any) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    let priceCents: number | undefined;
    if (productData?.price !== undefined || productData?.priceCents !== undefined) {
      const incoming = Number(productData?.priceCents ?? productData?.price);
      if (!Number.isFinite(incoming)) {
        throw new BadRequestException('price/priceCents must be numeric');
      }
      priceCents =
        Number.isInteger(incoming) && productData?.priceCents !== undefined
          ? incoming
          : Math.round(incoming * 100);
      if (priceCents <= 0) {
        throw new BadRequestException('price must be greater than 0');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: productData?.name ? String(productData.name).trim() : undefined,
        description:
          productData?.description !== undefined
            ? String(productData.description || '').trim() || null
            : undefined,
        priceCents,
        stock:
          productData?.stock !== undefined
            ? this.toNonNegativeInt(productData.stock, existing.stock || 0)
            : undefined,
        status: productData?.status ? this.normalizeProductStatus(productData.status) : undefined,
        category:
          productData?.category !== undefined
            ? String(productData.category || '').trim() || 'General'
            : undefined,
        sku: productData?.sku !== undefined ? String(productData.sku || '').trim() || null : undefined,
      },
    });
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    return this.prisma.product.delete({ where: { id } });
  }

  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      customer: order.user?.name || order.user?.email || 'Unknown customer',
      total: order.totalCents / 100,
      status: order.status,
      created_at: order.createdAt.toISOString(),
    }));
  }

  async createOrder(orderData: any) {
    const userId = String(orderData?.userId || '').trim();
    const totalCentsRaw = Number(orderData?.totalCents ?? orderData?.total);
    if (!userId || !Number.isFinite(totalCentsRaw)) {
      throw new BadRequestException('userId and total/totalCents are required');
    }

    const totalCents =
      Number.isInteger(totalCentsRaw) && orderData?.totalCents !== undefined
        ? totalCentsRaw
        : Math.round(totalCentsRaw * 100);

    if (totalCents <= 0) {
      throw new BadRequestException('Order total must be greater than 0');
    }

    return this.prisma.order.create({
      data: {
        userId,
        totalCents,
        status: this.normalizeOrderStatus(orderData?.status || 'pending'),
      },
    });
  }

  async updateOrder(id: string, orderData: any) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    let totalCents: number | undefined;
    if (orderData?.total !== undefined || orderData?.totalCents !== undefined) {
      const totalRaw = Number(orderData?.totalCents ?? orderData?.total);
      if (!Number.isFinite(totalRaw)) {
        throw new BadRequestException('total/totalCents must be numeric');
      }
      totalCents =
        Number.isInteger(totalRaw) && orderData?.totalCents !== undefined
          ? totalRaw
          : Math.round(totalRaw * 100);
      if (totalCents <= 0) {
        throw new BadRequestException('Order total must be greater than 0');
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: orderData?.status ? this.normalizeOrderStatus(orderData.status) : undefined,
        totalCents,
      },
    });
  }

  async deleteOrder(id: string) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
    return this.prisma.order.delete({ where: { id } });
  }

  private async resolveAuthorId(actorId?: string) {
    if (actorId) {
      const existing = await this.prisma.user.findUnique({ where: { id: actorId } });
      if (existing) {
        return actorId;
      }
    }

    const admin = await this.prisma.user.findFirst({
      where: { role: 'admin' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (admin?.id) {
      return admin.id;
    }

    const fallback = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (fallback?.id) {
      return fallback.id;
    }

    throw new BadRequestException('No author account exists. Create an admin user first.');
  }

  private makeSlug(value: string) {
    const slug = String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      throw new BadRequestException('Unable to generate slug');
    }
    return slug;
  }

  private normalizeEventStatus(value: string) {
    const normalized = String(value || '').trim().toLowerCase();
    const allowed = ['active', 'inactive', 'draft'];
    if (!allowed.includes(normalized)) {
      throw new BadRequestException('Event status must be active, inactive, or draft');
    }
    return normalized;
  }

  private normalizeProductStatus(value: string) {
    const normalized = String(value || '').trim().toLowerCase();
    const allowed = ['available', 'out_of_stock', 'discontinued'];
    if (!allowed.includes(normalized)) {
      throw new BadRequestException(
        'Product status must be available, out_of_stock, or discontinued',
      );
    }
    return normalized;
  }

  private normalizeOrderStatus(value: string) {
    const normalized = String(value || '').trim().toLowerCase();
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'canceled'];
    if (!allowed.includes(normalized)) {
      throw new BadRequestException(
        'Order status must be pending, processing, shipped, delivered, or canceled',
      );
    }
    return normalized;
  }

  private toNonNegativeInt(value: unknown, fallback = 0) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('Expected a numeric value');
    }
    const rounded = Math.max(0, Math.round(parsed));
    return rounded;
  }
}
