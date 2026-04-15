import { Controller, Post, Req, Res, BadRequestException, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  async webhook(@Req() req: Request, @Res() res: Response) {
    const stripeSecret = process.env.STRIPE_SECRET;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret || !webhookSecret) {
      throw new BadRequestException('STRIPE_SECRET and STRIPE_WEBHOOK_SECRET must be configured');
    }

    const sig = req.headers['stripe-signature'] as string | undefined;
    const rawBody = (req as any).rawBody || '';

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
      if (!sig) throw new Error('Missing stripe-signature header');
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message || err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await this.paymentService.handleStripeWebhookEvent(event);
    } catch (err: any) {
      console.error('Failed to handle webhook event:', err.message || err);
      return res.status(500).json({ received: false, message: 'Failed to process webhook' });
    }

    res.json({ received: true });
  }

  @Post('stripe')
  async processStripePayment(@Body() paymentData: any) {
    return this.paymentService.processStripePayment(paymentData);
  }

  @Post('flutterwave')
  async processFlutterwavePayment(@Body() paymentData: any) {
    return this.paymentService.processFlutterwavePayment(paymentData);
  }

  @Post('process')
  async processPayment(@Body() paymentData: any) {
    return this.paymentService.processGenericPayment(paymentData);
  }

  @Post('membership')
  async processMembershipPayment(@Body() body: { userId: string; amount: number; provider?: 'stripe' | 'flutterwave' }) {
    return this.paymentService.processMembershipPayment(body.userId, body.amount, body.provider);
  }

  @Post('product')
  async processProductPayment(@Body() body: { productId: string; userId: string; amount: number; provider?: 'stripe' | 'flutterwave' }) {
    return this.paymentService.processProductPayment(body.productId, body.userId, body.amount, body.provider);
  }
}
