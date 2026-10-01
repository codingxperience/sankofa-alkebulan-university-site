import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Toasts } from '../../core/feedback';
import { AgoPipe, WhenPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { InquiryDetail, InquiryStatus, Office } from '../../core/types';
import { INQUIRY_SOURCE, INQUIRY_STATUS, OFFICE_ORDER } from '../../core/vocabulary';
import { Pill, Skeleton, Timeline } from '../../ui/ui';
import { InboxSync } from './inbox-sync';

const STATUS_CHOICES: readonly InquiryStatus[] = ['NEW', 'OPEN', 'AWAITING_REPLY', 'RESOLVED', 'SPAM'];

@Component({
  selector: 'sc-inquiry',
  imports: [ReactiveFormsModule, RouterLink, Pill, Skeleton, Timeline, AgoPipe, WhenPipe],
  templateUrl: './inquiry.html',
  styleUrl: './inquiry.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InquiryPane {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly sync = inject(InboxSync);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly state = inject(ConsoleState);
  protected readonly session = inject(StaffSession);

  protected readonly statusChoices = STATUS_CHOICES;
  protected readonly statusTerms = INQUIRY_STATUS;
  protected readonly offices = OFFICE_ORDER;
  protected readonly sources = INQUIRY_SOURCE;

  protected readonly inquiry = signal<InquiryDetail | null>(null);
  protected readonly failed = signal('');
  protected readonly saving = signal(false);
  protected readonly sending = signal(false);
  protected readonly mode = signal<'reply' | 'note'>('reply');

  protected readonly canManage = computed(() => this.session.can('inquiries.manage'));
  protected readonly mine = computed(() => this.inquiry()?.assignee?.id === this.session.me()?.id);

  /** Extra answers some forms collect beside the message; the forms already label them for people. */
  protected readonly details = computed(() =>
    Object.entries(this.inquiry()?.details ?? {})
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([label, value]) => ({ label, value: String(value) })),
  );

  protected readonly mailto = computed(() => {
    const inquiry = this.inquiry();
    if (!inquiry) {
      return '';
    }
    const subject = `Re: ${inquiry.subject || 'Your message to Sankofa Alkebulan University'} [${inquiry.reference}]`;
    return `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}`;
  });

  protected readonly composer = this.fb.group({
    body: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    const route = inject(ActivatedRoute);
    const subscription = route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        void this.open(id);
      }
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  protected async setStatus(status: InquiryStatus): Promise<void> {
    await this.update({ status }, status === 'RESOLVED' ? 'Marked resolved.' : status === 'SPAM' ? 'Moved to spam.' : 'Status updated.');
  }

  protected async setOffice(office: Office): Promise<void> {
    await this.update({ office }, `Moved to ${this.state.officeName(office)}.`);
  }

  protected async setAssignee(value: string): Promise<void> {
    await this.update({ assigneeId: value || null }, value ? 'Assigned.' : 'Unassigned.');
  }

  protected async takeIt(): Promise<void> {
    const me = this.session.me();
    if (me) {
      await this.update({ assigneeId: me.id }, 'It is yours.');
    }
  }

  protected async send(): Promise<void> {
    const inquiry = this.inquiry();
    const body = this.composer.getRawValue().body.trim();
    if (!inquiry || body.length < 2) {
      this.toasts.error(this.mode() === 'reply' ? 'Write your reply first.' : 'Write the note first.');
      return;
    }
    this.sending.set(true);
    try {
      const path = this.mode() === 'reply' ? 'replies' : 'notes';
      const updated = await this.api.post<InquiryDetail>(`/inquiries/${inquiry.id}/${path}`, { body });
      this.show(updated);
      this.composer.reset();
      this.toasts.success(this.mode() === 'reply' ? `Reply sent to ${inquiry.name}.` : 'Note added.');
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.sending.set(false);
    }
  }

  private async open(id: string): Promise<void> {
    this.inquiry.set(null);
    this.failed.set('');
    this.composer.reset();
    this.mode.set(this.state.emailConfigured() ? 'reply' : 'note');
    try {
      let inquiry = await this.api.get<InquiryDetail>(`/inquiries/${id}`);
      // Opening a new message is reading it: it leaves the "new" pile.
      if (inquiry.status === 'NEW' && this.canManage()) {
        inquiry = await this.api.patch<InquiryDetail>(`/inquiries/${id}`, { status: 'OPEN' });
        this.sync.changed(inquiry);
      }
      this.inquiry.set(inquiry);
    } catch (error) {
      this.failed.set(error instanceof Error ? error.message : 'This message could not be opened.');
    }
  }

  private async update(change: { status?: InquiryStatus; office?: Office; assigneeId?: string | null }, done: string): Promise<void> {
    const inquiry = this.inquiry();
    if (!inquiry) {
      return;
    }
    this.saving.set(true);
    try {
      this.show(await this.api.patch<InquiryDetail>(`/inquiries/${inquiry.id}`, change));
      this.toasts.success(done);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.saving.set(false);
    }
  }

  private show(inquiry: InquiryDetail): void {
    this.inquiry.set(inquiry);
    this.sync.changed(inquiry);
  }
}
