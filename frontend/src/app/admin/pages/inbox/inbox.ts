import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Toasts } from '../../core/feedback';
import { AgoPipe, InitialsPipe, WhenPipe } from '../../core/format';
import type { InquiryCounts, InquiryStatus, InquirySummary, Office, Page } from '../../core/types';
import { INQUIRY_STATUS, OFFICE_ORDER } from '../../core/vocabulary';
import { Empty, Pill, Skeleton } from '../../ui/ui';
import { InboxSync } from './inbox-sync';

type View = 'ACTIVE' | InquiryStatus;

const VIEWS: ReadonlyArray<{ value: View; label: string }> = [
  { value: 'ACTIVE', label: 'Open' },
  { value: 'NEW', label: 'New' },
  { value: 'AWAITING_REPLY', label: 'Replied' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'SPAM', label: 'Spam' },
];

/**
 * Correspondence for the seven offices. The list stays on the left while a
 * message is open on the right, so working through a queue never loses
 * your place.
 */
@Component({
  selector: 'sc-inbox',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Pill, Empty, Skeleton, AgoPipe, InitialsPipe, WhenPipe],
  providers: [InboxSync],
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InboxPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly sync = inject(InboxSync);
  protected readonly state = inject(ConsoleState);

  protected readonly views = VIEWS;
  protected readonly offices = OFFICE_ORDER;
  protected readonly statusTerms = INQUIRY_STATUS;

  protected readonly view = signal<View>('ACTIVE');
  protected readonly office = signal<Office | null>(null);
  protected readonly assignee = signal<string>('');
  protected readonly query = signal('');

  protected readonly items = signal<readonly InquirySummary[]>([]);
  protected readonly cursor = signal<string | null>(null);
  protected readonly counts = signal<InquiryCounts | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly reading = signal(false);

  protected readonly activeTotal = computed(() => {
    const status = this.counts()?.status ?? {};
    return (status.NEW ?? 0) + (status.OPEN ?? 0) + (status.AWAITING_REPLY ?? 0);
  });

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.state.ensureDirectory().catch(() => undefined);
    void this.load();
    void this.loadCounts();

    const updateReading = () => this.reading.set(/^\/admin\/inbox\/[^/?#]+/.test(this.router.url));
    updateReading();
    const navigation = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(updateReading);
    inject(DestroyRef).onDestroy(() => navigation.unsubscribe());

    // When the open message changes, reflect it in the list and the counts.
    effect(() => {
      const detail = this.sync.latest();
      if (!detail) {
        return;
      }
      untracked(() => {
        this.items.update((list) =>
          list.map((item) =>
            item.id === detail.id
              ? { ...item, status: detail.status, office: detail.office, assignee: detail.assignee, notes: detail.notes.length }
              : item,
          ),
        );
        void this.loadCounts();
        this.state.refreshSoon();
      });
    });
  }

  protected viewCount(view: View): number | null {
    const counts = this.counts();
    if (!counts) {
      return null;
    }
    return view === 'ACTIVE' ? this.activeTotal() : (counts.status[view] ?? 0);
  }

  protected officeCount(office: Office): number {
    return this.counts()?.activeByOffice[office] ?? 0;
  }

  protected chooseView(view: View): void {
    this.view.set(view);
    void this.load();
  }

  protected chooseOffice(office: Office | null): void {
    this.office.set(office);
    void this.load();
  }

  protected chooseAssignee(value: string): void {
    this.assignee.set(value);
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
      this.items.update((list) => [...list, ...page.items]);
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
      this.items.set(page.items);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCounts(): Promise<void> {
    try {
      this.counts.set(await this.api.get<InquiryCounts>('/inquiries/counts'));
    } catch {
      // Counts are a convenience; the list itself still works without them.
    }
  }

  private fetch(cursor: string | null): Promise<Page<InquirySummary>> {
    return this.api.get<Page<InquirySummary>>('/inquiries', {
      status: this.view(),
      office: this.office() ?? undefined,
      assignee: this.assignee() || undefined,
      q: this.query().trim() || undefined,
      cursor: cursor ?? undefined,
      limit: 30,
    });
  }
}
