import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Toasts } from '../../core/feedback';
import { AgoPipe, MoneyPipe, WhenPipe, dayHeading, formatDate, formatMoney } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { DaybookEntry, DaybookKind, Office, Page, Pathway } from '../../core/types';
import { DAYBOOK_KIND, PATHWAY_LABEL, daybookStatus } from '../../core/vocabulary';
import { formatInZone } from '../../core/zones';
import { Empty, Pill, Skeleton } from '../../ui/ui';
import { ActivityChart } from './activity-chart';

const KIND_PERMISSION = {
  inquiry: 'inquiries.read',
  application: 'applications.read',
  registration: 'events.read',
  order: 'store.read',
} as const;

interface Line {
  readonly entry: DaybookEntry;
  readonly link: string;
  readonly time: string;
  readonly headline: string;
  readonly context: string;
}

/**
 * The console's first screen. The top says what is waiting on a person;
 * the stream below is the daybook — every message, application,
 * registration and order, newest first, the way they arrived.
 */
@Component({
  selector: 'sc-daybook',
  imports: [RouterLink, ActivityChart, Pill, Empty, Skeleton, AgoPipe, MoneyPipe, WhenPipe],
  templateUrl: './daybook.html',
  styleUrl: './daybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaybookPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  protected readonly state = inject(ConsoleState);
  protected readonly session = inject(StaffSession);

  protected readonly overview = this.state.overview;
  protected readonly today = formatDate(new Date(), 'day');
  protected readonly greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  })();
  protected readonly firstName = computed(() => this.session.me()?.name.split(/\s+/)[0] ?? '');

  protected readonly kinds = computed(() =>
    (Object.keys(KIND_PERMISSION) as DaybookKind[]).filter((kind) => this.session.can(KIND_PERMISSION[kind])),
  );
  protected readonly kindLabel = DAYBOOK_KIND;

  protected readonly filter = signal<DaybookKind | null>(null);
  protected readonly entries = signal<readonly DaybookEntry[]>([]);
  protected readonly cursor = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);

  /** One sentence that says what the day holds. */
  protected readonly headline = computed(() => {
    const overview = this.overview();
    if (!overview) {
      return '';
    }
    const parts: string[] = [];
    const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    if (overview.inquiries?.new) parts.push(count(overview.inquiries.new, 'new message', 'new messages'));
    if (overview.applications?.awaitingDecision) {
      parts.push(count(overview.applications.awaitingDecision, 'application awaiting a decision', 'applications awaiting a decision'));
    }
    if (overview.store?.toFulfil) parts.push(count(overview.store.toFulfil, 'paid order to fulfil', 'paid orders to fulfil'));
    if (overview.store?.awaitingPayment) {
      parts.push(count(overview.store.awaitingPayment, 'order awaiting payment', 'orders awaiting payment'));
    }
    if (parts.length === 0) {
      return 'Nothing is waiting on a person right now.';
    }
    const last = parts.pop();
    return `${parts.length ? `${parts.join(', ')} and ${last}` : last}.`;
  });

  protected readonly days = computed(() => {
    const groups: Array<{ heading: string; lines: Line[] }> = [];
    for (const entry of this.entries()) {
      const heading = dayHeading(entry.at);
      let group = groups[groups.length - 1];
      if (!group || group.heading !== heading) {
        group = { heading, lines: [] };
        groups.push(group);
      }
      group.lines.push(this.describe(entry));
    }
    return groups;
  });

  constructor() {
    void this.state.loadOverview().catch((error: unknown) => this.toasts.error(error));
    void this.load();
  }

  /** An event's start as its own clocks read it, wherever the viewer is. */
  protected eventStart(event: { startsAt: string; timezone: string }): string {
    return formatInZone(event.startsAt, event.timezone);
  }

  protected fill(event: { confirmed: number; capacity: number | null }): number {
    return event.capacity ? Math.min(100, (event.confirmed / event.capacity) * 100) : 0;
  }

  protected status(entry: DaybookEntry) {
    return daybookStatus(entry.kind, entry.status);
  }

  protected choose(kind: DaybookKind | null): void {
    if (this.filter() === kind) {
      return;
    }
    this.filter.set(kind);
    void this.load();
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

  private fetch(cursor: string | null): Promise<Page<DaybookEntry>> {
    return this.api.get<Page<DaybookEntry>>('/daybook', { kind: this.filter() ?? undefined, cursor: cursor ?? undefined, limit: 40 });
  }

  private describe(entry: DaybookEntry): Line {
    const time = formatDate(entry.at, 'time');
    switch (entry.kind) {
      case 'inquiry':
        return {
          entry,
          time,
          link: `/admin/inbox/${entry.id}`,
          headline: entry.title ? `${entry.who} — ${entry.title}` : `${entry.who ?? 'Someone'} wrote in`,
          context: `${entry.ref} · ${entry.detail ? this.state.officeName(entry.detail as Office) : ''}`,
        };
      case 'application':
        return {
          entry,
          time,
          link: `/admin/admissions/${entry.id}`,
          headline: `${entry.who || 'An applicant'} applied${entry.title ? ` for ${entry.title}` : ''}`,
          context: `${entry.ref} · ${PATHWAY_LABEL[entry.detail as Pathway] ?? ''}`,
        };
      case 'registration':
        return {
          entry,
          time,
          link: entry.parent ? `/admin/events/${entry.parent}` : '/admin/events',
          headline: `${entry.who} registered for ${entry.title}`,
          context: [entry.ref, entry.detail].filter(Boolean).join(' · '),
        };
      case 'order':
        return {
          entry,
          time,
          link: `/admin/store/orders/${entry.id}`,
          headline: `${entry.who} placed an order`,
          context: `${entry.ref} · ${formatMoney(Number(entry.detail ?? 0))}`,
        };
    }
  }
}
