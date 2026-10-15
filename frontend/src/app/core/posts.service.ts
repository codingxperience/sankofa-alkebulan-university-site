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

export interface JournalPageQuery {
  [key: string]: string | number | boolean | null | undefined;
  limit: number;
  cursor?: string;
  q?: string;
  category?: string;
  tag?: string;
}

export interface JournalPage {
  items: Post[];
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

  getPost(slug: string): Observable<Post> {
    return from(
      this.api
        .get<ArticleSummary & { bodyHtml: string }>(`/journal/articles/${encodeURIComponent(slug)}`)
        .then(toPost),
    );
  }

  /** The newest published articles, for pages that show a few. */
  async getLatest(limit: number): Promise<Post[]> {
    const page = await this.api.get<ArticlePage>('/journal/articles', { limit });
    return page.items.map(toPost);
  }

  /** A bounded slice of the public archive, optionally narrowed by its facets. */
  async getPage(query: JournalPageQuery): Promise<JournalPage> {
    const page = await this.api.get<ArticlePage>('/journal/articles', query);
    return { items: page.items.map(toPost), nextCursor: page.nextCursor };
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

}
