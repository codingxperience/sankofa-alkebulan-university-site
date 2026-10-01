import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ApiError } from '../../core/api/api-client';
import { PostsService, Post } from '../../core/posts.service';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './articles.html',
  styleUrl: './articles.scss',
  animations: [
    trigger('slideInOut', [
      state('in', style({ height: '*', opacity: 1 })),
      transition('void => *', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-in')
      ]),
      transition('* => void', [
        animate('300ms ease-out', style({ height: 0, opacity: 0 }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class Articles implements OnInit {
  posts: Post[] = [];
  featuredPost: Post | null = null;
  filteredPosts: Post[] = [];
  viewMode: 'timeline' | 'academic' | 'blog' = 'timeline';
  activeFilter = 'all';
  searchQuery = '';
  selectedTag: string = 'all';
  activeSection: 'articles' | 'publications' | 'blogs' = 'articles';

  // Archive properties
  archiveYear: string = 'all';
  archiveMonth: string = 'all';
  archivedPosts: Post[] = [];
  showArchive: boolean = false;

  /** Real counts from the journal, filled in once loaded. */
  categories: Array<{ name: string; count: number }> = [];
  tags: string[] = [];
  /** The three most recent articles, shown in the sidebar. */
  recentPosts: Post[] = [];
  loading = true;
  loadError = '';

  newsletterEmail = '';
  newsletterTrap = '';
  newsletterConsent = '';
  newsletterState: 'idle' | 'sending' | 'done' = 'idle';
  newsletterError = '';

  private readonly postsService = inject(PostsService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.postsService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.featuredPost = posts[0] ?? null;
        this.recentPosts = posts.slice(0, 3);
        this.loading = false;
        this.updateFilteredPosts();
        this.updateArchivedPosts();
      },
      error: (error: unknown) => {
        this.loading = false;
        this.loadError = ApiError.from(error).message;
      },
    });
    this.postsService
      .getFacets()
      .then((facets) => {
        this.categories = facets.categories.map((c) => ({ name: c.value, count: c.count }));
        this.tags = facets.tags.slice(0, 16).map((t) => t.value);
      })
      .catch(() => undefined);
    this.postsService
      .getNewsletterConsent()
      .then((result) => (this.newsletterConsent = result.consentText))
      .catch(() => undefined);
  }

  async subscribe(event: Event) {
    event.preventDefault();
    if (this.newsletterState === 'sending') {
      return;
    }
    this.newsletterState = 'sending';
    this.newsletterError = '';
    try {
      await this.postsService.subscribe(this.newsletterEmail, this.newsletterTrap);
      this.newsletterState = 'done';
    } catch (error) {
      this.newsletterState = 'idle';
      this.newsletterError = ApiError.from(error).message;
    }
  }

  setViewMode(mode: 'timeline' | 'academic' | 'blog') {
    this.viewMode = mode;
    this.updateFilteredPosts();
  }

  setActiveSection(section: 'articles' | 'publications' | 'blogs') {
    this.activeSection = section;
    // Filter posts based on section
    this.updateFilteredPosts();
  }

  setFilter(filter: string, event?: Event) {
    event?.preventDefault();
    this.activeFilter = filter;
    this.updateFilteredPosts();
  }

  setTag(tag: string) {
    this.selectedTag = tag || 'all';
    this.updateFilteredPosts();
  }

  onSearchChange() {
    this.updateFilteredPosts();
  }

  private updateFilteredPosts() {
    let filtered = [...this.posts];

    // Remove featured post from regular list if in blog mode
    if (this.viewMode === 'blog' && this.featuredPost) {
      filtered = filtered.filter(p => p.slug !== this.featuredPost?.slug);
    }

    // Apply category filter
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(p => (p.categories || []).some(cat =>
        cat.toLowerCase().includes(this.activeFilter.toLowerCase())
      ));
    }

    // Apply search filter
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q))
      );
    }

    // Apply tag filter
    if (this.selectedTag && this.selectedTag !== 'all') {
      filtered = filtered.filter(p => p.tags && p.tags.includes(this.selectedTag));
    }

    this.filteredPosts = filtered;
  }

  /** The article's own cover image, or the journal's emblem when it has none. */
  imageFor(post: Post): string {
    return post.featured_image || '/assets/logo-crest.png';
  }

  /** Years that actually have articles, newest first. */
  get archiveYears(): string[] {
    return [...new Set(this.posts.map((post) => post.published_at.slice(0, 4)))].sort().reverse();
  }

  // Archive methods
  filterByYear() {
    this.updateArchivedPosts();
  }

  filterByMonth() {
    this.updateArchivedPosts();
  }

  private updateArchivedPosts() {
    let filtered = [...this.posts];

    if (this.archiveYear !== 'all') {
      filtered = filtered.filter(post => {
        const postYear = new Date(post.published_at).getFullYear().toString();
        return postYear === this.archiveYear;
      });
    }

    if (this.archiveMonth !== 'all') {
      filtered = filtered.filter(post => {
        const postMonth = (new Date(post.published_at).getMonth() + 1).toString().padStart(2, '0');
        return postMonth === this.archiveMonth;
      });
    }

    this.archivedPosts = filtered.sort((a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  trackBySlug(index: number, post: Post): string {
    return post.slug;
  }
}
