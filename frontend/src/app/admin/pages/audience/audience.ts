import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ConsoleApi } from '../../core/console-api';
import { Confirmations, Toasts } from '../../core/feedback';
import { WhenPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { Page, Subscriber } from '../../core/types';
import { SUBSCRIBER_SOURCE } from '../../core/vocabulary';
import { Empty, Pill, Skeleton } from '../../ui/ui';

type View = 'subscribed' | 'unsubscribed' | '';

/**
 * People who asked to hear from the university, with the exact words they
 * agreed to. Unsubscribing keeps the record so they are never re-added by
 * mistake; erasing removes it entirely, for data-protection requests.
 */
@Component({
  selector: 'sc-audience',
  imports: [Pill, Empty, Skeleton, WhenPipe],
  template: `
    <header class="sc-head">
      <div class="sc-head__text">
        <p class="sc-eyebrow">Audience</p>
        <h1 class="sc-title">Mailing list</h1>
        <p class="sc-lede">Everyone here chose to hear from the university — from the journal, an event registration or an order. Each record keeps the consent wording they agreed to.</p>
      </div>
      @if (canExport()) {
        <div class="sc-head__actions">
          <a class="sc-btn" [href]="exportUrl" download><i class="pi pi-download" aria-hidden="true"></i> Export subscribers</a>
        </div>
      }
    </header>

    <div class="sc-toolbar">
      <div class="sc-segments" role="group" aria-label="Show">
        <button type="button" class="sc-segment" [attr.aria-pressed]="view() === 'subscribed'" (click)="choose('subscribed')">
          Subscribed <span class="sc-segment__count">{{ counts().subscribed }}</span>
        </button>
        <button type="button" class="sc-segment" [attr.aria-pressed]="view() === 'unsubscribed'" (click)="choose('unsubscribed')">
          Unsubscribed <span class="sc-segment__count">{{ counts().unsubscribed }}</span>
        </button>
        <button type="button" class="sc-segment" [attr.aria-pressed]="view() === ''" (click)="choose('')">Everyone</button>
      </div>
      <span class="sc-toolbar__spacer"></span>
      <div class="sc-search">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input class="sc-input" type="search" placeholder="Email or name" aria-label="Search subscribers"
          [value]="query()" (input)="search($any($event.target).value)" />
      </div>
    </div>

    <section class="sc-card">
      @if (loading()) {
        <sc-skeleton [lines]="8" />
      } @else if (people().length === 0) {
        <sc-empty title="No one here yet" icon="pi-megaphone">
          <p>People join from the journal’s newsletter form, or by ticking the updates box when they register for an event.</p>
        </sc-empty>
      } @else {
        <div class="sc-table-wrap">
          <table class="sc-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Joined from</th>
                <th scope="col">Consented</th>
                <th scope="col">Status</th>
                @if (canExport()) {
                  <th scope="col" class="is-tight"><span class="visually-hidden">Actions</span></th>
                }
              </tr>
            </thead>
            <tbody>
              @for (person of people(); track person.id) {
                <tr>
                  <td>
                    <span class="sc-cell-main">{{ person.email }}</span>
                    @if (person.name) {
                      <span class="sc-cell-sub">{{ person.name }}</span>
                    }
                  </td>
                  <td>{{ sources[person.source] }}</td>
                  <td>
                    <span [title]="person.consentText">{{ person.consentedAt | when: 'date' }}</span>
                    <details class="au-consent">
                      <summary>Wording agreed to</summary>
                      <p>{{ person.consentText }}</p>
                    </details>
                  </td>
                  <td>
                    @if (person.unsubscribedAt) {
                      <sc-pill label="Unsubscribed" tone="muted" />
                      <span class="sc-cell-sub">{{ person.unsubscribedAt | when: 'date' }}</span>
                    } @else {
                      <sc-pill label="Subscribed" tone="done" />
                    }
                  </td>
                  @if (canExport()) {
                    <td class="is-tight">
                      <div class="au-actions">
                        @if (!person.unsubscribedAt) {
                          <button type="button" class="sc-btn sc-btn--small" [disabled]="busy() === person.id" (click)="unsubscribe(person)">Unsubscribe</button>
                        }
                        <button type="button" class="sc-btn sc-btn--danger sc-btn--small" [disabled]="busy() === person.id" (click)="erase(person)">Erase</button>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (cursor()) {
          <div class="sc-more">
            <button type="button" class="sc-btn sc-btn--small" [class.is-busy]="loadingMore()" (click)="more()">Show more</button>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .au-consent {
      margin-top: 4px;
      font-size: 12px;
      color: var(--sc-ink-3);

      summary {
        cursor: pointer;
      }

      p {
        max-width: 420px;
        margin-top: 6px;
        line-height: 1.5;
      }
    }

    .au-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudiencePage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly confirmations = inject(Confirmations);
  private readonly session = inject(StaffSession);

  protected readonly sources = SUBSCRIBER_SOURCE;
  protected readonly exportUrl = this.api.url('/audience/export');
  protected readonly canExport = computed(() => this.session.can('audience.export'));

  protected readonly view = signal<View>('subscribed');
  protected readonly query = signal('');
  protected readonly people = signal<readonly Subscriber[]>([]);
  protected readonly counts = signal({ subscribed: 0, unsubscribed: 0 });
  protected readonly cursor = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly busy = signal<string | null>(null);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.loadCounts();
    void this.load();
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

  protected async unsubscribe(person: Subscriber): Promise<void> {
    const yes = await this.confirmations.ask({
      title: `Unsubscribe ${person.email}?`,
      body: 'They will receive no more updates. The record is kept, marked unsubscribed, so they are not added back by mistake.',
      confirm: 'Unsubscribe',
    });
    if (!yes) {
      return;
    }
    this.busy.set(person.id);
    try {
      const updated = await this.api.post<Subscriber>(`/audience/${person.id}/unsubscribe`);
      this.people.update((list) => (this.view() === 'subscribed' ? list.filter((p) => p.id !== person.id) : list.map((p) => (p.id === person.id ? updated : p))));
      this.toasts.success(`${person.email} unsubscribed.`);
      void this.loadCounts();
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.busy.set(null);
    }
  }

  protected async erase(person: Subscriber): Promise<void> {
    const yes = await this.confirmations.ask({
      title: `Erase ${person.email} completely?`,
      body: 'Use this for a request to delete personal data. The record and its consent history are removed permanently; the audit log notes only that an erasure happened.',
      confirm: 'Erase permanently',
      tone: 'danger',
    });
    if (!yes) {
      return;
    }
    this.busy.set(person.id);
    try {
      await this.api.delete(`/audience/${person.id}`);
      this.people.update((list) => list.filter((p) => p.id !== person.id));
      this.toasts.success('Record erased.');
      void this.loadCounts();
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.busy.set(null);
    }
  }

  protected async more(): Promise<void> {
    const cursor = this.cursor();
    if (!cursor) {
      return;
    }
    this.loadingMore.set(true);
    try {
      const page = await this.fetch(cursor);
      this.people.update((list) => [...list, ...page.items]);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loadingMore.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const page = await this.fetch(null);
      this.people.set(page.items);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCounts(): Promise<void> {
    try {
      this.counts.set(await this.api.get<{ subscribed: number; unsubscribed: number }>('/audience/counts'));
    } catch {
      // The list works without the counts.
    }
  }

  private fetch(cursor: string | null): Promise<Page<Subscriber>> {
    return this.api.get<Page<Subscriber>>('/audience', {
      status: this.view() || undefined,
      q: this.query().trim() || undefined,
      cursor: cursor ?? undefined,
      limit: 50,
    });
  }
}
