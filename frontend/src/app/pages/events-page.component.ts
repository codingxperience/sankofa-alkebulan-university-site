import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiError, newRequestId } from '../core/api/api-client';
import { EventRegistrationPayload, EventsService, PublicEvent, PublicEventList, EventRegistrationResult } from '../events.service';

interface RegistrationForm {
  name: string;
  email: string;
  phone: string;
  place: string;
  organisation: string;
  role: string;
  attendeeCategory: string;
  attendanceMode: string;
  days: string;
  interests: string[];
  question: string;
  accessNeeds: string;
  wantsUpdates: boolean;
  website: string;
}

function emptyForm(): RegistrationForm {
  return {
    name: '',
    email: '',
    phone: '',
    place: '',
    organisation: '',
    role: '',
    attendeeCategory: '',
    attendanceMode: '',
    days: '',
    interests: [],
    question: '',
    accessNeeds: '',
    wantsUpdates: false,
    website: '',
  };
}

function calendarEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function calendarDate(value: Date): string {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './events-page.component.html',
  styleUrl: './events-page.component.scss',
})
export class EventsPageComponent implements OnInit {
  private readonly eventsService = inject(EventsService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly campusImage = '/assets/hero/hero-campus-africa.jpg';
  upcoming: PublicEvent[] = [];
  archive: PublicEvent[] = [];
  selected: PublicEvent | null = null;
  requestedSlug = '';
  loading = true;
  loadError = '';
  registrationOpen = false;
  registrationBusy = false;
  registrationError = '';
  registrationResult: EventRegistrationResult | null = null;
  registrationForm = emptyForm();
  private requestId = newRequestId();

  get eventCount(): number {
    return this.upcoming.length + this.archive.length;
  }

  get registrationStatus(): string {
    const state = this.selected?.registration;
    if (!state) return '';
    if (state.open) return state.waitlist ? 'Waitlist open' : 'Registration open';
    const labels: Record<string, string> = {
      not_published: 'Not open for registration',
      cancelled: 'Cancelled',
      closed: 'Registration closed',
      ended: 'Event concluded',
    };
    return labels[state.reason];
  }

  get waitlistOpen(): boolean {
    const state = this.selected?.registration;
    return !!state?.open && state.waitlist;
  }

  isCancelled(event: PublicEvent): boolean {
    return !event.registration.open && event.registration.reason === 'cancelled';
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.requestedSlug = params.get('slug') ?? '';
      this.selectEvent();
    });
    void this.loadEvents();
  }

  openRegistration(): void {
    if (!this.selected?.registration.open) return;
    this.registrationOpen = true;
    this.registrationError = '';
  }

  closeRegistration(): void {
    this.registrationOpen = false;
    this.registrationError = '';
  }

  retry(): void {
    void this.loadEvents();
  }

  toggleInterest(value: string, checked: boolean): void {
    const interests = new Set(this.registrationForm.interests);
    if (checked) interests.add(value);
    else interests.delete(value);
    this.registrationForm.interests = [...interests];
  }

  async submitRegistration(event: Event): Promise<void> {
    event.preventDefault();
    const selected = this.selected;
    if (!selected || this.registrationBusy || !selected.registration.open) return;

    this.registrationBusy = true;
    this.registrationError = '';
    const form = this.registrationForm;
    const payload: EventRegistrationPayload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      place: form.place,
      organisation: form.organisation,
      role: form.role,
      attendeeCategory: form.attendeeCategory,
      attendanceMode: form.attendanceMode,
      days: form.days,
      interests: form.interests,
      question: form.question,
      accessNeeds: form.accessNeeds,
      wantsUpdates: form.wantsUpdates,
      clientRequestId: this.requestId,
      website: form.website,
    };

    try {
      this.registrationResult = await this.eventsService.registerForEvent(selected.slug, payload);
      this.requestId = newRequestId();
    } catch (error) {
      this.registrationError = ApiError.from(error).message;
    } finally {
      this.registrationBusy = false;
    }
  }

  downloadCalendar(event: PublicEvent): void {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sankofa Alkebulan University//Events//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${calendarEscape(event.slug)}@sankofa-alkebulan-university`,
      `DTSTAMP:${calendarDate(new Date())}`,
      `DTSTART:${calendarDate(new Date(event.startsAt))}`,
      ...(event.endsAt ? [`DTEND:${calendarDate(new Date(event.endsAt))}`] : []),
      `SUMMARY:${calendarEscape(event.title)}`,
      ...(event.venue ? [`LOCATION:${calendarEscape(event.venue)}`] : []),
      ...(event.summary ? [`DESCRIPTION:${calendarEscape(event.summary)}`] : []),
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private async loadEvents(): Promise<void> {
    this.loading = true;
    this.loadError = '';
    try {
      const result: PublicEventList = await this.eventsService.getPublicEvents();
      this.upcoming = result.upcoming;
      this.archive = result.archive;
      this.selectEvent();
    } catch (error) {
      this.loadError = ApiError.from(error).message;
    } finally {
      this.loading = false;
    }
  }

  private selectEvent(): void {
    if (this.loading && !this.eventCount) return;
    const all = [...this.upcoming, ...this.archive];
    this.selected = this.requestedSlug
      ? all.find((event) => event.slug === this.requestedSlug) ?? null
      : this.upcoming[0] ?? this.archive[0] ?? null;
    this.registrationOpen = false;
    this.registrationResult = null;
    this.registrationError = '';
    this.registrationForm = emptyForm();
    this.requestId = newRequestId();
  }
}
