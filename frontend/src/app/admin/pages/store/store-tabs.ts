import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'sc-store-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sc-tabs" aria-label="Store">
      <a routerLink="/admin/store/orders" routerLinkActive="is-active" ariaCurrentWhenActive="page">Orders</a>
      <a routerLink="/admin/store/products" routerLinkActive="is-active" ariaCurrentWhenActive="page">Products</a>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreTabs {}
