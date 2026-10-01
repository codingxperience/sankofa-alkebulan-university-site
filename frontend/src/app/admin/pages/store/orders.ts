import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { Toasts } from '../../core/feedback';
import { MoneyPipe, WhenPipe } from '../../core/format';
import type { OrderStatus, OrderSummary, Page, StoreStats } from '../../core/types';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../core/vocabulary';
import { Empty, Pill, Skeleton } from '../../ui/ui';
import { StoreTabs } from './store-tabs';

type View = 'OPEN' | OrderStatus | '';

const VIEWS: ReadonlyArray<{ value: View; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'AWAITING_PAYMENT', label: 'Awaiting payment' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FULFILLING', label: 'Being prepared' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for pickup' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: '', label: 'All' },
];

const OPEN: readonly OrderStatus[] = ['AWAITING_PAYMENT', 'PAID', 'FULFILLING', 'DISPATCHED', 'READY_FOR_PICKUP'];

const DELIVERY: Record<OrderSummary['fulfilment'], string> = {
  DIGITAL: 'Digital delivery',
  PICKUP: 'Pickup',
  COURIER: 'Courier',
  EXPRESS: 'Express courier',
};

@Component({
  selector: 'sc-orders',
  imports: [RouterLink, StoreTabs, Pill, Empty, Skeleton, MoneyPipe, WhenPipe],
  templateUrl: './orders.html',
  styles: `
    .or-stats {
      margin-bottom: 20px;
    }

    .or-top {
      font-size: 16px;
      line-height: 1.35;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);

  protected readonly views = VIEWS;
  protected readonly statusTerms = ORDER_STATUS;
  protected readonly paymentTerms = PAYMENT_STATUS;
  protected readonly delivery = DELIVERY;

  protected readonly view = signal<View>('OPEN');
  protected readonly query = signal('');
  protected readonly stats = signal<StoreStats | null>(null);
  protected readonly orders = signal<readonly OrderSummary[]>([]);
  protected readonly cursor = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);

  protected readonly openCount = computed(() => OPEN.reduce((sum, status) => sum + (this.stats()?.status[status] ?? 0), 0));
  protected readonly exportUrl = computed(() => this.api.url('/store/orders/export', this.filters()));

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.api
      .get<StoreStats>('/store/stats')
      .then((stats) => this.stats.set(stats))
      .catch(() => undefined);
    void this.load();
  }

  protected count(view: View): number | null {
    const stats = this.stats();
    if (!stats || view === '') {
      return null;
    }
    return view === 'OPEN' ? this.openCount() : (stats.status[view] ?? 0);
  }

  protected choose(view: View): void {
    this.view.set(view);
    void this.load();
  }

  protected search(value: string): void {
    this.query.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => void this.load(), 300);
  }

  protected open(order: OrderSummary): void {
    void this.router.navigate(['/admin/store/orders', order.id]);
  }

  protected async more(): Promise<void> {
    const cursor = this.cursor();
    if (!cursor) {
      return;
    }
    this.loadingMore.set(true);
    try {
      const page = await this.api.get<Page<OrderSummary>>('/store/orders', { ...this.filters(), cursor, limit: 40 });
      this.orders.update((list) => [...list, ...page.items]);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loadingMore.set(false);
    }
  }

  private filters() {
    return { status: this.view() || undefined, q: this.query().trim() || undefined };
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const page = await this.api.get<Page<OrderSummary>>('/store/orders', { ...this.filters(), limit: 40 });
      this.orders.set(page.items);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
