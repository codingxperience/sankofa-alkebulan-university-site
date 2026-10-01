import { Injectable } from '@nestjs/common';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { safeEqual } from '../common/crypto/tokens';

const API = 'https://api.flutterwave.com/v3';

export interface HostedCheckout {
  readonly link: string;
}

export interface VerifiedTransaction {
  readonly id: number;
  readonly txRef: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly paymentType?: string;
}

/**
 * Flutterwave Standard: the customer pays on Flutterwave's own page (cards,
 * M-Pesa, MTN and Airtel mobile money), so card details never touch this
 * site. A payment only counts once the API has verified it server-side —
 * redirect parameters and webhook bodies are treated as hints, not proof.
 */
@Injectable()
export class FlutterwaveClient {
  constructor(@InjectConfig() private readonly config: AppConfig) {}

  get configured(): boolean {
    return Boolean(this.config.payments.flutterwaveSecretKey);
  }

  async createCheckout(input: {
    txRef: string;
    amountCents: number;
    currency: string;
    redirectUrl: string;
    customer: { email: string; name: string; phone?: string | null };
    paymentOptions: string;
    title: string;
    description: string;
  }): Promise<HostedCheckout> {
    const body = await this.request<{ status: string; data?: { link?: string } }>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        tx_ref: input.txRef,
        amount: (input.amountCents / 100).toFixed(2),
        currency: input.currency,
        redirect_url: input.redirectUrl,
        payment_options: input.paymentOptions,
        customer: {
          email: input.customer.email,
          name: input.customer.name,
          ...(input.customer.phone ? { phonenumber: input.customer.phone } : {}),
        },
        customizations: {
          title: input.title,
          description: input.description,
          logo: `${this.config.siteUrl}/assets/logo-crest.png`,
        },
      }),
    });
    if (body.status !== 'success' || !body.data?.link) {
      throw new Error('Flutterwave did not return a checkout link');
    }
    return { link: body.data.link };
  }

  async verifyByReference(txRef: string): Promise<VerifiedTransaction | null> {
    const body = await this.request<{
      status: string;
      data?: { id: number; tx_ref: string; status: string; amount: number; currency: string; payment_type?: string };
    }>(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, { method: 'GET' }).catch((error: Error) => {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    });
    if (!body || body.status !== 'success' || !body.data) {
      return null;
    }
    return {
      id: body.data.id,
      txRef: body.data.tx_ref,
      status: body.data.status,
      amount: body.data.amount,
      currency: body.data.currency,
      paymentType: body.data.payment_type,
    };
  }

  /** Flutterwave signs webhooks by echoing the secret hash set in its dashboard. */
  webhookAuthentic(header: string | undefined): boolean {
    const expected = this.config.payments.flutterwaveWebhookHash;
    return Boolean(expected && header && safeEqual(header, expected));
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const key = this.config.payments.flutterwaveSecretKey;
    if (!key) {
      throw new Error('Flutterwave is not configured');
    }
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Flutterwave ${response.status}: ${detail.slice(0, 200)}`);
    }
    return (await response.json()) as T;
  }
}
