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
}

const EMPTY: RegForm = {
  name: '', email: '', phone: '', place: '', org: '', role: '', cat: '', mode: '', days: '',
  interests: [], question: '', needs: '', consent: true,
};

const CAT_OPTIONS = [
  'Scholar / academic',
  'Government / institutional partner',
  'Student / prospective student',
  'Diaspora',
  'General public',
  'Press / media',
];
const MODE_OPTIONS = ['In person — Speke Resort', 'Online — Zoom'];
const DAY_OPTIONS = ['Fri 14 — Keynote', 'Sat 15 — Mini-conference', 'Both days'];
const INTEREST_OPTIONS = ['Cultural identity', 'Indigenous knowledge', 'Intellectual cooperation'];
const STORAGE_KEY = 'sau_convening_reg';

@Component({
  selector: 'app-convening-register-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './convening-register-page.component.html',
  styleUrl: './convening-register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConveningRegisterPageComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  readonly catOptions = CAT_OPTIONS;
  readonly modeOptions = MODE_OPTIONS;
  readonly dayOptions = DAY_OPTIONS;
  readonly interestOptions = INTEREST_OPTIONS;

  readonly form = signal<RegForm>({ ...EMPTY });
  readonly submitted = signal(false);
  readonly error = signal('');
  readonly copied = signal(false);

  readonly firstName = computed(() => this.form().name.trim().split(/\s+/)[0] || 'Friend');

  readonly message = computed(() => {
    const s = this.form();
    const lines = [
      'REGISTRATION — The Sankofa Convening 2026',
      '14–15 August 2026 · Speke Resort, Munyonyo & Zoom',
      '',
      'Name: ' + s.name,
      'Email: ' + s.email,
    ];
    if (s.phone) lines.push('WhatsApp/phone: ' + s.phone);
    if (s.place) lines.push('Country & city: ' + s.place);
    if (s.org || s.role) lines.push('Organisation & role: ' + [s.org, s.role].filter(Boolean).join(' — '));
    lines.push('Attending as: ' + s.cat);
    lines.push('Joining: ' + s.mode);
    lines.push('Day(s): ' + s.days);
    if (s.interests.length) lines.push('Mini-conference themes: ' + s.interests.join(', '));
    if (s.question) lines.push('Question/topic: ' + s.question);
    if (s.needs) lines.push('Access/dietary: ' + s.needs);
    lines.push('Updates: ' + (s.consent ? 'yes, keep me informed' : 'no'));
    return lines.join('\n');
  });

  readonly waHref = computed(
    () => 'https://wa.me/256765871126?text=' + encodeURIComponent(this.message()),
  );
  readonly mailHref = computed(
    () =>
      'mailto:SanAlkeU@outlook.com?subject=' +
      encodeURIComponent('Registration — The Sankofa Convening 2026') +
      '&body=' +
      encodeURIComponent(this.message()),
  );
  readonly copyLabel = computed(() => (this.copied() ? 'Copied' : 'Copy the message'));

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        this.form.set({ ...EMPTY, ...saved });
      }
    } catch {
      /* ignore corrupt storage */
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form()));
    } catch {
      /* storage may be unavailable */
    }
  }

  onField(field: keyof RegForm, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.form.update((f) => ({ ...f, [field]: value }));
    this.error.set('');
    this.persist();
  }

  pickSingle(field: 'cat' | 'mode' | 'days', label: string): void {
    this.form.update((f) => ({ ...f, [field]: label }));
    this.error.set('');
    this.persist();
  }

  toggleInterest(label: string): void {
    this.form.update((f) => ({
      ...f,
      interests: f.interests.includes(label)
        ? f.interests.filter((i) => i !== label)
        : [...f.interests, label],
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

  submit(): void {
    const s = this.form();
    const missing: string[] = [];
    if (!s.name.trim()) missing.push('your full name');
    if (!/.+@.+\..+/.test(s.email)) missing.push('a valid email');
    if (!s.cat) missing.push('what you are attending as');
    if (!s.mode) missing.push('how you will join');
    if (!s.days) missing.push('which day(s)');
    if (missing.length) {
      this.error.set('Almost there — we still need ' + missing.join(', ') + '.');
      return;
    }
    this.error.set('');
    this.submitted.set(true);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  editAgain(): void {
    this.submitted.set(false);
  }

  copyMessage(): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(this.message()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
