import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiClient, ApiError, newRequestId } from '../core/api/api-client';
import { countryNames } from '../core/countries';
import { PROGRAMME_CARDS_BY_LEVEL, type ProgrammeLevel } from '../university/programmes-data';

type Pathway = 'UNDERGRADUATE' | 'POSTGRADUATE' | 'DOCTORAL';
type StepKey = 'pathway' | 'personal' | 'academic' | 'statement' | 'funding' | 'declaration';

interface Options {
  pathways: Array<{ value: Pathway; label: string }>;
  intakes: string[];
  studyModes: string[];
  genders: string[];
  fundingSources: string[];
  statementWords: { min: number; max: number };
  emailDelivery: boolean;
}

interface Qualification {
  institution: string;
  qualification: string;
  country: string;
  startYear: string;
  endYear: string;
  result: string;
}

interface Referee {
  name: string;
  email: string;
  relationship: string;
  institution: string;
}

interface Drafts {
  pathway: { pathway: Pathway | ''; intake: string; studyMode: string };
  personal: {
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    gender: string;
    genderSelfDescribed: string;
    citizenship: string;
    residence: string;
    email: string;
    phone: string;
    address: string;
  };
  academic: { firstChoice: string; secondChoice: string; qualifications: Qualification[] };
  statement: { statement: string; referees: Referee[] };
  funding: { source: string; scholarshipInterest: boolean | null; notes: string };
  declaration: { accurate: boolean; signature: string };
}

interface ApplicationView {
  reference: string;
  status: string;
  pathway: Pathway;
  intake: string;
  answers: Partial<Record<StepKey, Record<string, unknown>>>;
  completedSteps: StepKey[];
  issues: Partial<Record<StepKey, Record<string, string>>>;
  version: number;
  updatedAt: string;
  submittedAt: string | null;
  linkEmailed?: boolean;
}

const STEPS: ReadonlyArray<{ key: StepKey; label: string; sub: string; title: string; lead: string }> = [
  { key: 'pathway', label: 'Pathway', sub: 'Level, intake, mode', title: 'Your pathway', lead: 'Choose the level you are applying for, when you would like to begin, and how you would like to study.' },
  { key: 'personal', label: 'Personal details', sub: 'About you & contact', title: 'Personal details', lead: 'Tell us about yourself. We use this to open your applicant record and to match you with an admissions officer.' },
  { key: 'academic', label: 'Academic history', sub: 'Programme & qualifications', title: 'Academic history', lead: 'Choose your programme and list the qualifications you have completed or are completing. Officers will ask for certificates and transcripts if they need them.' },
  { key: 'statement', label: 'Statement & referees', sub: 'Your voice — two referees', title: 'Personal statement & referees', lead: 'In your own words: why this programme, why now, and what you hope to carry forward. Then name two people who know your work.' },
  { key: 'funding', label: 'Funding', sub: 'How you will study', title: 'Funding', lead: 'Tell us how you plan to fund your studies, and whether you would like to be considered for a scholarship.' },
  { key: 'declaration', label: 'Review & submit', sub: 'Final check and signature', title: 'Review & submit', lead: 'Check your answers, confirm the declaration and sign with your full name.' },
];

const LEVELS: Record<Pathway, ProgrammeLevel[]> = {
  UNDERGRADUATE: ['bachelors', 'diploma', 'certificate'],
  POSTGRADUATE: ['masters', 'postgraduate-diploma'],
  DOCTORAL: ['phd'],
};

/** Human names for every field the API can flag, used in the "still needed" list. */
const FIELD_LABELS: Record<string, string> = {
  'pathway.pathway': 'Pathway', 'pathway.intake': 'Intake', 'pathway.studyMode': 'Mode of study',
  'personal.givenName': 'Given name', 'personal.familyName': 'Family name', 'personal.dateOfBirth': 'Date of birth',
  'personal.citizenship': 'Country of citizenship', 'personal.residence': 'Country of residence', 'personal.email': 'Email',
  'personal.phone': 'Phone',
  'academic.firstChoice': 'First-choice programme', 'academic.qualifications': 'Qualifications',
  'statement.statement': 'Personal statement', 'statement.referees': 'Referees',
  'funding.source': 'Funding source', 'funding.scholarshipInterest': 'Scholarship preference',
  'declaration.accurate': 'Declaration', 'declaration.signature': 'Signature',
};

const emptyQualification = (): Qualification => ({ institution: '', qualification: '', country: '', startYear: '', endYear: '', result: '' });
const emptyReferee = (): Referee => ({ name: '', email: '', relationship: '', institution: '' });

function emptyDrafts(): Drafts {
  return {
    pathway: { pathway: '', intake: '', studyMode: '' },
    personal: { givenName: '', familyName: '', dateOfBirth: '', gender: '', genderSelfDescribed: '', citizenship: '', residence: '', email: '', phone: '', address: '' },
    academic: { firstChoice: '', secondChoice: '', qualifications: [emptyQualification()] },
    statement: { statement: '', referees: [emptyReferee(), emptyReferee()] },
    funding: { source: '', scholarshipInterest: null, notes: '' },
    declaration: { accurate: false, signature: '' },
  };
}

/** Fills the local form from saved answers, keeping blanks where nothing was saved. */
function draftsFrom(answers: ApplicationView['answers']): Drafts {
  const d = emptyDrafts();
  const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));
  const a = answers ?? {};
  Object.assign(d.pathway, { pathway: str(a.pathway?.['pathway']), intake: str(a.pathway?.['intake']), studyMode: str(a.pathway?.['studyMode']) });
  for (const key of Object.keys(d.personal) as Array<keyof Drafts['personal']>) {
    d.personal[key] = str(a.personal?.[key]);
  }
  d.academic.firstChoice = str(a.academic?.['firstChoice']);
  d.academic.secondChoice = str(a.academic?.['secondChoice']);
  const quals = (a.academic?.['qualifications'] as Array<Record<string, unknown>> | undefined) ?? [];
  d.academic.qualifications = quals.length
    ? quals.map((q) => ({ institution: str(q['institution']), qualification: str(q['qualification']), country: str(q['country']), startYear: str(q['startYear']), endYear: str(q['endYear']), result: str(q['result']) }))
    : [emptyQualification()];
  d.statement.statement = str(a.statement?.['statement']);
  const refs = (a.statement?.['referees'] as Array<Record<string, unknown>> | undefined) ?? [];
  d.statement.referees = [0, 1].map((i) => ({ name: str(refs[i]?.['name']), email: str(refs[i]?.['email']), relationship: str(refs[i]?.['relationship']), institution: str(refs[i]?.['institution']) }));
  d.funding.source = str(a.funding?.['source']);
  d.funding.scholarshipInterest = typeof a.funding?.['scholarshipInterest'] === 'boolean' ? (a.funding['scholarshipInterest'] as boolean) : null;
  d.funding.notes = str(a.funding?.['notes']);
  d.declaration.accurate = a.declaration?.['accurate'] === true;
  d.declaration.signature = str(a.declaration?.['signature']);
  return d;
}

const AUTOSAVE_DELAY_MS = 1200;

@Component({
  selector: 'app-admissions-apply-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './admissions-apply-page.component.html',
  styleUrl: './admissions-apply-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionsApplyPageComponent implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly steps = STEPS;
  readonly countries = countryNames();

  readonly phase = signal<'loading' | 'welcome' | 'form' | 'submitted' | 'error'>('loading');
  readonly options = signal<Options | null>(null);
  readonly app = signal<ApplicationView | null>(null);
  readonly drafts = signal<Drafts>(emptyDrafts());
  readonly stepIndex = signal(0);
  readonly showIssues = signal<Partial<Record<StepKey, boolean>>>({});
  readonly saveState = signal<'idle' | 'pending' | 'saving' | 'saved' | 'offline'>('idle');
  readonly savedAt = signal<Date | null>(null);
  readonly now = signal(Date.now());
  readonly notice = signal('');
  readonly error = signal('');
  readonly submitIssues = signal<Array<{ step: StepKey; label: string; message: string }>>([]);
  readonly submitting = signal(false);

  // Starting and resuming.
  readonly startPathway = signal<Pathway | ''>('');
  readonly startIntake = signal('');
  readonly starting = signal(false);
  readonly resumeEmail = signal('');
  readonly resumeState = signal<'idle' | 'sending' | 'sent'>('idle');
  readonly privateLink = signal('');
  readonly linkCopied = signal(false);

  readonly step = computed(() => STEPS[this.stepIndex()]);
  readonly completed = computed(() => new Set(this.app()?.completedSteps ?? []));
  readonly progress = computed(() => Math.round((this.completed().size / STEPS.length) * 100));
  readonly stepIssues = computed(() => (this.showIssues()[this.step().key] ? this.app()?.issues[this.step().key] ?? {} : {}));
  readonly pathwayLabel = computed(() => this.options()?.pathways.find((p) => p.value === this.drafts().pathway.pathway)?.label ?? '');

  /** Programme suggestions for the chosen pathway, from the university's own catalogue. */
  readonly programmes = computed(() => {
    const pathway = this.drafts().pathway.pathway || this.app()?.pathway;
    if (!pathway) return [];
    const titles = LEVELS[pathway].flatMap((level) => (PROGRAMME_CARDS_BY_LEVEL[level] ?? []).map((card) => card.title));
    return [...new Set(titles)].sort((a, b) => a.localeCompare(b));
  });

  readonly statementWords = computed(() => {
    const text = this.drafts().statement.statement.trim();
    return text ? text.split(/\s+/).length : 0;
  });

  readonly savedLabel = computed(() => {
    const state = this.saveState();
    if (state === 'saving' || state === 'pending') return 'Saving…';
    if (state === 'offline') return 'Not saved yet — will retry';
    const at = this.savedAt();
    if (!at) return 'Saved as you type';
    const seconds = Math.max(0, Math.round((this.now() - at.getTime()) / 1000));
    if (seconds < 10) return 'Saved just now';
    if (seconds < 60) return `Saved ${seconds} sec ago`;
    const minutes = Math.round(seconds / 60);
    return minutes < 60 ? `Saved ${minutes} min ago` : `Saved at ${at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = new Set<StepKey>();
  private saving: Promise<void> | null = null;
  private startRequestId = newRequestId();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const tick = setInterval(() => this.now.set(Date.now()), 15_000);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (this.dirty.size > 0 || this.saveState() === 'saving') {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    this.destroyRef.onDestroy(() => {
      clearInterval(tick);
      window.removeEventListener('beforeunload', beforeUnload);
      void this.flush();
    });
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.options.set(await this.api.get<Options>('/admissions/options'));
      const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('resume');
      if (token) {
        // Exchange the private link for this device's cookie, then take it out of the address bar.
        history.replaceState(null, '', window.location.pathname);
        try {
          this.open(await this.api.post<ApplicationView>('/admissions/applications/resume', { token }));
          return;
        } catch (error) {
          this.notice.set(ApiError.from(error).message);
        }
      }
      try {
        // Nothing (204) means this device has not started an application yet.
        const current = await this.api.get<ApplicationView | null>('/admissions/applications/current');
        if (current) {
          this.open(current);
        } else {
          this.welcome();
        }
      } catch (error) {
        const apiError = ApiError.from(error);
        if (apiError.code === 'no_application') {
          this.welcome();
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      this.error.set(ApiError.from(error).message);
      this.phase.set('error');
    }
  }

  /** "2 qualifications", counting only rows the applicant has actually started to fill in. */
  protected qualificationSummary(): string {
    const filled = this.drafts().academic.qualifications.filter((q) => q.institution.trim() || q.qualification.trim()).length;
    return filled === 0 ? 'no qualifications yet' : `${filled} ${filled === 1 ? 'qualification' : 'qualifications'}`;
  }

  /** No application on this device: offer to start one. */
  private welcome(): void {
    this.startIntake.set(this.options()?.intakes[0] ?? '');
    this.phase.set('welcome');
  }

  private open(view: ApplicationView): void {
    this.app.set(view);
    this.drafts.set(draftsFrom(view.answers));
    this.savedAt.set(new Date(view.updatedAt));
    if (view.status !== 'DRAFT') {
      this.phase.set('submitted');
      return;
    }
    // Pick up at the first step that still needs something.
    const firstOpen = STEPS.findIndex((s) => !view.completedSteps.includes(s.key));
    this.stepIndex.set(firstOpen === -1 ? STEPS.length - 1 : firstOpen);
    this.phase.set('form');
  }

  // ─── Starting ────────────────────────────────────────────────────────

  async start(): Promise<void> {
    if (!this.startPathway() || this.starting()) {
      return;
    }
    this.starting.set(true);
    this.error.set('');
    try {
      const view = await this.api.post<ApplicationView>('/admissions/applications', {
        pathway: this.startPathway(),
        intake: this.startIntake(),
        clientRequestId: this.startRequestId,
      });
      this.open(view);
    } catch (error) {
      this.error.set(ApiError.from(error).message);
    } finally {
      this.starting.set(false);
    }
  }

  async emailMyLink(event: Event): Promise<void> {
    event.preventDefault();
    if (this.resumeState() === 'sending') return;
    this.resumeState.set('sending');
    this.error.set('');
    try {
      await this.api.post('/admissions/resume-links', { email: this.resumeEmail() });
      this.resumeState.set('sent');
    } catch (error) {
      this.resumeState.set('idle');
      this.error.set(ApiError.from(error).message);
    }
  }

  // ─── Editing and autosave ────────────────────────────────────────────

  /** Called by every input. Changes are batched and saved shortly after typing pauses. */
  touch(step: StepKey): void {
    this.drafts.update((d) => ({ ...d }));
    this.dirty.add(step);
    this.saveState.set('pending');
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), AUTOSAVE_DELAY_MS);
  }

  /** Saves every changed step, one at a time, in order. */
  async flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.saving) {
      await this.saving;
    }
    if (this.dirty.size === 0) {
      return;
    }
    this.saving = this.saveDirty().finally(() => (this.saving = null));
    await this.saving;
  }

  private async saveDirty(): Promise<void> {
    this.saveState.set('saving');
    for (const step of [...this.dirty]) {
      const current = this.app();
      if (!current) return;
      this.dirty.delete(step);
      try {
        const view = await this.api.put<ApplicationView>('/admissions/applications/current', {
          version: current.version,
          step,
          data: this.payload(step),
        });
        // Keep what the person is typing; take the server's verdict on completeness.
        this.app.set({ ...view, answers: { ...view.answers } });
        this.savedAt.set(new Date(view.updatedAt));
        if (view.linkEmailed) {
          this.notice.set('We have emailed you a private link, so you can continue on any device.');
        }
      } catch (error) {
        const apiError = ApiError.from(error);
        if (apiError.code === 'stale_version' && apiError.details) {
          const latest = apiError.details as ApplicationView;
          this.app.set(latest);
          this.drafts.set(draftsFrom(latest.answers));
          this.notice.set('Your application was changed in another tab or device — we have loaded the latest version.');
          this.dirty.clear();
        } else if (apiError.code === 'already_submitted') {
          await this.load();
          return;
        } else {
          this.dirty.add(step);
          this.saveState.set('offline');
          this.saveTimer = setTimeout(() => void this.flush(), 8000);
          return;
        }
      }
    }
    this.saveState.set('saved');
  }

  /** The step's answers in the shape the API expects. */
  private payload(step: StepKey): Record<string, unknown> {
    const d = this.drafts();
    switch (step) {
      case 'pathway':
        return { ...d.pathway, pathway: d.pathway.pathway || undefined };
      case 'personal':
        return { ...d.personal };
      case 'academic':
        return {
          ...d.academic,
          qualifications: d.academic.qualifications
            .filter((q) => Object.values(q).some((v) => v.trim()))
            .map((q) => ({ ...q, startYear: q.startYear || undefined, endYear: q.endYear || undefined })),
        };
      case 'statement':
        return { ...d.statement };
      case 'funding':
        return { ...d.funding, scholarshipInterest: d.funding.scholarshipInterest ?? undefined };
      case 'declaration':
        return { ...d.declaration };
    }
  }

  // ─── Moving between steps ────────────────────────────────────────────

  async goTo(index: number): Promise<void> {
    this.showIssues.update((s) => ({ ...s, [this.step().key]: true }));
    await this.flush();
    this.stepIndex.set(Math.min(Math.max(index, 0), STEPS.length - 1));
    this.submitIssues.set([]);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  next(): Promise<void> {
    return this.goTo(this.stepIndex() + 1);
  }

  back(): Promise<void> {
    return this.goTo(this.stepIndex() - 1);
  }

  stepState(key: StepKey): 'done' | 'active' | 'issue' | '' {
    if (key === this.step().key) return 'active';
    if (this.completed().has(key)) return 'done';
    return this.showIssues()[key] ? 'issue' : '';
  }

  issue(field: string): string | undefined {
    return this.stepIssues()[field];
  }

  // ─── Repeating groups ────────────────────────────────────────────────

  addQualification(): void {
    if (this.drafts().academic.qualifications.length >= 6) return;
    this.drafts().academic.qualifications.push(emptyQualification());
    this.touch('academic');
  }

  removeQualification(index: number): void {
    const list = this.drafts().academic.qualifications;
    list.splice(index, 1);
    if (list.length === 0) list.push(emptyQualification());
    this.touch('academic');
  }

  setScholarship(value: boolean): void {
    this.drafts().funding.scholarshipInterest = value;
    this.touch('funding');
  }

  setPathway(value: Pathway): void {
    this.drafts().pathway.pathway = value;
    this.touch('pathway');
  }

  // ─── Saving for later ────────────────────────────────────────────────

  async createPrivateLink(): Promise<void> {
    await this.flush();
    try {
      const { url } = await this.api.post<{ url: string }>('/admissions/applications/current/link');
      this.privateLink.set(url);
      this.linkCopied.set(false);
    } catch (error) {
      this.notice.set(ApiError.from(error).message);
    }
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.privateLink());
      this.linkCopied.set(true);
    } catch {
      this.linkCopied.set(false);
    }
  }

  // ─── Submitting ──────────────────────────────────────────────────────

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.submitIssues.set([]);
    try {
      await this.flush();
      const view = await this.api.post<ApplicationView>('/admissions/applications/current/submit');
      this.app.set(view);
      this.phase.set('submitted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const apiError = ApiError.from(error);
      if (apiError.code === 'application_incomplete') {
        this.submitIssues.set(
          Object.entries(apiError.fields).map(([path, message]) => {
            const step = path.split('.')[0] as StepKey;
            const field = path.split('.').slice(0, 2).join('.');
            return { step, label: FIELD_LABELS[field] ?? STEPS.find((s) => s.key === step)?.label ?? path, message };
          }),
        );
        this.showIssues.set(Object.fromEntries(STEPS.map((s) => [s.key, true])));
      } else {
        this.notice.set(apiError.message);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  stepIndexOf(key: StepKey): number {
    return STEPS.findIndex((s) => s.key === key);
  }
}
