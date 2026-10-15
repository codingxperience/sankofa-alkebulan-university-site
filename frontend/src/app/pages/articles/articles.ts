import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/api/api-client';
import { JournalFacets, JournalPageQuery, PostsService, Post } from '../../core/posts.service';

interface ArticleCategory {
  name: string;
  count: number;
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './articles.html',
  styleUrl: './articles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Articles implements OnInit, OnDestroy {
  private readonly postsService = inject(PostsService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly pageSize = 6;
  readonly fallbackImage = '/assets/logo-crest.png';
  readonly posts = signal<Post[]>([]);
  readonly categories = signal<ArticleCategory[]>([]);
  readonly recentPosts = signal<Post[]>([]);
  readonly tags = signal<string[]>([]);
  readonly facets = signal<JournalFacets | null>(null);
  readonly searchQuery = signal('');
  readonly activeCategory = signal('all');
  readonly activeTag = signal('');
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly loadError = signal('');
  readonly loadMoreError = signal('');
  private readonly nextCursor = signal<string | null>(null);
  private readonly requestVersion = signal(0);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPageLoad: { version: number; promise: Promise<boolean> } | null = null;

  readonly filteredPosts = computed(() => this.posts());
  readonly visiblePosts = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.posts().slice(start, start + this.pageSize);
  });
  readonly pageCount = computed(() => {
    const total = this.totalMatches();
    if (total !== null) return Math.max(1, Math.ceil(total / this.pageSize));
    const loadedPages = Math.ceil(this.posts().length / this.pageSize);
    return Math.max(1, loadedPages + (this.nextCursor() ? 1 : 0));
  });
  readonly pageNumbers = computed(() => {
    const last = this.pageCount();
    const first = Math.max(1, Math.min(this.page() - 2, last - 4));
    return Array.from({ length: Math.min(5, last) }, (_, index) => first + index);
  });
  readonly resultStart = computed(() => (this.posts().length ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly resultEnd = computed(() => Math.min(this.page() * this.pageSize, this.posts().length));
  readonly resultTotalLabel = computed(() => {
    if (this.searchQuery().trim().length >= 2 && this.posts().length >= 50) return '50+';
    const total = this.totalMatches();
    if (total !== null) return String(total);
    return `${this.posts().length}${this.nextCursor() ? '+' : ''}`;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadPosts();
    this.postsService
      .getFacets()
      .then((facets) => {
        this.facets.set(facets);
        this.categories.set(
          facets.categories
            .filter((category) => category.value.trim())
            .slice(0, 8)
            .map((category) => ({ name: category.value, count: category.count })),
        );
        this.tags.set(facets.tags.slice(0, 12).map((tag) => tag.value));
      })
      .catch(() => undefined);
  }

  ngOnDestroy(): void {
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.requestVersion.update((version) => version + 1);
  }

  setSearch(value: string): void {
    this.searchQuery.set(value);
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      this.loadPosts();
    }, 240);
  }

  setCategory(name: string): void {
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.searchTimer = null;
    this.activeCategory.set(name);
    this.activeTag.set('');
    this.page.set(1);
    this.loadPosts();
  }

  setTag(tag: string): void {
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.searchTimer = null;
    this.activeTag.set(this.activeTag() === tag ? '' : tag);
    this.page.set(1);
    this.loadPosts();
  }

  clearFilters(): void {
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.searchTimer = null;
    this.searchQuery.set('');
    this.activeCategory.set('all');
    this.activeTag.set('');
    this.page.set(1);
    this.loadPosts();
  }

  async selectPage(requestedPage: number): Promise<void> {
    const targetPage = Math.max(1, Math.min(requestedPage, this.pageCount()));
    const targetStart = (targetPage - 1) * this.pageSize;
    const version = this.requestVersion();

    while (targetStart >= this.posts().length && this.nextCursor() && version === this.requestVersion()) {
      const loaded = await this.loadNextPage(version);
      if (!loaded) return;
    }

    if (version === this.requestVersion() && targetStart < this.posts().length) {
      this.page.set(targetPage);
      this.loadMoreError.set('');
    }
  }

  imageFor(post: Post): string {
    return post.featured_image || this.fallbackImage;
  }

  imageFailed(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.src !== new URL(this.fallbackImage, document.baseURI).href) {
      image.src = this.fallbackImage;
    }
  }

  retry(): void {
    this.loadPosts();
  }

  retryMore(): void {
    void this.selectPage(this.page() + 1);
  }

  private loadPosts(): void {
    const version = this.requestVersion() + 1;
    this.requestVersion.set(version);
    this.loading.set(true);
    this.loadingMore.set(false);
    this.loadError.set('');
    this.loadMoreError.set('');
    this.posts.set([]);
    this.recentPosts.set([]);
    this.nextCursor.set(null);
    this.page.set(1);

    const query = this.query(this.searchQuery().trim().length >= 2 ? 50 : 12);
    this.postsService
      .getPage(query)
      .then((result) => {
        if (version !== this.requestVersion()) return;
        this.posts.set(result.items);
        this.recentPosts.set(result.items.slice(0, 5));
        this.nextCursor.set(result.nextCursor);
        this.loading.set(false);
      })
      .catch((error: unknown) => {
        if (version !== this.requestVersion()) return;
        this.loading.set(false);
        this.loadError.set(ApiError.from(error).message);
      });
  }

  private loadNextPage(version: number): Promise<boolean> {
    if (this.pendingPageLoad?.version === version) return this.pendingPageLoad.promise;
    const cursor = this.nextCursor();
    if (!cursor || version !== this.requestVersion()) return Promise.resolve(false);

    this.loadingMore.set(true);
    this.loadMoreError.set('');
    const request = this.postsService
      .getPage(this.query(12, cursor))
      .then((result) => {
        if (version !== this.requestVersion()) return false;
        this.posts.update((posts) => [...posts, ...result.items]);
        this.nextCursor.set(result.nextCursor);
        return result.items.length > 0;
      })
      .catch((error: unknown) => {
        if (version === this.requestVersion()) this.loadMoreError.set(ApiError.from(error).message);
        return false;
      })
      .finally(() => {
        if (version === this.requestVersion()) this.loadingMore.set(false);
        if (this.pendingPageLoad?.promise === request) this.pendingPageLoad = null;
      });
    this.pendingPageLoad = { version, promise: request };
    return request;
  }

  private query(limit: number, cursor?: string): JournalPageQuery {
    const search = this.searchQuery().trim().replace(/\s+/g, ' ');
    return {
      limit,
      cursor,
      q: search.length >= 2 ? search : undefined,
      category: this.activeCategory() === 'all' ? undefined : this.activeCategory(),
      tag: this.activeTag() || undefined,
    };
  }

  private totalMatches(): number | null {
    const search = this.searchQuery().trim();
    if (search.length >= 2) return this.posts().length;
    if (this.activeCategory() !== 'all' && this.activeTag()) return null;
    if (this.activeCategory() !== 'all') {
      return this.categories().find((category) => category.name === this.activeCategory())?.count ?? null;
    }
    if (this.activeTag()) {
      return this.facets()?.tags.find((tag) => tag.value === this.activeTag())?.count ?? null;
    }
    return this.facets()?.total ?? null;
  }
}
