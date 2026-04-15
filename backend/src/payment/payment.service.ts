import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { BooksService } from '../books/books.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly booksService: BooksService) {}

  // Placeholder for Stripe integration
  async processStripePayment(paymentData: any) {
    // TODO: Implement Stripe payment processing
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({...});

    console.log('Processing Stripe payment:', paymentData);
    return {
      success: true,
      transactionId: `stripe_${Date.now()}`,
      status: 'completed',
      message: 'Payment processed successfully (Stripe placeholder)'
    };
  }

  // Placeholder for Flutterwave integration
  async processFlutterwavePayment(paymentData: any) {
    // TODO: Implement Flutterwave payment processing
    // const Flutterwave = require('flutterwave-node-v3');
    // const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);

    console.log('Processing Flutterwave payment:', paymentData);
    return {
      success: true,
      transactionId: `flw_${Date.now()}`,
      status: 'completed',
      message: 'Payment processed successfully (Flutterwave placeholder)'
    };
  }

  // Generic payment processing method
  async processPayment(provider: 'stripe' | 'flutterwave', paymentData: any) {
    switch (provider) {
      case 'stripe':
        return this.processStripePayment(paymentData);
      case 'flutterwave':
        return this.processFlutterwavePayment(paymentData);
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  // Process generic payment from frontend
  async processGenericPayment(paymentData: any) {
    console.log('Processing generic payment:', paymentData);

    // Basic validation
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!paymentData.email) {
      throw new Error('Email is required');
    }

    // For now, simulate payment processing
    // In production, integrate with actual payment providers
    const transactionId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      transactionId,
      status: 'completed',
      message: 'Payment processed successfully',
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      paymentMethod: paymentData.paymentMethod,
      timestamp: new Date().toISOString()
    };
  }

  async handleStripeWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;
      case 'invoice.paid':
        this.logger.log('invoice.paid received');
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const userId = String(metadata.userId || '').trim();
    const bookId = String(metadata.bookId || '').trim();

    if (session.payment_status !== 'paid') {
      this.logger.warn(`Checkout session ${session.id} is not paid. status=${session.payment_status}`);
      return;
    }

    if (!userId || !bookId) {
      this.logger.log(`Checkout session ${session.id} completed without book metadata`);
      return;
    }

    try {
      await this.booksService.recordSuccessfulPaymentAndGrantEntitlement({
        provider: 'STRIPE',
        providerEventId: session.id,
        eventType: event.type,
        userId,
        bookId,
        idempotencyKey: String(metadata.idempotencyKey || '').trim() || session.id,
        amountCents: session.amount_total ?? null,
        currency: session.currency || null,
        metadata: {
          stripeEventId: event.id,
          checkoutSessionId: session.id,
          customerEmail: session.customer_details?.email || null,
          paymentStatus: session.payment_status,
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to grant entitlement from checkout session ${session.id}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  // Membership payment processing
  async processMembershipPayment(userId: string, amount: number, provider: 'stripe' | 'flutterwave' = 'stripe') {
    const paymentData = {
      amount,
      currency: 'USD',
      description: 'Sankofa Alkebulan Journal Membership',
      metadata: { userId, type: 'membership' }
    };

    return this.processPayment(provider, paymentData);
  }

  // Product purchase payment processing
  async processProductPayment(productId: string, userId: string, amount: number, provider: 'stripe' | 'flutterwave' = 'stripe') {
    const paymentData = {
      amount,
      currency: 'USD',
      description: 'Sankofa Marketplace Purchase',
      metadata: { userId, productId, type: 'product' }
    };

    return this.processPayment(provider, paymentData);
  }
}
