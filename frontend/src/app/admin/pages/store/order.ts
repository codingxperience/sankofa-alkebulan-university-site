import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/api/api-client';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Confirmations, Toasts } from '../../core/feedback';
import { MoneyPipe, WhenPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { OrderDetail, OrderStatus } from '../../core/types';
import { ORDER_ACTION, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS, paymentProviderLabel } from '../../core/vocabulary';
import { Pill, Skeleton, Timeline } from '../../ui/ui';

@Component({
  selector: 'sc-order',
  imports: [ReactiveFormsModule, RouterLink, Pill, Skeleton, Timeline, MoneyPipe, WhenPipe],
  templateUrl: './order.html',
  styleUrl: './order.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly confirmations = inject(Confirmations);
  private readonly state = inject(ConsoleState);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly session = inject(StaffSession);

  protected readonly statusTerms = ORDER_STATUS;
  protected readonly paymentTerms = PAYMENT_STATUS;
  protected readonly actions = ORDER_ACTION;
  protected readonly methods = PAYMENT_METHODS;
  protected readonly providerLabel = paymentProviderLabel;

  protected readonly order = signal<OrderDetail | null>(null);
  protected readonly failed = signal('');
  protected readonly busy = signal(false);
  protected readonly paymentError = signal('');

  protected readonly canManage = computed(() => this.session.can('store.manage'));
  protected readonly canRecordPayment = computed(() => {
    const order = this.order();
    return this.canManage() && !!order && order.paymentStatus !== 'PAID' && order.paymentStatus !== 'REFUNDED' && order.status === 'AWAITING_PAYMENT';
  });

  protected readonly payment = this.fb.group({
    method: ['mobile_money', Validators.required],
    reference: ['', [Validators.required, Validators.minLength(3)]],
  });

  protected readonly note = this.fb.group({ staffNote: [''] });

  constructor() {
    const subscription = inject(ActivatedRoute).paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        void this.load(id);
      }
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  protected async move(status: OrderStatus): Promise<void> {
    const order = this.order();
    if (!order) {
      return;
    }
    if (status === 'CANCELLED' || status === 'REFUNDED') {
      const yes = await this.confirmations.ask({
        title: status === 'CANCELLED' ? `Cancel order ${order.number}?` : `Mark ${order.number} refunded?`,
        body:
          status === 'CANCELLED'
            ? 'Reserved limited-edition stock goes back on sale. The customer is not emailed automatically.'
            : 'Record this only once the money has actually been returned to the customer.',
        confirm: status === 'CANCELLED' ? 'Cancel order' : 'Mark refunded',
        tone: 'danger',
      });
      if (!yes) {
        return;
      }
    }
    await this.save({ status }, `Order marked ${this.statusTerms[status].label.toLowerCase()}.`);
  }

  protected async saveNote(): Promise<void> {
    await this.save({ staffNote: this.note.getRawValue().staffNote }, 'Note saved.');
  }

  protected async recordPayment(): Promise<void> {
    const order = this.order();
    this.paymentError.set('');
    if (!order) {
      return;
    }
    if (this.payment.invalid) {
      this.payment.markAllAsTouched();
      this.paymentError.set('Enter the transaction reference from the payment.');
      return;
    }
    const value = this.payment.getRawValue();
    const yes = await this.confirmations.ask({
      title: `Record ${order.number} as paid?`,
      body: `Confirm that ${this.money(order.totalCents, order.currency)} has arrived, with reference ${value.reference.trim()}. ${
        this.state.emailConfigured() ? 'The customer is emailed a receipt.' : 'Email sending is not switched on yet, so the receipt waits until it is.'
      }`,
      confirm: 'Record payment',
    });
    if (!yes) {
      return;
    }
    this.busy.set(true);
    try {
      this.show(await this.api.post<OrderDetail>(`/store/orders/${order.id}/payment`, { method: value.method, reference: value.reference.trim() }));
      this.payment.reset({ method: 'mobile_money', reference: '' });
      this.toasts.success('Payment recorded.');
      this.state.refreshSoon();
    } catch (error) {
      const failure = ApiError.from(error);
      this.paymentError.set(failure.message);
    } finally {
      this.busy.set(false);
    }
  }

  private money(cents: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
  }

  private async save(change: { status?: OrderStatus; staffNote?: string }, done: string): Promise<void> {
    const order = this.order();
    if (!order) {
      return;
    }
    this.busy.set(true);
    try {
      this.show(await this.api.patch<OrderDetail>(`/store/orders/${order.id}`, change));
      this.toasts.success(done);
      this.state.refreshSoon();
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.busy.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    this.order.set(null);
    this.failed.set('');
    try {
      this.show(await this.api.get<OrderDetail>(`/store/orders/${id}`));
    } catch (error) {
      this.failed.set(error instanceof Error ? error.message : 'This order could not be opened.');
    }
  }

  private show(order: OrderDetail): void {
    this.order.set(order);
    this.note.setValue({ staffNote: order.staffNote ?? '' });
  }
}
