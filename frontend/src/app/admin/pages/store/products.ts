import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ConsoleApi } from '../../core/console-api';
import { Toasts } from '../../core/feedback';
import { MoneyPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { Product, ProductKind, ProductStatus } from '../../core/types';
import { PRODUCT_KIND, PRODUCT_STATUS } from '../../core/vocabulary';
import { Pill, Skeleton } from '../../ui/ui';
import { StoreTabs } from './store-tabs';

interface Draft {
  price: string;
  stock: string;
  status: ProductStatus;
}

const KIND_ORDER: readonly ProductKind[] = ['ARTIFACT', 'APPAREL', 'MERCHANDISE', 'BOOK', 'MEDIA', 'DIGITAL'];

/**
 * The commercial facts of each product — price, availability and stock.
 * Pictures and descriptions live with the storefront itself.
 */
@Component({
  selector: 'sc-products',
  imports: [StoreTabs, Pill, Skeleton, MoneyPipe],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  protected readonly session = inject(StaffSession);

  protected readonly kindLabel = PRODUCT_KIND;
  protected readonly statusTerms = PRODUCT_STATUS;
  protected readonly statuses: readonly ProductStatus[] = ['AVAILABLE', 'PREORDER', 'SOLD_OUT', 'ARCHIVED'];

  protected readonly products = signal<readonly Product[]>([]);
  protected readonly drafts = signal<Record<string, Draft>>({});
  protected readonly saving = signal<string | null>(null);
  protected readonly loading = signal(true);

  protected readonly canManage = computed(() => this.session.can('store.manage'));

  protected readonly groups = computed(() =>
    KIND_ORDER.map((kind) => ({ kind, items: this.products().filter((product) => product.kind === kind) })).filter((group) => group.items.length),
  );

  constructor() {
    this.api
      .get<Product[]>('/store/products')
      .then((products) => {
        this.products.set(products);
        this.drafts.set(Object.fromEntries(products.map((product) => [product.id, this.draftOf(product)])));
      })
      .catch((error: unknown) => this.toasts.error(error))
      .finally(() => this.loading.set(false));
  }

  protected draft(product: Product): Draft {
    return this.drafts()[product.id] ?? this.draftOf(product);
  }

  protected edit(product: Product, field: keyof Draft, value: string): void {
    this.drafts.update((drafts) => ({ ...drafts, [product.id]: { ...this.draft(product), [field]: value } }));
  }

  protected changed(product: Product): boolean {
    const draft = this.draft(product);
    const original = this.draftOf(product);
    return draft.price !== original.price || draft.stock !== original.stock || draft.status !== original.status;
  }

  protected reset(product: Product): void {
    this.drafts.update((drafts) => ({ ...drafts, [product.id]: this.draftOf(product) }));
  }

  protected async save(product: Product): Promise<void> {
    const draft = this.draft(product);
    const price = Number(draft.price);
    if (!/^\d+(\.\d{1,2})?$/.test(draft.price.trim()) || !Number.isFinite(price)) {
      this.toasts.error(`Enter the price of ${product.name} in dollars, like 240 or 12.50.`);
      return;
    }
    const stock = draft.stock.trim() === '' ? null : Number(draft.stock);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      this.toasts.error(`Stock for ${product.name} must be a whole number, or empty if it is not counted.`);
      return;
    }
    this.saving.set(product.id);
    try {
      const updated = await this.api.patch<Product>(`/store/products/${product.id}`, {
        priceCents: Math.round(price * 100),
        stockRemaining: stock,
        status: draft.status,
      });
      const merged = { ...product, ...updated, sold: product.sold };
      this.products.update((list) => list.map((item) => (item.id === product.id ? merged : item)));
      this.drafts.update((drafts) => ({ ...drafts, [product.id]: this.draftOf(merged) }));
      this.toasts.success(`${product.name} updated.`);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.saving.set(null);
    }
  }

  private draftOf(product: Product): Draft {
    return {
      price: (product.priceCents / 100).toFixed(2),
      stock: product.stockRemaining === null ? '' : String(product.stockRemaining),
      status: product.status,
    };
  }
}
