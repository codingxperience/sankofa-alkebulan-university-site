import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { ApiClient } from './api/api-client';

/** An article as the journal pages display it. */
export interface Post {
  title: string;
  published_at: string;
  excerpt: string;
  featured_image: string;
  categories: string[];
  tags: string[];
  author: string;
  slug: string;
  content: string;
  readingMinutes?: number;
}

export interface JournalFacets {
  total: number;
  categories: Array<{ value: string; count: number }>;
  tags: Array<{ value: string; count: number }>;
}

interface ArticleSummary {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorName: string;
  categories: string[];
  tags: string[];
  readingMinutes: number;
  publishedAt: string;
}

interface ArticlePage {
  items: ArticleSummary[];
  nextCursor: string | null;
}

function toPost(article: ArticleSummary & { bodyHtml?: string }): Post {
  return {
    title: article.title,
    published_at: article.publishedAt,
    excerpt: article.excerpt,
    featured_image: article.coverImageUrl ?? '',
    categories: article.categories,
    tags: article.tags,
    author: article.authorName,
    slug: article.slug,
    content: article.bodyHtml ?? '',
    readingMinutes: article.readingMinutes,
  };
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly api = inject(ApiClient);

  /** Every published article, newest first, gathered page by page. */
  getPosts(): Observable<Post[]> {
    return from(this.fetchAll());
  }

  getPost(slug: string): Observable<Post & { related: Post[] }> {
    return from(
      this.api
        .get<ArticleSummary & { bodyHtml: string; related: ArticleSummary[] }>(`/journal/articles/${encodeURIComponent(slug)}`)
        .then((article) => ({ ...toPost(article), related: article.related.map(toPost) })),
    );
  }

  /** The newest published articles, for pages that show a few. */
  async getLatest(limit: number): Promise<Post[]> {
    const page = await this.api.get<ArticlePage>('/journal/articles', { limit });
    return page.items.map(toPost);
  }

  getFacets(): Promise<JournalFacets> {
    return this.api.get<JournalFacets>('/journal/facets');
  }

  getNewsletterConsent(): Promise<{ consentText: string }> {
    return this.api.get<{ consentText: string }>('/audience/newsletter');
  }

  subscribe(email: string, website: string): Promise<{ ok: true }> {
    return this.api.post<{ ok: true }>('/audience/subscribe', { email, website });
  }

  private async fetchAll(): Promise<Post[]> {
    const posts: Post[] = [];
    let cursor: string | null = null;
    // A generous ceiling keeps one slow archive from turning into an endless loop.
    for (let page = 0; page < 20; page += 1) {
      const result: ArticlePage = await this.api.get<ArticlePage>('/journal/articles', { limit: 50, cursor: cursor ?? undefined });
      posts.push(...result.items.map(toPost));
      cursor = result.nextCursor;
      if (!cursor) {
        break;
      }
    }
    return posts;
  }
}
