import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Toasts } from '../../core/feedback';
import { AgoPipe, WhenPipe } from '../../core/format';
import type { ApplicationStats, ApplicationStatus, ApplicationSummary, Page, Pathway } from '../../core/types';
import { APPLICATION_STATUS, PATHWAY_LABEL } from '../../core/vocabulary';
import { Empty, Pill, Skeleton } from '../../ui/ui';

type View = 'PIPELINE' | ApplicationStatus;

/** The road an application travels, in order. Decisions sit side by side at the end. */
const STAGES: ReadonlyArray<{ value: ApplicationStatus; label: string; note: string }> = [
  { value: 'SUBMITTED', label: 'Submitted', note: 'Waiting to be read' },
  { value: 'UNDER_REVIEW', label: 'Under review', note: 'Being assessed' },
  { value: 'CONDITIONAL_OFFER', label: 'Conditional offer', note: 'Offer with conditions' },
  { value: 'OFFER', label: 'Offer', note: 'Unconditional offer' },
  { value: 'WAITLISTED', label: 'Waitlisted', note: 'Held for a place' },
  { value: 'DECLINED', label: 'Declined', note: 'Not offered a place' },
];

@Component({
  selector: 'sc-applications',
  imports: [RouterLink, Pill, Empty, Skeleton, AgoPipe, WhenPipe],
  templateUrl: './applications.html',
  styleUrl: './applications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  protected readonly state = inject(ConsoleState);

  protected readonly stages = STAGES;
  protected readonly statusTerms = APPLICATION_STATUS;
  protected readonly pathwayLabel = PATHWAY_LABEL;
  protected readonly pathways: readonly Pathway[] = ['UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORAL'];

  protected readonly view = signal<View>('PIPELINE');
  protected readonly pathway = signal<Pathway | ''>('');
  protected readonly intake = signal('');
  protected readonly assignee = signal('');
  protected readonly query = signal('');

  protected readonly stats = signal<ApplicationStats | null>(null);
  protected readonly items = signal<readonly ApplicationSummary[]>([]);
  protected readonly cursor = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);

  protected readonly pipelineTotal = computed(() => {
    const status = this.stats()?.status ?? {};
    return Object.entries(status)
      .filter(([key]) => key !== 'DRAFT')
      .reduce((sum, [, count]) => sum + (count ?? 0), 0);
  });

  protected readonly exportUrl = computed(() => this.api.url('/applications/export', this.filters()));

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.state.ensureDirectory().catch(() => undefined);
    void this.loadStats();
    void this.load();
  }

  protected count(status: ApplicationStatus): number {
    return this.stats()?.status[status] ?? 0;
  }

  protected choose(view: View): void {
    this.view.set(this.view() === view ? 'PIPELINE' : view);
    void this.load();
  }

  protected setPathway(value: string): void {
    this.pathway.set(value as Pathway | '');
    void this.load();
  }

  protected setIntake(value: string): void {
    this.intake.set(value);
    void this.load();
  }

  protected setAssignee(value: string): void {
    this.assignee.set(value);
    void this.load();
  }

  protected search(value: string): void {
    this.query.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => void this.load(), 300);
  }

  protected open(item: ApplicationSummary): void {
    void this.router.navigate(['/admin/admissions', item.id]);
  }

  protected async more(): Promise<void> {
    const cursor = this.cursor();
    if (!cursor) {
      return;
    }
    this.loadingMore.set(true);
    try {
      const page = await this.api.get<Page<ApplicationSummary>>('/applications', { ...this.filters(), cursor, limit: 40 });
      this.items.update((list) => [...list, ...page.items]);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loadingMore.set(false);
    }
  }

  private filters() {
    return {
      status: this.view(),
      pathway: this.pathway() || undefined,
      intake: this.intake() || undefined,
      assignee: this.assignee() || undefined,
      q: this.query().trim() || undefined,
    };
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const page = await this.api.get<Page<ApplicationSummary>>('/applications', { ...this.filters(), limit: 40 });
      this.items.set(page.items);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadStats(): Promise<void> {
    try {
      this.stats.set(await this.api.get<ApplicationStats>('/applications/stats'));
    } catch {
      // The pipeline counts are a guide; the list below still loads without them.
    }
  }
}
