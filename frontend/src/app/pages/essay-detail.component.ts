import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { PostsService, Post } from '../core/posts.service';

interface ArticlePage {
  post: Post;
  related: Post[];
}

@Component({
  selector: 'app-essay-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './essay-detail.component.html',
  styleUrl: './essay-detail.component.scss',
})
export class EssayDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly postsService = inject(PostsService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  readonly fallbackImage = '/assets/hero/hero-campus-africa.jpg';
  post: Post | null = null;
  related: Post[] = [];
  loading = true;
  shareMessage = '';

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug');
          this.loading = true;
          this.post = null;
          this.related = [];
          this.shareMessage = '';
          if (!slug) return of(null);

          return this.postsService.getPost(slug).pipe(
            map(({ related, ...post }): ArticlePage => ({ post, related })),
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.post = page?.post ?? null;
        this.related = page?.related ?? [];
        this.loading = false;
        if (this.post) this.updateMetadata(this.post);
      });
  }

  authorInitials(author: string): string {
    return author
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase() ?? '')
      .join('');
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    if (!image.src.endsWith(this.fallbackImage)) image.src = this.fallbackImage;
  }

  async shareArticle(): Promise<void> {
    const post = this.post;
    if (!post || typeof window === 'undefined') return;

    const shareData = { title: post.title, text: post.excerpt, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      this.shareMessage = 'Article link copied to your clipboard.';
    } catch {
      this.shareMessage = 'Copy the page address from your browser to share this article.';
    }
  }

  private updateMetadata(post: Post): void {
    this.title.setTitle(`${post.title} | Sankofa Alkebulan University`);
    this.meta.updateTag({ name: 'description', content: post.excerpt });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:title', content: post.title });
    this.meta.updateTag({ property: 'og:description', content: post.excerpt });
    if (post.featured_image) this.meta.updateTag({ property: 'og:image', content: post.featured_image });
  }
}
