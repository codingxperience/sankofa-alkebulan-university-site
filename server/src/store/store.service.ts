import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { AuditService, SYSTEM_ACTOR } from '../audit/audit.service';
import { generateToken, hashToken, hmac, safeEqual } from '../common/crypto/tokens';
import { randomCode, withUniqueReference } from '../common/crypto/references';
import { ApiError, notFound } from '../common/http/errors';
import { logger } from '../common/logger';
import { currentRequestContext } from '../common/request-context';
import type { FulfilmentMethod, Order, OrderItem, PaymentRail, Prisma, Product } from '../generated/prisma/client';
import { PrismaService, isUniqueViolation, table } from '../database/prisma.service';
import { OutboxService } from '../notifications/outbox.service';
import { orderPaid, orderPlaced, orderStaffAlert } from '../notifications/templates';
import { OfficeRoutesService } from '../settings/office-routes.service';
import { FlutterwaveClient } from './flutterwave.client';
import { DELIVERY, FULFILMENT_LABELS, RAIL_LABELS, SIZES } from './fulfilment';

export interface OrderRequest {
  items: Array<{ sku: string; quantity: number; size?: string }>;
  customer: { name: string; email: string; phone?: string; address?: string };
  fulfilment: FulfilmentMethod;
  rail: PaymentRail;
  clientRequestId?: string;
  website?: string;
}

export type PaymentInstruction =
  | { mode: 'hosted'; url: string }
  | { mode: 'manual'; message: string };

const MAX_LINES = 30;

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
    private readonly offices: OfficeRoutesService,
    private readonly flutterwave: FlutterwaveClient,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  /** Live prices and availability, merged by the storefront onto its own product copy. */
  async catalog() {
    const products = await this.prisma.product.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    return {
      currency: 'USD',
      delivery: Object.entries(DELIVERY).map(([method, option]) => ({ method, ...option })),
      cardCheckout: this.flutterwave.configured,
      products: products.map((product) => ({
        sku: product.sku,
        name: product.name,
        kind: product.kind,
        status: product.status,
        priceCents: product.priceCents,
        hasSizes: product.hasSizes,
        isDigital: product.isDigital,
        stockRemaining: product.stockRemaining,
      })),
    };
  }

  async placeOrder(input: OrderRequest) {
    if (input.website) {
      logger.info({ msg: 'Order honeypot triggered' });
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_input', 'Please try again.');
    }
    if (input.clientRequestId) {
      const replay = await this.prisma.order.findUnique({ where: { clientRequestId: input.clientRequestId }, include: { items: true } });
      if (replay) {
        // The access key is only ever shown once; a retry gets a fresh one for the same order.
        const accessKey = generateToken(18);
        await this.prisma.order.update({ where: { id: replay.id }, data: { accessKeyHash: hashToken(accessKey) } });
        return {
          order: this.present(replay, replay.items),
          accessKey,
          payment: this.manualInstruction(replay),
          confirmationEmailed: this.outbox.deliveryConfigured,
        };
      }
    }

    const lines = this.mergeLines(input.items);
    const products = await this.prisma.product.findMany({ where: { sku: { in: lines.map((line) => line.sku) } } });
    const bySku = new Map(products.map((product) => [product.sku, product]));
    const priced = lines.map((line, index) => this.priceLine(line, bySku.get(line.sku), index));

    const allDigital = priced.every(({ product }) => product.isDigital);
    const fulfilment: FulfilmentMethod = allDigital ? 'DIGITAL' : input.fulfilment;
    if (fulfilment === 'DIGITAL' && !allDigital) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_input', 'Choose how you would like physical items delivered.', {
        fulfilment: 'Choose pickup, courier or express delivery.',
      });
    }
    if ((fulfilment === 'COURIER' || fulfilment === 'EXPRESS') && !input.customer.address) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_input', 'Add the address we should deliver to.', {
        'customer.address': 'A delivery address is needed for courier and express delivery.',
      });
    }
    if (input.rail === 'MOBILE_MONEY' && !input.customer.phone) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_input', 'Add the mobile money number to pay from.', {
        'customer.phone': 'Mobile money payments need a phone number.',
      });
    }

    const subtotalCents = priced.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
    const deliveryCents = fulfilment === 'DIGITAL' ? 0 : DELIVERY[fulfilment].cents;
    const accessKey = generateToken(18);
    const ip = currentRequestContext()?.ip ?? 'unknown';
    const route = await this.offices.get('CENTRAL');

    const { order, items, emailIds } = await withUniqueReference(
      (number) =>
        this.prisma.$transaction(async (tx) => {
          for (const line of priced) {
            if (line.product.stockRemaining !== null) {
              await this.reserveStock(tx, line.product, line.quantity);
            }
          }
          const created = await tx.order.create({
            data: {
              number,
              customerName: input.customer.name,
              customerEmail: input.customer.email,
              customerPhone: input.customer.phone,
              deliveryAddress: fulfilment === 'COURIER' || fulfilment === 'EXPRESS' ? input.customer.address : null,
              fulfilment,
              paymentRail: input.rail,
              currency: 'USD',
              subtotalCents,
              deliveryCents,
              totalCents: subtotalCents + deliveryCents,
              accessKeyHash: hashToken(accessKey),
              clientRequestId: input.clientRequestId,
              submitterHash: hmac(this.config.secret, 'submitter', ip).slice(0, 32),
              items: {
                create: priced.map((line) => ({
                  productId: line.product.id,
                  sku: line.product.sku,
                  name: line.product.name,
                  size: line.size,
                  quantity: line.quantity,
                  unitPriceCents: line.unitPriceCents,
                  lineTotalCents: line.unitPriceCents * line.quantity,
                })),
              },
            },
            include: { items: true },
          });

          const ids = [
            await this.outbox.enqueue(
              {
                template: 'order.placed',
                to: created.customerEmail,
                toName: created.customerName,
                parts: orderPlaced({
                  name: created.customerName,
                  number: created.number,
                  lines: created.items,
                  currency: created.currency,
                  deliveryCents: created.deliveryCents,
                  totalCents: created.totalCents,
                  fulfilmentLabel: FULFILMENT_LABELS[created.fulfilment],
                  paymentNextStep: this.nextStepText(created),
                  statusUrl: this.statusUrl(created.number, accessKey),
                }),
                related: { type: 'order', id: created.id },
              },
              tx,
            ),
          ];
          for (const to of route.notifyEmails) {
            ids.push(
              await this.outbox.enqueue(
                {
                  template: 'order.staff_alert',
                  to,
                  replyTo: created.customerEmail,
                  parts: orderStaffAlert({
                    number: created.number,
                    name: created.customerName,
                    email: created.customerEmail,
                    totalCents: created.totalCents,
                    currency: created.currency,
                    lines: created.items,
                    deliveryCents: created.deliveryCents,
                    fulfilmentLabel: FULFILMENT_LABELS[created.fulfilment],
                    railLabel: RAIL_LABELS[created.paymentRail],
                    adminUrl: `${this.config.siteUrl}/admin/store/orders/${created.id}`,
                  }),
                  related: { type: 'order', id: created.id },
                },
                tx,
              ),
            );
          }
          return { order: created, items: created.items, emailIds: ids };
        }),
      () => `SAU-${randomCode(6)}`,
      (error) => isUniqueViolation(error, 'number'),
    );

    this.outbox.deliverInBackground(emailIds);
    const payment = await this.startPayment(order);
    return { order: this.present(order, items), accessKey, payment, confirmationEmailed: this.outbox.deliveryConfigured };
  }

  /** The customer's view of an order, opened with the private key from their confirmation. */
  async orderStatus(number: string, accessKey: string, refresh: boolean) {
    const order = await this.prisma.order.findUnique({ where: { number }, include: { items: true } });
    if (!order || !accessKey || !safeEqual(order.accessKeyHash, hashToken(accessKey))) {
      throw notFound('We could not find an order with that number and key.');
    }
    if (refresh && order.paymentStatus === 'PENDING' && order.paymentProvider === 'flutterwave' && order.paymentReference) {
      await this.reconcileFlutterwave(order.paymentReference).catch((error) =>
        logger.warn({ msg: 'Payment verification failed', order: order.number, err: error }),
      );
      const fresh = await this.prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
      return this.present(fresh, fresh.items);
    }
    return this.present(order, order.items);
  }

  /** Flutterwave webhook: authenticated by hash, recorded once, then verified against the API. */
  async handleWebhook(signature: string | undefined, body: unknown): Promise<void> {
    if (!this.flutterwave.webhookAuthentic(signature)) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'invalid_signature', 'Webhook signature not recognised.');
    }
    const payload = (body ?? {}) as { event?: string; data?: { id?: number; tx_ref?: string; status?: string } };
    const txRef = payload.data?.tx_ref;
    const eventId = payload.data?.id ? String(payload.data.id) : undefined;
    if (!txRef || !eventId) {
      return;
    }
    const order = await this.prisma.order.findUnique({ where: { paymentReference: txRef } });
    try {
      await this.prisma.paymentEvent.create({
        data: {
          provider: 'flutterwave',
          providerEventId: `${payload.event ?? 'event'}:${eventId}`,
          orderId: order?.id,
          kind: payload.event ?? 'unknown',
          outcome: payload.data?.status ?? 'unknown',
          payload: body as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return; // A redelivery of something already handled.
      }
      throw error;
    }
    if (order) {
      await this.reconcileFlutterwave(txRef);
    }
  }

  // ─── Payment ──────────────────────────────────────────────────────────

  private async startPayment(order: Order): Promise<PaymentInstruction> {
    if (order.paymentRail !== 'CARD' || !this.flutterwave.configured) {
      return this.manualInstruction(order);
    }
    const txRef = `${order.number}-${randomCode(4)}`;
    try {
      const checkout = await this.flutterwave.createCheckout({
        txRef,
        amountCents: order.totalCents,
        currency: order.currency,
        redirectUrl: `${this.config.siteUrl}/store/orders/${order.number}`,
        customer: { email: order.customerEmail, name: order.customerName, phone: order.customerPhone },
        paymentOptions: 'card',
        title: 'Sankofa Alkebulan University',
        description: `Order ${order.number}`,
      });
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentProvider: 'flutterwave', paymentReference: txRef, paymentStatus: 'PENDING' },
      });
      return { mode: 'hosted', url: checkout.link };
    } catch (error) {
      logger.error({ msg: 'Could not start card checkout', order: order.number, err: error });
      return this.manualInstruction(order);
    }
  }

  /**
   * Marks an order paid only when Flutterwave itself confirms a successful
   * transaction for exactly the amount and currency we charged.
   */
  private async reconcileFlutterwave(txRef: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { paymentReference: txRef } });
    if (!order || order.paymentStatus === 'PAID') {
      return;
    }
    const transaction = await this.flutterwave.verifyByReference(txRef);
    if (!transaction) {
      return;
    }
    const expected = order.totalCents / 100;
    const matches =
      transaction.status === 'successful' &&
      transaction.currency === order.currency &&
      Math.round(transaction.amount * 100) >= Math.round(expected * 100);
    if (transaction.status === 'failed') {
      await this.prisma.order.updateMany({ where: { id: order.id, paymentStatus: 'PENDING' }, data: { paymentStatus: 'FAILED' } });
      return;
    }
    if (!matches) {
      if (transaction.status === 'successful') {
        logger.error({ msg: 'Payment amount or currency mismatch', order: order.number, transaction });
      }
      return;
    }
    await this.markPaid(order, { provider: 'flutterwave', reference: txRef, summary: `Flutterwave confirmed card payment ${transaction.id}.` });
  }

  /** Shared by provider confirmations and staff recording an offline payment. Safe to call twice. */
  async markPaid(order: Order, payment: { provider: string; reference: string; summary: string; actor?: { id: string | null; label: string } }) {
    const emailId = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: { not: 'PAID' } },
        data: { paymentStatus: 'PAID', paidAt: new Date(), paymentProvider: payment.provider, paymentReference: payment.reference },
      });
      if (claimed.count === 0) {
        return null;
      }
      const fresh = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
      if (fresh.status === 'AWAITING_PAYMENT') {
        await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
      }
      await this.audit.record(
        {
          actor: payment.actor ?? SYSTEM_ACTOR,
          action: 'order.paid',
          entityType: 'order',
          entityId: order.id,
          summary:
            fresh.status === 'AWAITING_PAYMENT'
              ? `Order ${order.number} paid — ${payment.summary}`
              : `Payment arrived for order ${order.number}, which is ${fresh.status.toLowerCase().replace(/_/g, ' ')} — refund or reinstate it. ${payment.summary}`,
        },
        tx,
      );
      if (fresh.status !== 'AWAITING_PAYMENT') {
        return null;
      }
      return this.outbox.enqueue(
        {
          template: 'order.paid',
          to: order.customerEmail,
          toName: order.customerName,
          parts: orderPaid({
            name: order.customerName,
            number: order.number,
            totalCents: order.totalCents,
            currency: order.currency,
          }),
          related: { type: 'order', id: order.id },
        },
        tx,
      );
    });
    if (emailId) {
      this.outbox.deliverInBackground([emailId]);
    }
    return emailId !== null;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private mergeLines(items: OrderRequest['items']) {
    if (items.length === 0) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'empty_order', 'Your bag is empty.');
    }
    const merged = new Map<string, { sku: string; size?: string; quantity: number }>();
    for (const item of items) {
      const key = `${item.sku}|${item.size ?? ''}`;
      const existing = merged.get(key);
      merged.set(key, { sku: item.sku, size: item.size, quantity: (existing?.quantity ?? 0) + item.quantity });
    }
    if (merged.size > MAX_LINES) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'too_many_items', `An order can hold at most ${MAX_LINES} different items.`);
    }
    return [...merged.values()];
  }

  private priceLine(line: { sku: string; size?: string; quantity: number }, product: Product | undefined, index: number) {
    const field = `items.${index}`;
    if (!product || product.status === 'ARCHIVED') {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'unknown_product', 'One of the items is no longer sold.', { [field]: 'No longer available.' });
    }
    if (product.status === 'SOLD_OUT') {
      throw new ApiError(HttpStatus.CONFLICT, 'sold_out', `${product.name} has sold out.`, { [field]: 'Sold out.' });
    }
    if (product.priceCents === 0) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'free_item', `${product.name} is free to read — no order needed.`, { [field]: 'Free item.' });
    }
    if (product.hasSizes && !SIZES.includes(line.size as (typeof SIZES)[number])) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'size_required', `Choose a size for ${product.name}.`, { [field]: 'Choose a size.' });
    }
    if (line.quantity > 20) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'quantity_limit', 'For more than 20 of one item, please contact the store desk.', { [field]: 'At most 20.' });
    }
    return {
      product,
      size: product.hasSizes ? line.size : undefined,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
    };
  }

  /** Takes stock atomically; the CHECK constraint makes overselling impossible even under a race. */
  private async reserveStock(tx: Prisma.TransactionClient, product: Product, quantity: number): Promise<void> {
    const rows = await tx.$queryRaw<Array<{ stock_remaining: number }>>`
      UPDATE ${table('products')}
      SET "stock_remaining" = "stock_remaining" - ${quantity},
          "status" = CASE WHEN "stock_remaining" - ${quantity} = 0 THEN 'SOLD_OUT'::"sankofa"."ProductStatus" ELSE "status" END,
          "updated_at" = now()
      WHERE "id" = ${product.id}::uuid AND "stock_remaining" >= ${quantity}
      RETURNING "stock_remaining"
    `;
    if (rows.length === 0) {
      const latest = await tx.product.findUniqueOrThrow({ where: { id: product.id } });
      const left = latest.stockRemaining ?? 0;
      throw new ApiError(
        HttpStatus.CONFLICT,
        'insufficient_stock',
        left === 0 ? `${product.name} has just sold out.` : `Only ${left} of ${product.name} ${left === 1 ? 'is' : 'are'} left.`,
      );
    }
  }

  private nextStepText(order: Order): string {
    if (order.paymentRail === 'CARD' && this.flutterwave.configured) {
      return 'Complete your card payment on the secure Flutterwave page. If you closed it, open your order below to try again.';
    }
    if (order.paymentRail === 'MOBILE_MONEY') {
      return `Our bursary desk will contact you on ${order.customerPhone} with mobile money payment instructions. Your items are reserved in the meantime.`;
    }
    return 'Our bursary desk will email you a secure card payment link. Your items are reserved in the meantime.';
  }

  private manualInstruction(order: Order): PaymentInstruction {
    return { mode: 'manual', message: this.nextStepText(order) };
  }

  private statusUrl(number: string, accessKey: string): string {
    return `${this.config.siteUrl}/store/orders/${number}#key=${accessKey}`;
  }

  present(order: Order, items: OrderItem[]) {
    return {
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentRail: order.paymentRail,
      fulfilment: order.fulfilment,
      fulfilmentLabel: FULFILMENT_LABELS[order.fulfilment],
      currency: order.currency,
      subtotalCents: order.subtotalCents,
      deliveryCents: order.deliveryCents,
      totalCents: order.totalCents,
      customerName: order.customerName,
      items: items.map((item) => ({
        sku: item.sku,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
      })),
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  }
}
