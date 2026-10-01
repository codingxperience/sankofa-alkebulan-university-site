import { Injectable } from '@nestjs/common';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';

export interface OutgoingMessage {
  readonly id: string;
  readonly to: string;
  readonly toName?: string | null;
  readonly replyTo?: string | null;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export type SendResult =
  | { readonly ok: true; readonly providerMessageId: string }
  | { readonly ok: false; readonly retryable: boolean; readonly error: string };

/**
 * Delivers mail through Resend's HTTP API. The outbox row id is sent as the
 * idempotency key, so a retry after a timeout can never produce a duplicate.
 */
@Injectable()
export class Mailer {
  constructor(@InjectConfig() private readonly config: AppConfig) {}

  get configured(): boolean {
    return Boolean(this.config.email.resendApiKey && this.config.email.from);
  }

  async send(message: OutgoingMessage): Promise<SendResult> {
    const { resendApiKey, from, replyTo } = this.config.email;
    if (!resendApiKey || !from) {
      return { ok: false, retryable: true, error: 'Email delivery is not configured' };
    }

    const to = message.toName ? `${message.toName.replace(/[<>",]/g, '')} <${message.to}>` : message.to;
    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': message.id,
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: message.replyTo ?? replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      return { ok: false, retryable: true, error: `Network error: ${(error as Error).message}` };
    }

    if (response.ok) {
      const body = (await response.json().catch(() => ({}))) as { id?: string };
      return { ok: true, providerMessageId: body.id ?? '' };
    }

    const detail = await response.text().catch(() => '');
    // 4xx other than rate limiting means the message itself is unacceptable
    // (bad address, unverified sender); retrying would only fail again.
    const retryable = response.status === 429 || response.status >= 500;
    return { ok: false, retryable, error: `Resend ${response.status}: ${detail.slice(0, 300)}` };
  }
}
