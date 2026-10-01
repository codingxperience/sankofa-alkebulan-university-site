import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../core/api/api-client';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { AgoPipe, plural } from '../../core/format';
import type { ApplicationDetail, InquiryDetail } from '../../core/types';
import { APPLICATION_STATUS, INQUIRY_SOURCE, INQUIRY_STATUS, PATHWAY_LABEL, type Tone } from '../../core/vocabulary';
import { Face, Pill, Skeleton } from '../../ui/ui';

export interface FocusTarget {
  readonly kind: 'application' | 'inquiry';
  readonly id: string;
}

interface Part {
  readonly text: string;
  readonly strong?: boolean;
}

interface Paper {
  readonly label: string;
  readonly meta: string;
  readonly heading: string;
  readonly text: string;
}

/** One stop on the summary's line: a time, if it has one, and a card. */
interface Stop {
  readonly at: string | null;
  readonly title: string;
  readonly papers?: readonly Paper[];
  readonly parts?: readonly Part[];
  readonly body?: string;
  readonly facts?: ReadonlyArray<{ label: string; value: string }>;
  readonly foot?: string;
  readonly empty?: string;
}

interface Summary {
  readonly target: FocusTarget;
  readonly link: string;
  readonly open: string;
  readonly name: string;
  readonly subtitle: string;
  readonly reference: string;
  readonly email: string | null;
  readonly status: { label: string; tone: Tone };
  readonly stops: readonly Stop[];
}

const CLOCK = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

function latest<T extends { createdAt: string }>(items: readonly T[]): T | undefined {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/**
 * The light panel beside the workspace: whichever applicant or message is
 * in focus, told as a short line of moments — what arrived and when, what it
 * asks for, and the last thing that happened to it.
 */
@Component({
  selector: 'sc-focus-summary',
  imports: [RouterLink, Face, Pill, Skeleton, AgoPipe],
  templateUrl: './focus-summary.html',
  styleUrl: './focus-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sc-on-sheet' },
})
export class FocusSummary {
  private readonly api = inject(ConsoleApi);
  private readonly state = inject(ConsoleState);

  readonly target = input<FocusTarget | null>(null);
  /** Bumped by the page when the record changed elsewhere, so the panel reads it again. */
  readonly revision = input(0);

  protected readonly summary = signal<Summary | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal('');
  protected readonly showing = computed(() => this.target() !== null);
  private ticket = 0;

  constructor() {
    effect(() => {
      const target = this.target();
      this.revision();
      untracked(() => void this.load(target));
    });
  }

  /** "14:02" for today, "28 Sep" for anything earlier. */
  protected stamp(at: string): string {
    const date = new Date(at);
    return date.toDateString() === new Date().toDateString() ? CLOCK.format(date) : DAY.format(date);
  }

  private async load(target: FocusTarget | null): Promise<void> {
    const ticket = ++this.ticket;
    this.failed.set('');
    if (!target) {
      this.summary.set(null);
      this.loading.set(false);
      return;
    }
    if (this.summary()?.target.id !== target.id) {
      this.summary.set(null);
      this.loading.set(true);
    }
    try {
      const summary =
        target.kind === 'application'
          ? this.fromApplication(await this.api.get<ApplicationDetail>(`/applications/${target.id}`))
          : this.fromInquiry(await this.api.get<InquiryDetail>(`/inquiries/${target.id}`));
      if (ticket === this.ticket) {
        this.summary.set(summary);
      }
    } catch (error) {
      if (ticket === this.ticket) {
        this.failed.set(ApiError.from(error).message);
      }
    } finally {
      if (ticket === this.ticket) {
        this.loading.set(false);
      }
    }
  }

  private fromApplication(application: ApplicationDetail): Summary {
    const answers = application.answers;
    const name = [application.givenName, application.familyName].filter(Boolean).join(' ') || application.email || 'An applicant';
    const statement = answers.statement?.statement?.trim() ?? '';
    const qualifications = answers.academic?.qualifications ?? [];
    const referees = answers.statement?.referees ?? [];

    const papers: Paper[] = [];
    if (statement) {
      papers.push({
        label: 'Statement',
        meta: plural(statement.split(/\s+/).filter(Boolean).length, 'word'),
        heading: 'Personal statement',
        text: statement.slice(0, 700),
      });
    }
    if (qualifications.length) {
      papers.push({
        label: 'Qualifications',
        meta: String(qualifications.length),
        heading: 'Qualifications',
        text: qualifications
          .map((q) => [q.qualification, q.institution, [q.startYear, q.endYear].filter(Boolean).join('–'), q.result].filter(Boolean).join(' · '))
          .join('\n\n'),
      });
    }
    if (referees.length) {
      papers.push({
        label: 'Referees',
        meta: String(referees.length),
        heading: 'Referees',
        text: referees.map((r) => [r.name, r.relationship, r.institution].filter(Boolean).join(' · ')).join('\n\n'),
      });
    }

    const pathway = PATHWAY_LABEL[application.pathway];
    const aim: Part[] = [];
    if (application.firstChoice) {
      aim.push({ text: 'Applying for ' }, { text: application.firstChoice, strong: true }, { text: ` as a ${pathway.toLowerCase()} student, for the ` });
    } else {
      aim.push({ text: `A ${pathway.toLowerCase()} application for the ` });
    }
    aim.push({ text: `${application.intake} intake`, strong: true }, { text: '.' });
    if (answers.academic?.secondChoice) {
      aim.push({ text: ' Second choice: ' }, { text: answers.academic.secondChoice, strong: true }, { text: '.' });
    }
    if (application.residence) {
      aim.push({ text: ' Applying from ' }, { text: application.residence, strong: true }, { text: '.' });
    }

    const last = latest(application.activity);
    return {
      target: { kind: 'application', id: application.id },
      link: `/admin/admissions/${application.id}`,
      open: 'Open the application',
      name,
      subtitle: [pathway, application.intake].join(' · '),
      reference: application.reference,
      email: application.email,
      status: APPLICATION_STATUS[application.status],
      stops: [
        {
          at: application.submittedAt ?? application.createdAt,
          title: 'Documents',
          papers,
          empty: 'Nothing written yet. The applicant is still filling in the form.',
        },
        { at: null, title: 'Aim', parts: aim },
        {
          at: last?.createdAt ?? application.updatedAt,
          title: 'Latest',
          body: last?.summary ?? `${application.completedSteps.length} of 6 steps complete.`,
          foot: application.assignee ? `With ${application.assignee.name}` : 'Not yet assigned to anyone',
        },
      ],
    };
  }

  private fromInquiry(inquiry: InquiryDetail): Summary {
    const note = latest(inquiry.notes);
    const facts = [
      { label: 'Came from', value: INQUIRY_SOURCE[inquiry.source] ?? inquiry.source },
      ...(inquiry.origin ? [{ label: 'Page', value: inquiry.origin }] : []),
      { label: 'With', value: inquiry.assignee?.name ?? 'No one yet' },
      ...(inquiry.history.length ? [{ label: 'Wrote before', value: plural(inquiry.history.length, 'time') }] : []),
    ];
    return {
      target: { kind: 'inquiry', id: inquiry.id },
      link: `/admin/inbox/${inquiry.id}`,
      open: 'Open the conversation',
      name: inquiry.name,
      subtitle: this.state.officeName(inquiry.office),
      reference: inquiry.reference,
      email: inquiry.email,
      status: INQUIRY_STATUS[inquiry.status],
      stops: [
        {
          at: inquiry.createdAt,
          title: 'Message',
          parts: [{ text: inquiry.subject || 'No subject', strong: true }],
          body: inquiry.message,
        },
        { at: null, title: 'Details', facts },
        note
          ? {
              at: note.createdAt,
              title: 'Latest',
              body: note.body,
              foot: `${note.author?.name ?? 'A former colleague'} ${note.kind === 'REPLY' ? 'replied by email' : 'added a note'}`,
            }
          : { at: null, title: 'Latest', body: 'No one has replied yet.' },
      ],
    };
  }
}
