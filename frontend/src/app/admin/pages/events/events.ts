import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { Toasts } from '../../core/feedback';
import { StaffSession } from '../../core/staff-session';
import type { EventSummary } from '../../core/types';
import { EVENT_STATUS, REGISTRATION_CLOSED_REASON } from '../../core/vocabulary';
import { formatInZone } from '../../core/zones';
import { Empty, Pill, Skeleton } from '../../ui/ui';

@Component({
  selector: 'sc-events',
  imports: [RouterLink, Pill, Empty, Skeleton],
  template: `
    <header class="sc-head">
      <div class="sc-head__text">
        <p class="sc-eyebrow">Public programmes</p>
        <h1 class="sc-title">Events</h1>
        <p class="sc-lede">Each event defines its own registration form, capacity and closing time. Registrations past capacity join a waiting list.</p>
      </div>
      @if (session.can('events.manage')) {
        <div class="sc-head__actions">
          <a class="sc-btn sc-btn--primary" routerLink="/admin/events/new"><i class="pi pi-plus" aria-hidden="true"></i> New event</a>
        </div>
      }
    </header>

    @if (loading()) {
      <div class="sc-card"><sc-skeleton [lines]="6" /></div>
    } @else if (events().length === 0) {
      <div class="sc-card">
        <sc-empty title="No events yet" icon="pi-calendar">
          <p>Create an event to open registration for it. Drafts stay private until you publish them.</p>
        </sc-empty>
      </div>
    } @else {
      <div class="ev-grid">
        @for (event of events(); track event.id) {
          <a class="sc-card ev-card" [routerLink]="['/admin/events', event.id]">
            <div class="ev-card__top">
              <sc-pill [label]="statusTerms[event.status].label" [tone]="statusTerms[event.status].tone" />
              <span class="ev-card__state" [class.is-open]="event.registration.open">{{ registrationLine(event) }}</span>
            </div>
            <h2 class="ev-card__title">{{ event.title }}</h2>
            <p class="ev-card__when">{{ when(event) }}</p>
            @if (event.venue) {
              <p class="ev-card__venue"><i class="pi pi-map-marker" aria-hidden="true"></i> {{ event.venue }}</p>
            }
            <div class="ev-card__fill">
              @if (event.capacity) {
                <span class="sc-bar__track" aria-hidden="true"><span [style.width.%]="fill(event)"></span></span>
                <span class="ev-card__numbers">
                  <strong>{{ event.counts.confirmed }}</strong> of {{ event.capacity }} places
                  @if (event.counts.waitlisted) {
                    · {{ event.counts.waitlisted }} waiting
                  }
                </span>
              } @else {
                <span class="ev-card__numbers"><strong>{{ event.counts.confirmed }}</strong> registered · no limit</span>
              }
              @if (event.counts.checkedIn) {
                <span class="ev-card__numbers">{{ event.counts.checkedIn }} checked in</span>
              }
            </div>
          </a>
        }
      </div>
    }
  `,
  styles: `
    .ev-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .ev-card {
      display: grid;
      align-content: start;
      gap: 8px;
      padding: 20px;
      color: inherit;
      text-decoration: none;
      transition:
        box-shadow 160ms ease,
        border-color 160ms ease,
        transform 160ms ease;

      &:hover {
        border-color: var(--sc-line);
        background: var(--sc-card-2);
        transform: translateY(-1px);
      }
    }

    .ev-card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 4px;
    }

    .ev-card__state {
      font-size: 12px;
      color: var(--sc-ink-3);

      &.is-open {
        color: var(--sc-green);
      }
    }

    .ev-card__title {
      font-size: 17px;
      font-weight: 600;
      line-height: 1.3;
      letter-spacing: -0.012em;
    }

    .ev-card__when,
    .ev-card__venue {
      font-size: 13px;
      color: var(--sc-ink-2);
    }

    .ev-card__venue i {
      font-size: 12px;
      color: var(--sc-gold-ink);
    }

    .ev-card__fill {
      display: grid;
      gap: 6px;
      margin-top: 10px;
      padding-top: 14px;
      border-top: 1px solid var(--sc-line-2);
    }

    .ev-card__numbers {
      font-size: 12.5px;
      color: var(--sc-ink-3);

      strong {
        color: var(--sc-ink);
        font-weight: 600;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  protected readonly session = inject(StaffSession);
  protected readonly statusTerms = EVENT_STATUS;

  protected readonly events = signal<readonly EventSummary[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.api
      .get<EventSummary[]>('/events')
      .then((events) => this.events.set(events))
      .catch((error: unknown) => this.toasts.error(error))
      .finally(() => this.loading.set(false));
  }

  protected when(event: EventSummary): string {
    return formatInZone(event.startsAt, event.timezone);
  }

  protected fill(event: EventSummary): number {
    return event.capacity ? Math.min(100, (event.counts.confirmed / event.capacity) * 100) : 0;
  }

  protected registrationLine(event: EventSummary): string {
    const state = event.registration;
    if (state.open) {
      return state.waitlist ? 'Full · taking a waiting list' : 'Registration open';
    }
    return REGISTRATION_CLOSED_REASON[state.reason] ?? 'Closed';
  }
}
