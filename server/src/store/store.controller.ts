import { Body, Controller, Get, Header, Headers, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { sendCsv, toCsv } from '../common/http/csv';
import { pageQuery } from '../common/http/pagination';
import { validate } from '../common/http/zod.pipe';
import { clientRequestId, email, honeypot, line, optionalLine, phone } from '../common/validation/fields';
import { FulfilmentMethod, OrderStatus, PaymentRail, ProductStatus } from '../generated/prisma/client';
import { RateLimit } from '../security/rate-limit.guard';
import { SkipOriginCheck } from '../security/origin.guard';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly } from '../staff/staff.guard';
import { SIZES } from './fulfilment';
import { StoreAdminService } from './store-admin.service';
import { StoreService } from './store.service';

const OrderBody = z.object({
  items: z
    .array(
      z.object({
        sku: z.string().regex(/^[a-z0-9-]{2,60}$/, 'Unknown product.'),
        quantity: z.number().int().min(1).max(20),
        size: z.enum(SIZES).optional(),
      }),
    )
    .min(1, 'Your bag is empty.')
    .max(60),
  customer: z.object({
    name: line('Full name', 120, 2),
    email,
    phone,
    address: optionalLine('Delivery address', 300),
  }),
  fulfilment: z.enum(FulfilmentMethod, { error: 'Choose how you would like your order delivered.' }),
  rail: z.enum(PaymentRail, { error: 'Choose how you would like to pay.' }),
  clientRequestId,
  website: honeypot,
});

const OrderNumber = z.string().regex(/^SAU-[0-9A-Z]{6}$/);
const StatusQuery = z.object({ refresh: z.enum(['1', 'true']).optional() });

@Controller('store')
export class PublicStoreController {
  constructor(private readonly store: StoreService) {}

  @Get('catalog')
  @Header('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=600')
  catalog() {
    return this.store.catalog();
  }

  @Post('orders')
  @HttpCode(201)
  @RateLimit(
    { bucket: 'order.minute', limit: 3, windowSeconds: 60 },
    { bucket: 'order.hour', limit: 12, windowSeconds: 3600 },
  )
  place(@Body(validate(OrderBody)) body: z.infer<typeof OrderBody>) {
    return this.store.placeOrder(body);
  }

  /** The key travels in a header, never in the URL, so it stays out of logs. */
  @Get('orders/:number')
  @RateLimit({ bucket: 'order.lookup', limit: 60, windowSeconds: 600 })
  status(
    @Param('number', validate(OrderNumber)) number: string,
    @Headers('x-order-key') key: string | undefined,
    @Query(validate(StatusQuery)) query: z.infer<typeof StatusQuery>,
  ) {
    return this.store.orderStatus(number, key ?? '', Boolean(query.refresh));
  }

  @Post('payments/flutterwave/webhook')
  @HttpCode(200)
  @SkipOriginCheck()
  @RateLimit({ bucket: 'payment.webhook', limit: 300, windowSeconds: 60 })
  async webhook(@Headers('verif-hash') signature: string | undefined, @Body() body: unknown) {
    await this.store.handleWebhook(signature, body);
    return { received: true };
  }
}

const ProductPatch = z
  .object({
    priceCents: z.number().int().min(0).max(10_000_000).optional(),
    status: z.enum(ProductStatus).optional(),
    stockRemaining: z.number().int().min(0).max(1_000_000).nullable().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), 'Nothing to change.');

const OrderFilters = {
  status: z.union([z.enum(OrderStatus), z.literal('OPEN')]).optional(),
  q: z.string().trim().max(120).optional(),
};
const OrdersQuery = z.object({ ...OrderFilters, ...pageQuery });
const OrdersExport = z.object(OrderFilters);

const OrderPatch = z
  .object({
    status: z.enum(OrderStatus).optional(),
    // undefined leaves the note alone; null or an empty string clears it.
    staffNote: z
      .string()
      .max(2000)
      .nullable()
      .optional()
      .transform((value) => (value === undefined ? undefined : value?.trim() || null)),
  })
  .refine((body) => body.status || body.staffNote !== undefined, 'Nothing to change.');

const PaymentBody = z.object({
  method: z.enum(['mobile_money', 'bank_transfer', 'cash', 'card_terminal']),
  reference: line('Payment reference', 120, 3),
});

@Controller('admin/store')
export class AdminStoreController {
  constructor(private readonly admin: StoreAdminService) {}

  @Get('products')
  @StaffOnly('store.read')
  products() {
    return this.admin.products();
  }

  @Patch('products/:id')
  @StaffOnly('store.manage')
  updateProduct(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(ProductPatch)) body: z.infer<typeof ProductPatch>,
  ) {
    return this.admin.updateProduct(staff, id, body);
  }

  @Get('stats')
  @StaffOnly('store.read')
  stats() {
    return this.admin.stats();
  }

  @Get('orders')
  @StaffOnly('store.read')
  orders(@Query(validate(OrdersQuery)) query: z.infer<typeof OrdersQuery>) {
    return this.admin.orders(query);
  }

  @Get('orders/export')
  @StaffOnly('store.read')
  async export(@CurrentStaff() staff: StaffPrincipal, @Query(validate(OrdersExport)) query: z.infer<typeof OrdersExport>, @Res() res: Response) {
    const { headers, rows } = await this.admin.exportRows(staff, query);
    sendCsv(res, `sankofa-orders-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
  }

  @Get('orders/:id')
  @StaffOnly('store.read')
  order(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admin.order(id);
  }

  @Patch('orders/:id')
  @StaffOnly('store.manage')
  updateOrder(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(OrderPatch)) body: z.infer<typeof OrderPatch>,
  ) {
    return this.admin.updateOrder(staff, id, body);
  }

  @Post('orders/:id/payment')
  @StaffOnly('store.manage')
  recordPayment(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(PaymentBody)) body: z.infer<typeof PaymentBody>,
  ) {
    return this.admin.recordPayment(staff, id, body);
  }
}
