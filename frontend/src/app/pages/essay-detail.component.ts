import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostsService, Post } from '../core/posts.service';

@Component({
  selector: 'app-essay-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="essay-detail" *ngIf="post">
      <div class="container">
        <div class="section">
          <nav class="essay-detail__nav">
            <a routerLink="/articles" class="btn btn--secondary">
              ← Back to Articles
            </a>
          </nav>

          <article class="essay-article">
            <header class="essay-article__header">
              <h1 class="essay-article__title">{{ post.title }}</h1>
              <p class="essay-article__excerpt">{{ post.excerpt }}</p>
              <div class="essay-article__meta">
                <span class="essay-article__date">{{ post.published_at | date:'longDate' }}</span>
                <span class="essay-article__categories" *ngIf="post.categories && post.categories.length">
                  <span class="essay-article__category" *ngFor="let category of post.categories">
                    {{ category }}
                  </span>
                </span>
              </div>
            </header>

            <div class="essay-article__content" [innerHTML]="post.content"></div>
          </article>

          <aside class="essay-related" *ngIf="related.length">
            <h2 class="essay-related__title">Keep reading</h2>
            <ul>
              <li *ngFor="let item of related">
                <a [routerLink]="['/articles', item.slug]">{{ item.title }}</a>
                <time>{{ item.published_at | date : 'mediumDate' }}</time>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </div>

    <div class="essay-detail" *ngIf="!post && !loading">
      <div class="container">
        <div class="section">
          <div class="text-center">
            <h1>Essay Not Found</h1>
            <p>The essay you're looking for doesn't exist.</p>
            <a routerLink="/articles" class="btn btn--primary">Browse All Articles</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .essay-detail {
      background-color: var(--background-color);
      min-height: 50vh;
    }

    .essay-detail__nav {
      margin-bottom: var(--spacing-xl);
    }

    .essay-article {
      max-width: 800px;
      margin: 0 auto;
    }

    .essay-article__header {
      margin-bottom: var(--spacing-3xl);
      padding-bottom: var(--spacing-xl);
      border-bottom: 1px solid var(--border-color);
    }

    .essay-article__title {
      font-size: var(--font-size-4xl);
      line-height: 1.1;
      margin-bottom: var(--spacing-lg);
      color: var(--primary-color);
    }

    .essay-article__excerpt {
      font-size: var(--font-size-xl);
      color: var(--text-secondary);
      line-height: 1.4;
      margin-bottom: var(--spacing-lg);
      font-style: italic;
    }

    .essay-article__meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .essay-article__categories {
      display: flex;
      gap: var(--spacing-sm);
    }

    .essay-article__category {
      background-color: var(--accent-color);
      color: var(--primary-color);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 0.25rem;
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-xs);
    }

    .essay-article__content {
      font-size: var(--font-size-base);
      line-height: 1.8;
      color: var(--text-color);
    }

    .essay-article__content h2,
    .essay-article__content h3,
    .essay-article__content h4 {
      margin-top: var(--spacing-2xl);
      margin-bottom: var(--spacing-lg);
      color: var(--primary-color);
    }

    .essay-article__content p {
      margin-bottom: var(--spacing-lg);
    }

    .essay-article__content img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: var(--spacing-lg) 0;
      box-shadow: var(--shadow-sm);
    }

    .essay-article__content blockquote {
      border-left: 4px solid var(--accent-color);
      padding-left: var(--spacing-lg);
      margin: var(--spacing-xl) 0;
      font-style: italic;
      color: var(--text-secondary);
      background-color: var(--surface-color);
      padding: var(--spacing-lg);
      border-radius: 0 0.5rem 0.5rem 0;
    }

    .essay-article__content a {
      color: var(--link-color);
      text-decoration: underline;
    }

    .essay-article__content a:hover {
      color: var(--link-hover);
    }

    @media (max-width: 768px) {
      .essay-article__title {
        font-size: var(--font-size-3xl);
      }

      .essay-article__excerpt {
        font-size: var(--font-size-lg);
      }

      .essay-article__meta {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
      }
    }

    .essay-related {
      max-width: 800px;
      margin: var(--spacing-3xl, 48px) auto 0;
      padding-top: var(--spacing-xl, 24px);
      border-top: 1px solid var(--border-color);
    }

    .essay-related__title {
      font-size: var(--font-size-xl, 1.25rem);
      margin-bottom: var(--spacing-md, 16px);
      color: var(--primary-color);
    }

    .essay-related ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 12px;
    }

    .essay-related li {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: baseline;
    }

    .essay-related time {
      color: var(--text-secondary);
      font-size: var(--font-size-sm, 0.875rem);
      white-space: nowrap;
    }
  `]
})
export class EssayDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly postsService = inject(PostsService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  post: Post | null = null;
  related: Post[] = [];
  loading = true;

  ngOnInit() {
    // Re-runs when following a "keep reading" link from one essay to another.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        this.loading = false;
        return;
      }
      this.loading = true;
      this.postsService.getPost(slug).subscribe({
        next: ({ related, ...post }) => {
          this.post = post;
          this.related = related;
          this.loading = false;
          this.title.setTitle(`${post.title} | Sankofa Alkebulan University`);
          this.meta.updateTag({ name: 'description', content: post.excerpt });
        },
        error: () => {
          this.post = null;
          this.related = [];
          this.loading = false;
        },
      });
    });
  }
}