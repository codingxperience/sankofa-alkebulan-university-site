import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/api/api-client';
import { PostsService, Post } from '../../core/posts.service';

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
})
export class Articles implements OnInit {
  private readonly postsService = inject(PostsService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly pageSize = 6;
  readonly fallbackImage = '/assets/logo-crest.png';
  posts: Post[] = [];
  categories: ArticleCategory[] = [];
  recentPosts: Post[] = [];
  tags: string[] = [];
  searchQuery = '';
  activeCategory = 'all';
  activeTag = '';
  page = 1;
  loading = true;
  loadError = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPosts();
      this.postsService
        .getFacets()
        .then((facets) => {
          this.categories = facets.categories
            .filter((category) => category.value.trim())
            .slice(0, 8)
            .map((category) => ({ name: category.value, count: category.count }));
          this.tags = facets.tags.slice(0, 12).map((tag) => tag.value);
        })
        .catch(() => undefined);
    }
  }

  get filteredPosts(): Post[] {
    const query = this.searchQuery.trim().toLocaleLowerCase();
    return this.posts.filter((post) => {
      const matchesCategory =
        this.activeCategory === 'all' || post.categories.some((category) => category === this.activeCategory);
      const matchesTag = !this.activeTag || post.tags.includes(this.activeTag);
      const matchesQuery =
        !query ||
        [post.title, post.excerpt, post.content, post.author, ...post.categories, ...post.tags]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase().includes(query));
      return matchesCategory && matchesTag && matchesQuery;
    });
  }

  get visiblePosts(): Post[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredPosts.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.ceil(this.filteredPosts.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    const last = this.pageCount;
    const first = Math.max(1, Math.min(this.page - 2, last - 4));
    return Array.from({ length: Math.min(5, last) }, (_, index) => first + index);
  }

  get resultStart(): number {
    return this.filteredPosts.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get resultEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredPosts.length);
  }

  setSearch(value: string): void {
    this.searchQuery = value;
    this.page = 1;
  }

  setCategory(name: string): void {
    this.activeCategory = name;
    this.activeTag = '';
    this.page = 1;
  }

  setTag(tag: string): void {
    this.activeTag = this.activeTag === tag ? '' : tag;
    this.page = 1;
  }

  selectPage(page: number): void {
    this.page = Math.max(1, Math.min(page, this.pageCount));
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

  private loadPosts(): void {
    this.loading = true;
    this.loadError = '';
    this.postsService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.recentPosts = posts.slice(0, 5);
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.loadError = ApiError.from(error).message;
      },
    });
  }

  retry(): void {
    this.loadPosts();
  }
}
