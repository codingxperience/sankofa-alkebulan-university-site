import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiClient, ApiError } from '../core/api/api-client';
import { LAST_ORDER_KEY } from '../core/store-session';

interface OrderView {
  number: string;
  status: 'AWAITING_PAYMENT' | 'PAID' | 'FULFILLING' | 'DISPATCHED' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentRail: 'MOBILE_MONEY' | 'CARD';
  fulfilment: 'DIGITAL' | 'PICKUP' | 'COURIER' | 'EXPRESS';
  fulfilmentLabel: string;
  currency: string;
  subtotalCents: number;
  deliveryCents: number;
  totalCents: number;
  customerName: string;
  items: Array<{ sku: string; name: string; size: string | null; quantity: number; lineTotalCents: number }>;
  paidAt: string | null;
  createdAt: string;
}

const STEPS = ['Placed', 'Paid', 'Preparing', 'On its way', 'Complete'] as const;

/** Where each status sits on the five-step journey. */
const STEP_OF: Record<OrderView['status'], number> = {
  AWAITING_PAYMENT: 0,
  PAID: 1,
  FULFILLING: 2,
  DISPATCHED: 3,
  READY_FOR_PICKUP: 3,
  COMPLETED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
};

/**
 * A customer's view of one order. It opens with the private key from the
 * confirmation email (`#key=…`), or — straight after checkout or a trip to
 * the payment page — with the key this browser kept for the session.
 */
@Component({
  selector: 'app-store-order-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="so-shell">
      <div class="so-container">
        <a routerLink="/store" class="so-back"><span aria-hidden="true">&larr;</span> Sankofa Store</a>

        @if (loading()) {
          <div class="so-card so-card--quiet" aria-busy="true"><p>Finding your order&hellip;</p></div>
        } @else if (error(); as message) {
          <div class="so-card so-card--quiet" role="alert">
            <h1>We could not open this order</h1>
            <p>{{ message }}</p>
            <p class="hint">Use the “View your order” link in your confirmation email, or write to the store desk with your order number.</p>
            <a routerLink="/contact" class="so-btn">Contact the university</a>
          </div>
        } @else if (order(); as o) {
          <article class="so-card">
            <header class="so-head">
              <span class="so-eyebrow">Order</span>
              <h1 class="so-number">{{ o.number }}</h1>
              <p class="so-headline">{{ headline() }}</p>
            </header>

            @if (step() >= 0) {
              <ol class="so-steps" aria-label="Order progress">
                @for (label of steps; track label; let i = $index) {
                  <li [class.is-done]="i <= step()" [attr.aria-current]="i === step() ? 'step' : null">
                    <span class="dot" aria-hidden="true"></span><span class="lbl">{{ stepLabel(i, o) }}</span>
                  </li>
                }
              </ol>
            }

            @if (o.status === 'AWAITING_PAYMENT') {
              <div class="so-note">
                @if (o.paymentStatus === 'FAILED') {
                  The card payment did not go through. Nothing was charged. Write to the store desk and we will send you a fresh payment link.
                } @else if (o.paymentRail === 'MOBILE_MONEY') {
                  Our bursary desk will contact you with mobile money payment instructions. Your items are reserved in the meantime.
                } @else if (o.paymentStatus === 'PENDING') {
                  We are waiting for the card payment to be confirmed. This page updates when you refresh it.
                } @else {
                  Our bursary desk will email you a secure card payment link. Your items are reserved in the meantime.
                }
              </div>
            }

            <ul class="so-items">
              @for (item of o.items; track item.sku + (item.size ?? '')) {
                <li>
                  <span class="t">{{ item.name }}@if (item.size) {<span class="q"> · Size {{ item.size }}</span>}<span class="q"> × {{ item.quantity }}</span></span>
                  <span class="v">{{ money(item.lineTotalCents, o.currency) }}</span>
                </li>
              }
              <li class="sub"><span>Delivery &mdash; {{ o.fulfilmentLabel }}</span><span>{{ o.deliveryCents ? money(o.deliveryCents, o.currency) : 'Free' }}</span></li>
              <li class="total"><span>Total</span><strong>{{ money(o.totalCents, o.currency) }}</strong></li>
            </ul>

            <footer class="so-foot">
              <span>Placed {{ date(o.createdAt) }}</span>
              @if (o.paidAt) {
                <span>Paid {{ date(o.paidAt) }}</span>
              }
            </footer>
          </article>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .so-shell { background: #f6f8fb; min-height: 70vh; padding: clamp(32px, 6vw, 72px) 16px; }
    .so-container { max-width: 720px; margin: 0 auto; display: grid; gap: 18px; }
    .so-back { color: #4a647d; font-size: 14px; text-decoration: none; justify-self: start; }
    .so-back:hover { color: #0f4c81; }
    .so-card { background: #fff; border: 1px solid #e0ebf6; border-radius: 24px; padding: clamp(24px, 4vw, 44px); display: grid; gap: 28px; box-shadow: 0 30px 70px rgba(10, 36, 58, 0.07); }
    .so-card--quiet { gap: 12px; }
    .so-card--quiet h1 { margin: 0; font-size: 22px; color: #051b2c; letter-spacing: -0.02em; }
    .so-card--quiet p { margin: 0; color: #4a647d; line-height: 1.6; }
    .so-card--quiet .hint { font-size: 14px; }
    .so-btn { justify-self: start; margin-top: 8px; display: inline-flex; align-items: center; min-height: 46px; padding: 0 22px; border-radius: 999px; background: #051b2c; color: #fff; font-weight: 600; text-decoration: none; }
    .so-head { display: grid; gap: 6px; }
    .so-eyebrow { font-family: 'Geist Mono', monospace; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #b35c2a; }
    .so-number { margin: 0; font-family: 'Geist Mono', monospace; font-size: clamp(28px, 5vw, 40px); letter-spacing: 0.04em; color: #051b2c; }
    .so-headline { margin: 0; color: #243c51; font-size: 16px; line-height: 1.55; }
    .so-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .so-steps li { display: grid; gap: 10px; }
    .so-steps .dot { height: 4px; border-radius: 4px; background: #e0ebf6; }
    .so-steps .lbl { font-size: 12px; color: #8aa0b3; }
    .so-steps li.is-done .dot { background: #0f4c81; }
    .so-steps li.is-done .lbl { color: #0a3254; font-weight: 600; }
    .so-note { padding: 16px 18px; border-radius: 14px; background: #f7f1e6; border: 1px solid #ecd9c8; color: #5a3a12; font-size: 14px; line-height: 1.6; }
    .so-items { list-style: none; margin: 0; padding: 0; display: grid; }
    .so-items li { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #eef3f8; font-size: 15px; color: #102a43; }
    .so-items .q { color: #8aa0b3; }
    .so-items .v { white-space: nowrap; }
    .so-items .sub { color: #4a647d; font-size: 14px; }
    .so-items .total { border-bottom: 0; font-size: 17px; color: #051b2c; }
    .so-foot { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 13px; color: #8aa0b3; }
    @media (max-width: 560px) { .so-steps .lbl { font-size: 10.5px; } }
  `,
})
export class StoreOrderPageComponent implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  readonly steps = STEPS;
  readonly order = signal<OrderView | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly step = computed(() => {
    const order = this.order();
    return order ? STEP_OF[order.status] : 0;
  });
  readonly headline = computed(() => {
    const o = this.order();
    if (!o) return '';
    const first = o.customerName.split(' ')[0];
    switch (o.status) {
      case 'AWAITING_PAYMENT':
        return `Thank you, ${first}. Your order is reserved and waiting for payment.`;
      case 'PAID':
        return `Thank you, ${first}. Payment received — we are preparing your order.`;
      case 'FULFILLING':
        return 'Your order is being prepared.';
      case 'DISPATCHED':
        return 'Your order is on its way.';
      case 'READY_FOR_PICKUP':
        return 'Your order is ready to collect in Mbarara. Bring your student ID or this order number.';
      case 'COMPLETED':
        return 'This order is complete. Thank you for supporting the university.';
      case 'CANCELLED':
        return 'This order was cancelled.';
      case 'REFUNDED':
        return 'This order was refunded.';
    }
  });

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const number = this.route.snapshot.paramMap.get('number') ?? '';
    const key = this.findKey(number);
    if (!key) {
      this.loading.set(false);
      this.error.set('This page needs the private link from your confirmation email.');
      return;
    }
    // Returning from the payment page: ask the API to confirm the payment with the provider.
    const returningFromPayment = this.route.snapshot.queryParamMap.has('tx_ref') || this.route.snapshot.queryParamMap.has('status');
    try {
      const order = await this.api.get<OrderView>(`/store/orders/${encodeURIComponent(number)}`, returningFromPayment ? { refresh: 1 } : undefined, {
        'X-Order-Key': key,
      });
      this.order.set(order);
      // Keep the key out of the address bar and browser history.
      if (window.location.hash || returningFromPayment) {
        history.replaceState(null, '', `/store/orders/${order.number}`);
      }
    } catch (error) {
      this.error.set(ApiError.from(error).message);
    } finally {
      this.loading.set(false);
    }
  }

  private findKey(number: string): string | null {
    const fromLink = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('key');
    if (fromLink) {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ number, key: fromLink }));
      return fromLink;
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || 'null') as { number: string; key: string } | null;
      return saved && saved.number === number ? saved.key : null;
    } catch {
      return null;
    }
  }

  stepLabel(index: number, order: OrderView): string {
    if (index === 3) {
      return order.fulfilment === 'PICKUP' ? 'Ready to collect' : order.fulfilment === 'DIGITAL' ? 'Delivered' : STEPS[3];
    }
    return STEPS[index];
  }

  money(cents: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
  }

  date(iso: string): string {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  }
}
