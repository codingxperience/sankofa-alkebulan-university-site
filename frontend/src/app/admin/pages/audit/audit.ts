import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ConsoleApi } from '../../core/console-api';
import { Toasts } from '../../core/feedback';
import { WhenPipe, dayHeading } from '../../core/format';
import type { AuditEntry, Page } from '../../core/types';
import { Empty, Skeleton } from '../../ui/ui';

const ENTITIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'Everything' },
  { value: 'inquiry', label: 'Messages' },
  { value: 'application', label: 'Applications' },
  { value: 'event', label: 'Events' },
  { value: 'order', label: 'Orders' },
  { value: 'product', label: 'Products' },
  { value: 'article', label: 'Journal' },
  { value: 'subscriber', label: 'Mailing list' },
  { value: 'staff', label: 'Team and sign-ins' },
  { value: 'office', label: 'Settings' },
];

/**
 * Every change anyone has made, described in plain words, newest first.
 * Entries are written by the server as changes happen; the console can
 * only read them.
 */
@Component({
  selector: 'sc-audit',
  imports: [Empty, Skeleton, WhenPipe],
  template: `
    <header class="sc-head">
      <div class="sc-head__text">
        <p class="sc-eyebrow">The institution</p>
        <h1 class="sc-title">Audit log</h1>
        <p class="sc-lede">Who did what, and when. Entries cannot be edited or removed from the console.</p>
      </div>
    </header>

    <div class="sc-toolbar">
      <label class="visually-hidden" for="au-entity">Show changes to</label>
      <select id="au-entity" class="sc-select sc-select--small au-entity" (change)="chooseEntity($any($event.target).value)">
        @for (entity of entities; track entity.value) {
          <option [value]="entity.value">{{ entity.label }}</option>
        }
      </select>
      <span class="sc-toolbar__spacer"></span>
      <div class="sc-search">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input class="sc-input" type="search" placeholder="Search the log" aria-label="Search the log"
          [value]="query()" (input)="search($any($event.target).value)" />
      </div>
    </div>

    <section class="sc-card">
      @if (loading()) {
        <sc-skeleton [lines]="10" />
      } @else if (days().length === 0) {
        <sc-empty title="Nothing recorded" icon="pi-history">
          <p>No entries match. Changes made in the console are recorded here as they happen.</p>
        </sc-empty>
      } @else {
        @for (day of days(); track day.heading) {
          <section class="au-day" [attr.aria-label]="day.heading">
            <h2 class="au-day__heading">{{ day.heading }}</h2>
            <ol>
              @for (entry of day.entries; track entry.id) {
                <li class="au-entry">
                  <time class="au-entry__time" [attr.datetime]="entry.createdAt" [title]="entry.createdAt | when: 'full'">{{ entry.createdAt | when: 'time' }}</time>
                  <div>
                    <p class="au-entry__summary">{{ entry.summary }}</p>
                    <p class="au-entry__meta">
                      <span class="sc-mono">{{ entry.action }}</span>
                      @if (entry.ipAddress) {
                        · <span class="sc-mono">{{ entry.ipAddress }}</span>
                      }
                    </p>
                  </div>
                </li>
              }
            </ol>
          </section>
        }
        @if (cursor()) {
          <div class="sc-more">
            <button type="button" class="sc-btn sc-btn--small" [class.is-busy]="loadingMore()" (click)="more()">Earlier entries</button>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .au-entity {
      width: auto;
      min-width: 190px;
    }

    .au-day + .au-day {
      border-top: 1px solid var(--sc-line-2);
    }

    .au-day__heading {
      padding: 16px 20px 6px;
      font-family: var(--sc-mono);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--sc-gold-ink);
    }

    ol {
      padding: 0 8px 10px;
    }

    .au-entry {
      display: grid;
      grid-template-columns: 52px minmax(0, 1fr);
      gap: 12px;
      padding: 9px 12px;
      border-radius: 8px;

      &:hover {
        background: #fbf9f4;
      }
    }

    .au-entry__time {
      padding-top: 1px;
      font-family: var(--sc-mono);
      font-size: 12px;
      color: var(--sc-ink-3);
    }

    .au-entry__summary {
      font-size: 13.5px;
      color: var(--sc-ink);
    }

    .au-entry__meta {
      margin-top: 2px;
      font-size: 11.5px;
      color: var(--sc-ink-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);

  protected readonly entities = ENTITIES;
  protected readonly entity = signal('');
  protected readonly query = signal('');
  protected readonly entries = signal<readonly AuditEntry[]>([]);
  protected readonly cursor = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly days = computed(() => {
    const groups: Array<{ heading: string; entries: AuditEntry[] }> = [];
    for (const entry of this.entries()) {
      const heading = dayHeading(entry.createdAt);
      let group = groups[groups.length - 1];
      if (!group || group.heading !== heading) {
        group = { heading, entries: [] };
        groups.push(group);
      }
      group.entries.push(entry);
    }
    return groups;
  });

  constructor() {
    void this.load();
  }

  protected chooseEntity(value: string): void {
    this.entity.set(value);
    void this.load();
  }

  protected search(value: string): void {
    this.query.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => void this.load(), 300);
  }

  protected async more(): Promise<void> {
    const cursor = this.cursor();
    if (!cursor) {
      return;
    }
    this.loadingMore.set(true);
    try {
      const page = await this.fetch(cursor);
      this.entries.update((list) => [...list, ...page.items]);
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
      this.entries.set(page.items);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  private fetch(cursor: string | null): Promise<Page<AuditEntry>> {
    return this.api.get<Page<AuditEntry>>('/audit', {
      entityType: this.entity() || undefined,
      q: this.query().trim() || undefined,
      cursor: cursor ?? undefined,
      limit: 60,
    });
  }
}
