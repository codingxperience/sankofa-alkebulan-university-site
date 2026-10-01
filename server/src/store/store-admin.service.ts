import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiError, notFound } from '../common/http/errors';
import { afterCursor, decodeCursor, toPage } from '../common/http/pagination';
import type { OrderStatus, Prisma, ProductStatus } from '../generated/prisma/client';
import { PrismaService, isUniqueViolation, table } from '../database/prisma.service';
import type { StaffPrincipal } from '../staff/sessions.service';
import { actorOf } from '../staff/staff.guard';
import { FULFILMENT_LABELS, RAIL_LABELS } from './fulfilment';
import { StoreService } from './store.service';

/** Where an order may go next. Payment moves AWAITING_PAYMENT → PAID; staff do the rest. */
const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  AWAITING_PAYMENT: ['CANCELLED'],
  PAID: ['FULFILLING', 'DISPATCHED', 'READY_FOR_PICKUP', 'COMPLETED', 'REFUNDED'],
  FULFILLING: ['DISPATCHED', 'READY_FOR_PICKUP', 'COMPLETED', 'REFUNDED'],
  DISPATCHED: ['COMPLETED', 'REFUNDED'],
  READY_FOR_PICKUP: ['COMPLETED', 'REFUNDED'],
  COMPLETED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

const STATUS_WORDS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: 'awaiting payment',
  PAID: 'paid',
  FULFILLING: 'being prepared',
  DISPATCHED: 'dispatched',
  READY_FOR_PICKUP: 'ready for pickup',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

@Injectable()
export class StoreAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly store: StoreService,
  ) {}

  async products() {
    const [products, sold] = await Promise.all([
      this.prisma.product.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
        _sum: { quantity: true },
      }),
    ]);
    return products.map((product) => ({
      ...product,
      sold: sold.find((row) => row.productId === product.id)?._sum.quantity ?? 0,
    }));
  }

  async updateProduct(staff: StaffPrincipal, id: string, input: { priceCents?: number; status?: ProductStatus; stockRemaining?: number | null }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw notFound('That product no longer exists.');
    }
    const changes: string[] = [];
    if (input.priceCents !== undefined && input.priceCents !== product.priceCents) {
      changes.push(`price ${(product.priceCents / 100).toFixed(2)} → ${(input.priceCents / 100).toFixed(2)} USD`);
    }
    if (input.status && input.status !== product.status) {
      changes.push(`status → ${input.status.toLowerCase().replace('_', ' ')}`);
    }
    if (input.stockRemaining !== undefined && input.stockRemaining !== product.stockRemaining) {
      changes.push(`stock → ${input.stockRemaining ?? 'untracked'}`);
    }
    const updated = await this.prisma.product.update({ where: { id }, data: input });
    if (changes.length) {
      await this.audit.record({
        actor: actorOf(staff),
        action: 'product.updated',
        entityType: 'product',
        entityId: id,
        summary: `${staff.name} updated ${product.name}: ${changes.join('; ')}.`,
      });
    }
    return updated;
  }

  private where(query: { status?: OrderStatus | 'OPEN'; q?: string }): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};
    if (query.status === 'OPEN') {
      where.status = { in: ['AWAITING_PAYMENT', 'PAID', 'FULFILLING', 'DISPATCHED', 'READY_FOR_PICKUP'] };
    } else if (query.status) {
      where.status = query.status;
    }
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { number: { equals: q.toUpperCase() } },
        { customerEmail: { contains: q.toLowerCase() } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { paymentReference: { equals: q } },
      ];
    }
    return where;
  }

  async orders(query: { status?: OrderStatus | 'OPEN'; q?: string; cursor?: string; limit: number }) {
    const rows = await this.prisma.order.findMany({
      where: { AND: [this.where(query), afterCursor(decodeCursor(query.cursor))] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      include: { _count: { select: { items: true } } },
    });
    return toPage(rows, query.limit, (row) => ({
      id: row.id,
      number: row.number,
      status: row.status,
      paymentStatus: row.paymentStatus,
      paymentRail: row.paymentRail,
      fulfilment: row.fulfilment,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      totalCents: row.totalCents,
      currency: row.currency,
      lines: row._count.items,
      createdAt: row.createdAt,
    }));
  }

  async order(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, paymentEvents: { orderBy: { receivedAt: 'asc' }, select: { id: true, provider: true, kind: true, outcome: true, receivedAt: true } } },
    });
    if (!order) {
      throw notFound('That order no longer exists.');
    }
    const activity = await this.prisma.auditEvent.findMany({
      where: { entityType: 'order', entityId: id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, actorLabel: true, action: true, summary: true, createdAt: true },
    });
    const { accessKeyHash: _key, submitterHash: _submitter, clientRequestId: _request, ...visible } = order;
    return {
      ...visible,
      fulfilmentLabel: FULFILMENT_LABELS[order.fulfilment],
      railLabel: RAIL_LABELS[order.paymentRail],
      nextStatuses: NEXT[order.status],
      activity,
    };
  }

  async updateOrder(staff: StaffPrincipal, id: string, input: { status?: OrderStatus; staffNote?: string | null }) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) {
      throw notFound('That order no longer exists.');
    }
    if (input.status && input.status !== order.status && !NEXT[order.status].includes(input.status)) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'invalid_transition',
        `An order that is ${STATUS_WORDS[order.status]} cannot be marked ${STATUS_WORDS[input.status]}.`,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: input.status,
          staffNote: input.staffNote,
          ...(input.status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
          ...(input.status === 'REFUNDED' ? { paymentStatus: 'REFUNDED' as const } : {}),
        },
      });
      // A cancelled order returns its reserved limited-edition stock.
      if (input.status === 'CANCELLED') {
        for (const item of order.items) {
          await tx.$executeRaw`
            UPDATE ${table('products')}
            SET "stock_remaining" = "stock_remaining" + ${item.quantity},
                "status" = CASE WHEN "status" = 'SOLD_OUT' THEN 'AVAILABLE'::"sankofa"."ProductStatus" ELSE "status" END,
                "updated_at" = now()
            WHERE "id" = ${item.productId}::uuid AND "stock_remaining" IS NOT NULL
          `;
        }
      }
      const parts: string[] = [];
      if (input.status && input.status !== order.status) parts.push(`marked order ${order.number} ${STATUS_WORDS[input.status]}`);
      if (input.staffNote !== undefined && input.staffNote !== order.staffNote) parts.push(`updated the note on ${order.number}`);
      if (parts.length) {
        await this.audit.record(
          { actor: actorOf(staff), action: 'order.updated', entityType: 'order', entityId: id, summary: `${staff.name} ${parts.join(' and ')}.` },
          tx,
        );
      }
    });
    return this.order(id);
  }

  /** Records a payment received outside the hosted checkout: mobile money, bank transfer, cash. */
  async recordPayment(staff: StaffPrincipal, id: string, input: { method: string; reference: string }) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw notFound('That order no longer exists.');
    }
    if (order.paymentStatus === 'PAID') {
      throw new ApiError(HttpStatus.CONFLICT, 'already_paid', 'This order is already marked as paid.');
    }
    try {
      await this.store.markPaid(order, {
        provider: input.method,
        reference: input.reference,
        summary: `${staff.name} recorded a ${input.method.replace(/_/g, ' ')} payment (reference ${input.reference}).`,
        actor: actorOf(staff),
      });
    } catch (error) {
      if (isUniqueViolation(error, 'payment_reference')) {
        throw new ApiError(HttpStatus.CONFLICT, 'reference_used', 'That payment reference is already recorded against another order.', {
          reference: 'Already used on another order.',
        });
      }
      throw error;
    }
    return this.order(id);
  }

  async stats() {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const [byStatus, revenue, revenue30, top] = await Promise.all([
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalCents: true } }),
      this.prisma.order.aggregate({ where: { paymentStatus: 'PAID', paidAt: { gte: since } }, _sum: { totalCents: true } }),
      this.prisma.orderItem.groupBy({
        by: ['sku', 'name'],
        where: { order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
        _sum: { quantity: true, lineTotalCents: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);
    return {
      status: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      revenueCents: revenue._sum.totalCents ?? 0,
      revenue30dCents: revenue30._sum.totalCents ?? 0,
      topProducts: top.map((row) => ({ sku: row.sku, name: row.name, quantity: row._sum.quantity ?? 0, revenueCents: row._sum.lineTotalCents ?? 0 })),
    };
  }

  async exportRows(staff: StaffPrincipal, query: { status?: OrderStatus | 'OPEN'; q?: string }) {
    const rows = await this.prisma.order.findMany({ where: this.where(query), orderBy: { createdAt: 'asc' }, include: { items: true }, take: 10_000 });
    await this.audit.record({
      actor: actorOf(staff),
      action: 'order.exported',
      entityType: 'order',
      summary: `${staff.name} exported ${rows.length} order${rows.length === 1 ? '' : 's'} to CSV.`,
    });
    return {
      headers: ['Order', 'Status', 'Payment', 'Pays by', 'Delivery', 'Customer', 'Email', 'Phone', 'Address', 'Items', 'Subtotal', 'Delivery fee', 'Total', 'Currency', 'Payment reference', 'Placed at', 'Paid at'],
      rows: rows.map((o) => [
        o.number, STATUS_WORDS[o.status], o.paymentStatus.toLowerCase(), RAIL_LABELS[o.paymentRail], FULFILMENT_LABELS[o.fulfilment],
        o.customerName, o.customerEmail, o.customerPhone, o.deliveryAddress,
        o.items.map((i) => `${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ''}`),
        (o.subtotalCents / 100).toFixed(2), (o.deliveryCents / 100).toFixed(2), (o.totalCents / 100).toFixed(2), o.currency,
        o.paymentReference, o.createdAt, o.paidAt,
      ]),
    };
  }
}
