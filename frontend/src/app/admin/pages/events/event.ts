import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { Confirmations, Toasts } from '../../core/feedback';
import { WhenPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { EventDetail, EventStatus, Page, Registration, RegistrationStatus, Tally } from '../../core/types';
import { EVENT_STATUS, REGISTRATION_CLOSED_REASON, REGISTRATION_STATUS } from '../../core/vocabulary';
import { formatInZone } from '../../core/zones';
import { Empty, Pill, Skeleton } from '../../ui/ui';

@Component({
  selector: 'sc-event',
  imports: [RouterLink, Pill, Empty, Skeleton, WhenPipe],
  templateUrl: './event.html',
  styleUrl: './event.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly confirmations = inject(Confirmations);
  protected readonly session = inject(StaffSession);

  protected readonly statusTerms = EVENT_STATUS;
  protected readonly registrationTerms = REGISTRATION_STATUS;

  protected readonly event = signal<EventDetail | null>(null);
  protected readonly failed = signal('');
  protected readonly registrations = signal<readonly Registration[]>([]);
  protected readonly cursor = signal<string | null>(null);
  protected readonly loadingList = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly filter = signal<RegistrationStatus | ''>('');
  protected readonly query = signal('');
  protected readonly expanded = signal<string | null>(null);
  protected readonly busy = signal<string | null>(null);

  protected readonly canManage = computed(() => this.session.can('events.manage'));

  protected readonly schedule = computed(() => {
    const event = this.event();
    if (!event) {
      return null;
    }
    return {
      starts: formatInZone(event.startsAt, event.timezone),
      ends: event.endsAt ? formatInZone(event.endsAt, event.timezone) : null,
      closes: formatInZone(event.registrationClosesAt ?? event.startsAt, event.timezone),
    };
  });

  protected readonly registrationLine = computed(() => {
    const state = this.event()?.registration;
    if (!state) {
      return '';
    }
    if (state.open) {
      return state.waitlist ? 'Full — new registrations join the waiting list' : 'Open';
    }
    return REGISTRATION_CLOSED_REASON[state.reason] ?? 'Closed';
  });

  /** Answers to each question the event's form actually asks; questions it leaves out are not shown. */
  protected readonly breakdowns = computed(() => {
    const event = this.event();
    if (!event) {
      return [];
    }
    const { breakdown: b, options: o } = event;
    return [
      { title: 'Joining', rows: b.attendanceMode, asked: o.attendanceModes.length > 0 },
      { title: 'Attending as', rows: b.attendeeCategory, asked: o.attendeeCategories.length > 0 },
      { title: 'Days', rows: b.days, asked: o.days.length > 0 },
      { title: 'Themes of interest', rows: b.interests, asked: o.interests.length > 0 },
    ].filter((group) => group.asked && group.rows.length > 0);
  });

  protected readonly exportUrl = computed(() => {
    const event = this.event();
    return event ? this.api.url(`/events/${event.id}/registrations/export`) : '';
  });

  private eventId = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const subscription = inject(ActivatedRoute).paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.eventId = id;
        void this.loadEvent();
        void this.loadRegistrations();
      }
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  protected count(status: RegistrationStatus): number {
    return this.event()?.breakdown.status[status] ?? 0;
  }

  protected share(rows: readonly Tally[], row: Tally): number {
    const max = Math.max(...rows.map((r) => r.count), 1);
    return (row.count / max) * 100;
  }

  protected choose(status: RegistrationStatus | ''): void {
    this.filter.set(status);
    void this.loadRegistrations();
  }

  protected search(value: string): void {
    this.query.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => void this.loadRegistrations(), 300);
  }

  protected toggle(id: string): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  protected async checkIn(registration: Registration): Promise<void> {
    await this.changeRegistration(registration, { checkedIn: !registration.checkedInAt }, registration.checkedInAt ? 'Check-in undone.' : `${registration.name} checked in.`);
  }

  protected async setRegistrationStatus(registration: Registration, status: RegistrationStatus): Promise<void> {
    if (status === 'CANCELLED') {
      const yes = await this.confirmations.ask({
        title: `Cancel ${registration.name}’s registration?`,
        body: 'Their place is released. They are not emailed — let them know if they did not ask for this.',
        confirm: 'Cancel registration',
        tone: 'danger',
      });
      if (!yes) {
        return;
      }
    }
    const done = status === 'CONFIRMED' ? `${registration.name} has a place.` : status === 'CANCELLED' ? 'Registration cancelled.' : 'Moved to the waiting list.';
    await this.changeRegistration(registration, { status }, done);
  }

  protected async setEventStatus(status: EventStatus): Promise<void> {
    const event = this.event();
    if (!event) {
      return;
    }
    if (status === 'CANCELLED') {
      const yes = await this.confirmations.ask({
        title: `Cancel “${event.title}”?`,
        body: 'Registration closes at once and the public page says the event is cancelled. Registrants are not emailed automatically.',
        confirm: 'Cancel the event',
        tone: 'danger',
      });
      if (!yes) {
        return;
      }
    }
    try {
      this.event.set(await this.api.patch<EventDetail>(`/events/${event.id}`, { status }));
      this.toasts.success(status === 'PUBLISHED' ? 'Published. Registration is open.' : status === 'CANCELLED' ? 'Event cancelled.' : 'Moved back to draft.');
    } catch (error) {
      this.toasts.error(error);
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
      this.registrations.update((list) => [...list, ...page.items]);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loadingMore.set(false);
    }
  }

  private async changeRegistration(registration: Registration, change: { status?: RegistrationStatus; checkedIn?: boolean }, done: string): Promise<void> {
    this.busy.set(registration.id);
    try {
      const updated = await this.api.patch<Registration>(`/events/${this.eventId}/registrations/${registration.id}`, change);
      this.registrations.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      this.toasts.success(done);
      void this.loadEvent();
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.busy.set(null);
    }
  }

  private async loadEvent(): Promise<void> {
    try {
      this.event.set(await this.api.get<EventDetail>(`/events/${this.eventId}`));
    } catch (error) {
      this.failed.set(error instanceof Error ? error.message : 'This event could not be opened.');
    }
  }

  private async loadRegistrations(): Promise<void> {
    this.loadingList.set(true);
    try {
      const page = await this.fetch(null);
      this.registrations.set(page.items);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loadingList.set(false);
    }
  }

  private fetch(cursor: string | null): Promise<Page<Registration>> {
    return this.api.get<Page<Registration>>(`/events/${this.eventId}/registrations`, {
      status: this.filter() || undefined,
      q: this.query().trim() || undefined,
      cursor: cursor ?? undefined,
      limit: 50,
    });
  }
}
