import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Confirmations, Toasts } from '../../core/feedback';
import { WhenPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { ApplicationDetail, ApplicationStatus } from '../../core/types';
import { APPLICATION_STATUS, PATHWAY_LABEL, REVIEW_STATUSES } from '../../core/vocabulary';
import { Pill, Skeleton, Timeline } from '../../ui/ui';

const DECISIONS: readonly ApplicationStatus[] = ['CONDITIONAL_OFFER', 'OFFER', 'WAITLISTED', 'DECLINED'];

function ageOn(dateOfBirth: string | undefined, at: Date): number | null {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return null;
  }
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  let age = at.getFullYear() - year;
  if (at.getMonth() + 1 < month || (at.getMonth() + 1 === month && at.getDate() < day)) {
    age -= 1;
  }
  return age;
}

@Component({
  selector: 'sc-application',
  imports: [ReactiveFormsModule, RouterLink, Pill, Skeleton, Timeline, WhenPipe],
  templateUrl: './application.html',
  styleUrl: './application.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly confirmations = inject(Confirmations);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly state = inject(ConsoleState);
  protected readonly session = inject(StaffSession);

  protected readonly statusTerms = APPLICATION_STATUS;
  protected readonly pathwayLabel = PATHWAY_LABEL;
  protected readonly reviewStatuses = REVIEW_STATUSES;

  protected readonly application = signal<ApplicationDetail | null>(null);
  protected readonly failed = signal('');
  protected readonly saving = signal(false);
  protected readonly noting = signal(false);
  protected readonly nextStatus = signal<ApplicationStatus | ''>('');

  protected readonly canManage = computed(() => this.session.can('applications.manage'));
  protected readonly answers = computed(() => this.application()?.answers ?? {});
  protected readonly name = computed(() => {
    const a = this.application();
    return a ? [a.givenName, a.familyName].filter(Boolean).join(' ') || 'Name not given yet' : '';
  });
  protected readonly age = computed(() => {
    const a = this.application();
    return a ? ageOn(a.answers.personal?.dateOfBirth, new Date(a.submittedAt ?? a.updatedAt)) : null;
  });
  protected readonly statementParagraphs = computed(() =>
    (this.answers().statement?.statement ?? '')
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  );
  protected readonly statementWords = computed(() => {
    const text = this.answers().statement?.statement?.trim() ?? '';
    return text ? text.split(/\s+/).length : 0;
  });
  protected readonly mine = computed(() => this.application()?.assignee?.id === this.session.me()?.id);

  protected readonly noteForm = this.fb.group({ body: ['', [Validators.required, Validators.minLength(1)]] });

  constructor() {
    const subscription = inject(ActivatedRoute).paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        void this.load(id);
      }
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
    void this.state.ensureDirectory().catch(() => undefined);
  }

  protected async applyStatus(): Promise<void> {
    const application = this.application();
    const status = this.nextStatus();
    if (!application || !status || status === application.status) {
      return;
    }
    if (DECISIONS.includes(status)) {
      const yes = await this.confirmations.ask({
        title: `Record “${this.statusTerms[status].label}”?`,
        body: `This records the university’s decision on ${this.name()}’s application. The applicant is not emailed automatically — send the formal letter from the admissions mailbox.`,
        confirm: 'Record decision',
        tone: status === 'DECLINED' ? 'danger' : 'default',
      });
      if (!yes) {
        return;
      }
    }
    await this.update({ status }, `Moved to ${this.statusTerms[status].label.toLowerCase()}.`);
    this.nextStatus.set('');
  }

  protected async setReviewer(value: string): Promise<void> {
    await this.update({ assigneeId: value || null }, value ? 'Reviewer assigned.' : 'Reviewer removed.');
  }

  protected async takeIt(): Promise<void> {
    const me = this.session.me();
    if (me) {
      await this.update({ assigneeId: me.id }, 'You are now the reviewer.');
    }
  }

  protected async addNote(): Promise<void> {
    const application = this.application();
    const body = this.noteForm.getRawValue().body.trim();
    if (!application || !body) {
      this.toasts.error('Write the note first.');
      return;
    }
    this.noting.set(true);
    try {
      this.application.set(await this.api.post<ApplicationDetail>(`/applications/${application.id}/notes`, { body }));
      this.noteForm.reset();
      this.toasts.success('Note added.');
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.noting.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    this.application.set(null);
    this.failed.set('');
    try {
      this.application.set(await this.api.get<ApplicationDetail>(`/applications/${id}`));
    } catch (error) {
      this.failed.set(error instanceof Error ? error.message : 'This application could not be opened.');
    }
  }

  private async update(change: { status?: ApplicationStatus; assigneeId?: string | null }, done: string): Promise<void> {
    const application = this.application();
    if (!application) {
      return;
    }
    this.saving.set(true);
    try {
      this.application.set(await this.api.patch<ApplicationDetail>(`/applications/${application.id}`, change));
      this.toasts.success(done);
      this.state.refreshSoon();
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.saving.set(false);
    }
  }
}
