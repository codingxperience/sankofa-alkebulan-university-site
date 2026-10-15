import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { PostsService, Post } from '../core/posts.service';

@Component({
  selector: 'app-essay-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './essay-detail.component.html',
  styleUrl: './essay-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly postsService = inject(PostsService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  readonly fallbackImage = '/assets/hero/hero-campus-africa.jpg';
  readonly post = signal<Post | null>(null);
  readonly related = signal<Post[]>([]);
  readonly openingContent = signal('');
  readonly continuationContent = signal('');
  readonly loading = signal(true);
  readonly shareMessage = signal('');

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug');
          this.loading.set(true);
          this.post.set(null);
          this.related.set([]);
          this.openingContent.set('');
          this.continuationContent.set('');
          this.shareMessage.set('');
          if (!slug) return of(null);

          return this.postsService.getPost(slug).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((post) => {
        this.post.set(post);
        this.loading.set(false);
        if (post) {
          const story = this.splitStory(post.content);
          this.openingContent.set(story.opening);
          this.continuationContent.set(story.continuation);
          this.updateMetadata(post);
          this.loadRelated(post.slug);
        }
      });
  }

  private splitStory(content: string): { opening: string; continuation: string } {
    const paragraphs = [...content.matchAll(/<\/p\s*>/gi)];
    const end = paragraphs[2];
    if (!end || end.index === undefined) return { opening: content, continuation: '' };

    const splitAt = end.index + end[0].length;
    return {
      opening: content.slice(0, splitAt),
      continuation: content.slice(splitAt).trim(),
    };
  }

  private loadRelated(slug: string): void {
    this.postsService
      .getLatest(8)
      .then((posts) => {
        if (this.post()?.slug === slug) {
          this.related.set(posts.filter((post) => post.slug !== slug).slice(0, 4));
        }
      })
      .catch(() => {
        if (this.post()?.slug === slug) this.related.set([]);
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
    const post = this.post();
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
      this.shareMessage.set('Article link copied to your clipboard.');
    } catch {
      this.shareMessage.set('Copy the page address from your browser to share this article.');
    }
  }

  async copyArticleLink(): Promise<void> {
    if (!this.post() || typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.shareMessage.set('Article link copied to your clipboard.');
    } catch {
      this.shareMessage.set('Copy the page address from your browser to share this article.');
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
