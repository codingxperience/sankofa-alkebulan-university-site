import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Toasts } from '../../core/feedback';
import { AgoPipe, WhenPipe, dayHeading, formatDate, formatMoney } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type {
  ApplicationStatus,
  ApplicationSummary,
  DaybookEntry,
  DaybookKind,
  InquiryDetail,
  InquiryStatus,
  InquirySummary,
  Office,
  Page,
  Pathway,
} from '../../core/types';
import { APPLICATION_STATUS, DAYBOOK_KIND, INQUIRY_STATUS, PATHWAY_LABEL, daybookStatus } from '../../core/vocabulary';
import { formatInZone } from '../../core/zones';
import { Empty, Face, Pill, PopAnchor, Skeleton } from '../../ui/ui';
import { TopSlot } from '../../shell/top-slot';
import { ActivityChart } from './activity-chart';
import { DayStrip } from './day-strip';
import { daybookLink } from './daybook-links';
import { FocusSummary, type FocusTarget } from './focus-summary';

const KIND_PERMISSION = {
  inquiry: 'inquiries.read',
  application: 'applications.read',
  registration: 'events.read',
  order: 'store.read',
} as const;

type ApplicantView = 'PIPELINE' | Extract<ApplicationStatus, 'SUBMITTED' | 'UNDER_REVIEW' | 'OFFER' | 'DRAFT'>;
type MessageView = 'ACTIVE' | 'MINE' | Extract<InquiryStatus, 'NEW' | 'AWAITING_REPLY' | 'RESOLVED'>;

const APPLICANT_VIEWS: ReadonlyArray<{ value: ApplicantView; label: string; hot?: boolean }> = [
  { value: 'PIPELINE', label: 'All' },
  { value: 'SUBMITTED', label: 'Just submitted', hot: true },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'OFFER', label: 'Offers' },
  { value: 'DRAFT', label: 'Still writing' },
];

const MESSAGE_VIEWS: ReadonlyArray<{ value: MessageView; label: string; hot?: boolean }> = [
  { value: 'ACTIVE', label: 'All open' },
  { value: 'NEW', label: 'Unread', hot: true },
  { value: 'MINE', label: 'With me' },
  { value: 'AWAITING_REPLY', label: 'Replied' },
  { value: 'RESOLVED', label: 'Resolved' },
];

/** The states a message can be moved to from its card. */
const MESSAGE_STATUSES: readonly InquiryStatus[] = ['NEW', 'OPEN', 'AWAITING_REPLY', 'RESOLVED'];

const STEPS = 6;
const CARDS = 12;

interface Line {
  readonly entry: DaybookEntry;
  readonly link: string;
  readonly time: string;
  readonly headline: string;
  readonly context: string;
}

/**
 * The console's first screen. Across the top, today as a line of hours;
 * then the figures that say what is waiting, the applicants and messages
 * that need a person, a summary of whichever one is in focus, and below it
 * all the daybook — every arrival, newest first, the way it came in.
 */
@Component({
  selector: 'sc-workspace',
  imports: [RouterLink, ActivityChart, DayStrip, FocusSummary, Face, Pill, Empty, Skeleton, PopAnchor, AgoPipe, WhenPipe],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  protected readonly state = inject(ConsoleState);
  protected readonly session = inject(StaffSession);
  private readonly slot = inject(TopSlot);

  private readonly strip = viewChild.required<TemplateRef<unknown>>('strip');
  private readonly summaryPanel = viewChild<ElementRef<HTMLElement>>('summaryPanel');
  private readonly daybookTitle = viewChild<ElementRef<HTMLElement>>('daybookTitle');

  protected readonly overview = this.state.overview;
  protected readonly today = formatDate(new Date(), 'day');
  protected readonly greeting = (() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  })();
  protected readonly firstName = computed(() => this.session.me()?.name.split(/\s+/)[0] ?? '');

  // ─── What is waiting, in figures ────────────────────────────────────

  protected readonly figures = computed(() => {
    const o = this.overview();
    if (!o) {
      return [];
    }
    const today = (kind: DaybookKind) => o.activity.series[kind]?.at(-1) ?? 0;
    const figures: Array<{ value: number; label: string; today: number; link: string }> = [];
    if (o.inquiries) {
      figures.push({ value: o.inquiries.new, label: o.inquiries.new === 1 ? 'unread message' : 'unread messages', today: today('inquiry'), link: '/admin/inbox' });
    }
    if (o.applications) {
      figures.push({ value: o.applications.awaitingDecision, label: 'to decide', today: today('application'), link: '/admin/admissions' });
    }
    if (o.store) {
      const orders = o.store.toFulfil + o.store.awaitingPayment;
      figures.push({ value: orders, label: orders === 1 ? 'order to act on' : 'orders to act on', today: today('order'), link: '/admin/store/orders' });
    }
    if (o.events) {
      const registered = o.events.upcoming.reduce((sum, event) => sum + event.confirmed, 0);
      figures.push({ value: registered, label: 'registered ahead', today: today('registration'), link: '/admin/events' });
    }
    return figures;
  });

  /** One sentence for anyone who would rather read than scan. */
  protected readonly headline = computed(() => {
    const overview = this.overview();
    if (!overview) {
      return '';
    }
    const parts: string[] = [];
    const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    if (overview.inquiries?.new) parts.push(count(overview.inquiries.new, 'unread message', 'unread messages'));
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

  protected readonly creates = computed(() => {
    this.session.me();
    const options = [
      { permission: 'events.manage', link: '/admin/events/new', icon: 'pi-calendar-plus', label: 'Event', note: 'A convening, lecture or open day' },
      { permission: 'journal.manage', link: '/admin/journal/new', icon: 'pi-pen-to-square', label: 'Journal article', note: 'Written here, published on the site' },
      { permission: 'staff.manage', link: '/admin/team', icon: 'pi-user-plus', label: 'Colleague', note: 'Invite someone to the console' },
      { permission: 'store.manage', link: '/admin/store/products', icon: 'pi-box', label: 'Product', note: 'Add to the store catalogue' },
    ] as const;
    return options.filter((option) => this.session.can(option.permission));
  });

  // ─── Today, for the line across the top ─────────────────────────────

  protected readonly todayEntries = signal<readonly DaybookEntry[]>([]);
  protected readonly todayEvents = computed(() => {
    const now = new Date().toDateString();
    return (this.overview()?.events?.upcoming ?? []).filter((event) => new Date(event.startsAt).toDateString() === now);
  });

  // ─── Applicants ─────────────────────────────────────────────────────

  protected readonly canApplicants = computed(() => {
    this.session.me();
    return this.session.can('applications.read');
  });
  protected readonly applicantViews = APPLICANT_VIEWS;
  protected readonly applicantView = signal<ApplicantView>('PIPELINE');
  protected readonly applicants = signal<readonly ApplicationSummary[]>([]);
  protected readonly applicantsLoading = signal(true);
  protected readonly steps = Array.from({ length: STEPS }, (_, i) => i);

  // ─── Messages ───────────────────────────────────────────────────────

  protected readonly canMessages = computed(() => {
    this.session.me();
    return this.session.can('inquiries.read');
  });
  protected readonly canAnswer = computed(() => {
    this.session.me();
    return this.session.can('inquiries.manage');
  });
  protected readonly messageViews = MESSAGE_VIEWS;
  protected readonly messageView = signal<MessageView>('ACTIVE');
  protected readonly messages = signal<readonly InquirySummary[]>([]);
  protected readonly messagesLoading = signal(true);
  protected readonly messageStatuses = MESSAGE_STATUSES;
  protected readonly inquiryStatus = INQUIRY_STATUS;
  protected readonly saving = signal<string | null>(null);

  // ─── The record in focus ────────────────────────────────────────────

  protected readonly focus = signal<FocusTarget | null>(null);
  protected readonly revision = signal(0);

  // ─── The daybook ────────────────────────────────────────────────────

  protected readonly kinds = computed(() =>
    (Object.keys(KIND_PERMISSION) as DaybookKind[]).filter((kind) => this.session.can(KIND_PERMISSION[kind])),
  );
  protected readonly kindLabel = DAYBOOK_KIND;
  protected readonly filter = signal<DaybookKind | null>(null);
  protected readonly entries = signal<readonly DaybookEntry[]>([]);
  protected readonly cursor = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);

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
    void this.loadToday();
    if (this.canApplicants()) {
      void this.loadApplicants();
    } else {
      this.applicantsLoading.set(false);
    }
    if (this.canMessages()) {
      void this.loadMessages();
    } else {
      this.messagesLoading.set(false);
    }

    // The line of the day lives in the shell's top row, beside the notices.
    let shown: TemplateRef<unknown> | null = null;
    afterNextRender(() => {
      shown = this.strip();
      this.slot.show(shown);
    });
    inject(DestroyRef).onDestroy(() => {
      if (shown) {
        this.slot.clear(shown);
      }
    });
  }

  // ─── Cards ──────────────────────────────────────────────────────────

  protected applicantName(item: ApplicationSummary): string {
    return item.name || item.email || 'An applicant';
  }

  protected applicantRole(item: ApplicationSummary): string {
    return item.firstChoice || `${PATHWAY_LABEL[item.pathway as Pathway]} application`;
  }

  protected applicationStatus(item: ApplicationSummary) {
    return APPLICATION_STATUS[item.status];
  }

  protected isFocus(kind: FocusTarget['kind'], id: string): boolean {
    const focus = this.focus();
    return focus?.kind === kind && focus.id === id;
  }

  protected focusOn(kind: FocusTarget['kind'], id: string): void {
    this.focus.set({ kind, id });
    // When the summary sits below the cards rather than beside them, bring it into view.
    const panel = this.summaryPanel()?.nativeElement;
    if (panel && panel.getBoundingClientRect().top > window.innerHeight - 80) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected chooseApplicants(view: ApplicantView): void {
    if (this.applicantView() !== view) {
      this.applicantView.set(view);
      void this.loadApplicants();
    }
  }

  protected chooseMessages(view: MessageView): void {
    if (this.messageView() !== view) {
      this.messageView.set(view);
      void this.loadMessages();
    }
  }

  protected async setStatus(item: InquirySummary, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const status = select.value as InquiryStatus;
    if (status === item.status) {
      return;
    }
    this.saving.set(item.id);
    try {
      const updated = await this.api.patch<InquiryDetail>(`/inquiries/${item.id}`, { status });
      this.messages.update((list) => list.map((message) => (message.id === item.id ? { ...message, status: updated.status, updatedAt: updated.updatedAt } : message)));
      this.toasts.success(`${item.name}'s message is marked ${INQUIRY_STATUS[updated.status].label}.`);
      this.state.refreshSoon();
      if (this.isFocus('inquiry', item.id)) {
        this.revision.update((n) => n + 1);
      }
    } catch (error) {
      select.value = item.status;
      this.toasts.error(error);
    } finally {
      this.saving.set(null);
    }
  }

  // ─── Daybook ────────────────────────────────────────────────────────

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

  protected toDaybook(): void {
    const heading = this.daybookTitle()?.nativeElement;
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      heading.focus({ preventScroll: true });
    }
  }

  protected closeCreate(): void {
    document.getElementById('ws-create')?.hidePopover();
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

  // ─── Loading ────────────────────────────────────────────────────────

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

  private async loadToday(): Promise<void> {
    try {
      const page = await this.api.get<Page<DaybookEntry>>('/daybook', { limit: 100 });
      const today = new Date().toDateString();
      this.todayEntries.set(page.items.filter((entry) => new Date(entry.at).toDateString() === today));
    } catch {
      // The line across the top is a convenience; the daybook below reports its own failures.
    }
  }

  private async loadApplicants(): Promise<void> {
    this.applicantsLoading.set(true);
    try {
      const page = await this.api.get<Page<ApplicationSummary>>('/applications', { status: this.applicantView(), limit: CARDS });
      this.applicants.set(page.items);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.applicantsLoading.set(false);
      this.settleFocus();
    }
  }

  private async loadMessages(): Promise<void> {
    this.messagesLoading.set(true);
    const view = this.messageView();
    try {
      const page = await this.api.get<Page<InquirySummary>>('/inquiries', {
        status: view === 'MINE' ? 'ACTIVE' : view,
        assignee: view === 'MINE' ? 'me' : undefined,
        limit: CARDS,
      });
      this.messages.set(page.items);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.messagesLoading.set(false);
      this.settleFocus();
    }
  }

  /** Until someone picks a card, the summary shows the first message, or failing that the first applicant. */
  private settleFocus(): void {
    if (this.focus()) {
      return;
    }
    if (this.canMessages() && this.messagesLoading()) {
      return;
    }
    const message = this.messages()[0];
    const applicant = this.applicants()[0];
    if (message) {
      this.focus.set({ kind: 'inquiry', id: message.id });
    } else if (applicant && !this.applicantsLoading()) {
      this.focus.set({ kind: 'application', id: applicant.id });
    }
  }

  private fetch(cursor: string | null): Promise<Page<DaybookEntry>> {
    return this.api.get<Page<DaybookEntry>>('/daybook', { kind: this.filter() ?? undefined, cursor: cursor ?? undefined, limit: 40 });
  }

  private describe(entry: DaybookEntry): Line {
    const time = formatDate(entry.at, 'time');
    const link = daybookLink(entry);
    switch (entry.kind) {
      case 'inquiry':
        return {
          entry,
          time,
          link,
          headline: entry.title ? `${entry.who} — ${entry.title}` : `${entry.who ?? 'Someone'} wrote in`,
          context: `${entry.ref} · ${entry.detail ? this.state.officeName(entry.detail as Office) : ''}`,
        };
      case 'application':
        return {
          entry,
          time,
          link,
          headline: `${entry.who || 'An applicant'} applied${entry.title ? ` for ${entry.title}` : ''}`,
          context: `${entry.ref} · ${PATHWAY_LABEL[entry.detail as Pathway] ?? ''}`,
        };
      case 'registration':
        return {
          entry,
          time,
          link,
          headline: `${entry.who} registered for ${entry.title}`,
          context: [entry.ref, entry.detail].filter(Boolean).join(' · '),
        };
      case 'order':
        return {
          entry,
          time,
          link,
          headline: `${entry.who} placed an order`,
          context: `${entry.ref} · ${formatMoney(Number(entry.detail ?? 0))}`,
        };
    }
  }
}
