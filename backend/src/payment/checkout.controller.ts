import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

@Controller('payment')
export class CheckoutController {
  @Post('create-checkout-session')
  async createCheckout(@Body() body: any) {
    const stripeSecret = process.env.STRIPE_SECRET;
    const stripePub = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!stripeSecret) throw new BadRequestException('STRIPE_SECRET not configured');

    const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
    const idempotencyKey = String(body.idempotencyKey || '').trim() || randomUUID();
    const clientReferenceId = String(body.clientReferenceId || body.userId || '').trim() || undefined;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: (body.items || []).map((it: any) => ({ price_data: { currency: 'usd', product_data: { name: it.name }, unit_amount: Math.round((it.amount || 0) * 100) }, quantity: it.quantity || 1 })),
      success_url: body.successUrl || 'http://localhost:4200/payment?success=1',
      cancel_url: body.cancelUrl || 'http://localhost:4200/payment?canceled=1',
      metadata: {
        userId: String(body.userId || ''),
        bookId: String(body.bookId || ''),
        purpose: String(body.purpose || 'general'),
        idempotencyKey,
      },
      client_reference_id: clientReferenceId,
    }, {
      idempotencyKey,
    });

    return { url: session.url, id: session.id, publishableKey: stripePub, idempotencyKey };
  }
}
