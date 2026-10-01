import { ChangeDetectionStrategy, Component, DestroyRef, ViewEncapsulation, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { ConfirmHost, Toaster } from './ui/ui';

/**
 * Everything under /admin renders inside this component. It carries the
 * console's stylesheet (scoped under .sc), the toast area and the
 * confirmation dialog, and keeps the console out of search engines.
 */
@Component({
  selector: 'sc-console',
  imports: [RouterOutlet, Toaster, ConfirmHost],
  template: `
    <div class="sc">
      <router-outlet />
      <sc-toaster />
      <sc-confirm />
    </div>
  `,
  styleUrl: './console.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleRoot {
  constructor() {
    const meta = inject(Meta);
    const previous = meta.getTag('name="robots"')?.content ?? 'index, follow';
    meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    inject(DestroyRef).onDestroy(() => meta.updateTag({ name: 'robots', content: previous }));
  }
}
