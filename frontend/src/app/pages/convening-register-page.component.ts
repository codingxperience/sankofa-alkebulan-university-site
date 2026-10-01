import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiClient, ApiError, newRequestId } from '../core/api/api-client';

interface RegForm {
  name: string;
  email: string;
  phone: string;
  place: string;
  org: string;
  role: string;
  cat: string;
  mode: string;
  days: string;
  interests: string[];
  question: string;
  needs: string;
  consent: boolean;
  website: string;
}

/** Consent starts unticked: people opt in to updates, they are never opted in for them. */
const EMPTY: RegForm = {
  name: '', email: '', phone: '', place: '', org: '', role: '', cat: '', mode: '', days: '',
  interests: [], question: '', needs: '', consent: false, website: '',
};

const EVENT_SLUG = 'sankofa-convening-2026';
const STORAGE_KEY = 'sau_convening_reg';

interface EventOptions {
  attendeeCategories: string[];
  attendanceModes: string[];
  days: string[];
  interests: string[];
}

interface PublicEvent {
  title: string;
  startsAt: string;
  registration: { open: true; waitlist: boolean } | { open: false; reason: 'not_published' | 'cancelled' | 'closed' | 'ended' };
  options: EventOptions;
  consentText: string;
}

interface RegistrationResult {
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
  code?: string;
  alreadyRegistered: boolean;
  confirmationEmailed: boolean;
}

const CLOSED_MESSAGES: Record<string, string> = {
  ended: 'The Convening took place on 14–15 August 2026. Thank you to everyone who joined us in Munyonyo and online.',
  closed: 'Registration for the Convening has closed.',
  cancelled: 'The Convening has been cancelled. We will share any new dates as soon as they are set.',
  not_published: 'Registration for the Convening has not opened yet.',
};

@Component({
  selector: 'app-convening-register-page',
  imports: [RouterLink],
  templateUrl: './convening-register-page.component.html',
  styleUrl: './convening-register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConveningRegisterPageComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(ApiClient);

  readonly event = signal<PublicEvent | null>(null);
  readonly loadError = signal('');
  readonly form = signal<RegForm>({ ...EMPTY });
  readonly sending = signal(false);
  readonly result = signal<RegistrationResult | null>(null);
  readonly error = signal<ApiError | null>(null);
  private requestId = newRequestId();

  readonly options = computed<EventOptions>(
    () => this.event()?.options ?? { attendeeCategories: [], attendanceModes: [], days: [], interests: [] },
  );
  readonly closedMessage = computed(() => {
    const registration = this.event()?.registration;
    return registration && !registration.open ? CLOSED_MESSAGES[registration.reason] : '';
  });
  readonly waitlistOnly = computed(() => {
    const registration = this.event()?.registration;
    return Boolean(registration?.open && registration.waitlist);
  });
  readonly fieldErrors = computed(() => this.error()?.fields ?? {});
  readonly firstName = computed(() => this.form().name.trim().split(/\s+/)[0] || 'Friend');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        this.form.set({ ...EMPTY, ...saved, website: '' });
      }
    } catch {
      /* ignore corrupt storage */
    }
    void this.loadEvent();
  }

  async loadEvent(): Promise<void> {
    this.loadError.set('');
    try {
      this.event.set(await this.api.get<PublicEvent>(`/events/${EVENT_SLUG}`));
    } catch (error) {
      this.loadError.set(ApiError.from(error).message);
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const { website: _trap, ...answers } = this.form();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      /* storage may be unavailable */
    }
  }

  onField(field: keyof RegForm, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.form.update((f) => ({ ...f, [field]: value }));
    this.error.set(null);
    this.persist();
  }

  pickSingle(field: 'cat' | 'mode' | 'days', label: string): void {
    this.form.update((f) => ({ ...f, [field]: label }));
    this.error.set(null);
    this.persist();
  }

  toggleInterest(label: string): void {
    this.form.update((f) => ({
      ...f,
      interests: f.interests.includes(label) ? f.interests.filter((i) => i !== label) : [...f.interests, label],
    }));
    this.persist();
  }

  toggleConsent(): void {
    this.form.update((f) => ({ ...f, consent: !f.consent }));
    this.persist();
  }

  isInterest(label: string): boolean {
    return this.form().interests.includes(label);
  }

  async submit(): Promise<void> {
    if (this.sending()) {
      return;
    }
    const s = this.form();
    this.sending.set(true);
    this.error.set(null);
    try {
      const result = await this.api.post<RegistrationResult>(`/events/${EVENT_SLUG}/registrations`, {
        name: s.name,
        email: s.email,
        phone: s.phone,
        place: s.place,
        organisation: s.org,
        role: s.role,
        attendeeCategory: s.cat,
        attendanceMode: s.mode,
        days: s.days,
        interests: s.interests,
        question: s.question,
        accessNeeds: s.needs,
        wantsUpdates: s.consent,
        website: s.website,
        clientRequestId: this.requestId,
      });
      this.result.set(result);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem(STORAGE_KEY);
        window.scrollTo(0, 0);
      }
    } catch (error) {
      const apiError = ApiError.from(error);
      this.error.set(apiError);
      if (apiError.code === 'registration_closed') {
        void this.loadEvent();
      }
    } finally {
      this.sending.set(false);
    }
  }
}
