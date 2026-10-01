import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConsoleApi } from '../../core/console-api';
import { Toasts } from '../../core/feedback';
import { AgoPipe, WhenPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { ArticleStatus, ArticleSummary, Page } from '../../core/types';
import { ARTICLE_STATUS } from '../../core/vocabulary';
import { Empty, Pill, Skeleton } from '../../ui/ui';

type View = '' | ArticleStatus | 'SCHEDULED';

const VIEWS: ReadonlyArray<{ value: View; label: string }> = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

@Component({
  selector: 'sc-articles',
  imports: [RouterLink, Pill, Empty, Skeleton, AgoPipe, WhenPipe],
  template: `
    <header class="sc-head">
      <div class="sc-head__text">
        <p class="sc-eyebrow">Journal</p>
        <h1 class="sc-title">Articles</h1>
        <p class="sc-lede">Essays and news on the website. Give an article a future publication time to schedule it; it appears on its own when the time comes.</p>
      </div>
      @if (session.can('journal.manage')) {
        <div class="sc-head__actions">
          <a class="sc-btn sc-btn--primary" routerLink="/admin/journal/new"><i class="pi pi-plus" aria-hidden="true"></i> New article</a>
        </div>
      }
    </header>

    <div class="sc-toolbar">
      <div class="sc-segments" role="group" aria-label="Status">
        @for (option of views; track option.value) {
          <button type="button" class="sc-segment" [attr.aria-pressed]="view() === option.value" (click)="choose(option.value)">{{ option.label }}</button>
        }
      </div>
      <span class="sc-toolbar__spacer"></span>
      <div class="sc-search">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input class="sc-input" type="search" placeholder="Title or web address" aria-label="Search articles"
          [value]="query()" (input)="search($any($event.target).value)" />
      </div>
    </div>

    <section class="sc-card">
      @if (loading()) {
        <sc-skeleton [lines]="8" />
      } @else if (articles().length === 0) {
        <sc-empty title="No articles here" icon="pi-book">
          <p>Write a new article, or choose another view.</p>
        </sc-empty>
      } @else {
        <div class="sc-table-wrap">
          <table class="sc-table">
            <thead>
              <tr>
                <th scope="col">Article</th>
                <th scope="col">Published</th>
                <th scope="col">Reading</th>
                <th scope="col">Last edited</th>
                <th scope="col" class="is-tight">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (article of articles(); track article.id) {
                <tr class="is-link" (click)="open(article)">
                  <td>
                    <a class="sc-cell-main" [routerLink]="['/admin/journal', article.id]" (click)="$event.stopPropagation()">{{ article.title }}</a>
                    <span class="sc-cell-sub sc-mono">/articles/{{ article.slug }}</span>
                  </td>
                  <td>{{ article.publishedAt ? (article.publishedAt | when: 'date') : '—' }}</td>
                  <td class="sc-num">{{ article.readingMinutes }} min</td>
                  <td>
                    <span [title]="article.updatedAt | when: 'full'">{{ article.updatedAt | ago }}</span>
                    @if (article.updatedBy) {
                      <span class="sc-cell-sub">{{ article.updatedBy }}</span>
                    }
                  </td>
                  <td class="is-tight">
                    @if (article.scheduled) {
                      <sc-pill [label]="statusTerms.SCHEDULED.label" [tone]="statusTerms.SCHEDULED.tone" />
                    } @else {
                      <sc-pill [label]="statusTerms[article.status].label" [tone]="statusTerms[article.status].tone" />
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (cursor()) {
          <div class="sc-more">
            <button type="button" class="sc-btn sc-btn--small" [class.is-busy]="loadingMore()" (click)="more()">Show more</button>
          </div>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  protected readonly session = inject(StaffSession);

  protected readonly views = VIEWS;
  protected readonly statusTerms = ARTICLE_STATUS;
  protected readonly view = signal<View>('');
  protected readonly query = signal('');
  protected readonly articles = signal<readonly ArticleSummary[]>([]);
  protected readonly cursor = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.load();
  }

  protected choose(view: View): void {
    this.view.set(view);
    void this.load();
  }

  protected search(value: string): void {
    this.query.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => void this.load(), 300);
  }

  protected open(article: ArticleSummary): void {
    void this.router.navigate(['/admin/journal', article.id]);
  }

  protected async more(): Promise<void> {
    const cursor = this.cursor();
    if (!cursor) {
      return;
    }
    this.loadingMore.set(true);
    try {
      const page = await this.fetch(cursor);
      this.articles.update((list) => [...list, ...page.items]);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loadingMore.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const page = await this.fetch(null);
      this.articles.set(page.items);
      this.cursor.set(page.nextCursor);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  private fetch(cursor: string | null): Promise<Page<ArticleSummary>> {
    return this.api.get<Page<ArticleSummary>>('/journal/articles', {
      status: this.view() || undefined,
      q: this.query().trim() || undefined,
      cursor: cursor ?? undefined,
      limit: 40,
    });
  }
}
