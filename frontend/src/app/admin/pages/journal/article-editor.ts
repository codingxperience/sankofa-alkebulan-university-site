import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/api/api-client';
import { ConsoleApi } from '../../core/console-api';
import { Confirmations, Toasts } from '../../core/feedback';
import { AgoPipe, WhenPipe } from '../../core/format';
import { PhotoUploads, type UploadedPhoto, carriesFiles, imageFiles } from '../../core/photos';
import { StaffSession } from '../../core/staff-session';
import type { Article, ArticleStatus } from '../../core/types';
import { ARTICLE_STATUS } from '../../core/vocabulary';
import { fromZonedInput, toZonedInput } from '../../core/zones';
import { Pill, Skeleton } from '../../ui/ui';
import { PhotoDrop } from './photo-drop';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCAL_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
/** Put in each new photo's alt text, selected, so the editor types the description straight over it. */
const DESCRIBE = 'Describe the photo';

function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

const list = (text: string) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

@Component({
  selector: 'sc-article-editor',
  imports: [ReactiveFormsModule, RouterLink, Pill, Skeleton, AgoPipe, WhenPipe, PhotoDrop],
  templateUrl: './article-editor.html',
  styleUrl: './article-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:beforeunload)': 'warnIfUnsaved($event)' },
})
export class ArticleEditorPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly confirmations = inject(Confirmations);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly photos = inject(PhotoUploads);
  private readonly bodyField = viewChild<ElementRef<HTMLTextAreaElement>>('bodyField');
  protected readonly session = inject(StaffSession);

  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly statusTerms = ARTICLE_STATUS;
  protected readonly zoneName = LOCAL_ZONE;

  protected readonly article = signal<Article | null>(null);
  protected readonly loading = signal(Boolean(this.id));
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly fields = signal<Record<string, string>>({});
  protected readonly stale = signal(false);
  protected readonly preview = signal(false);
  protected readonly cover = signal('');
  private readonly body = signal('');
  protected readonly bodyOver = signal(false);
  protected readonly bodyUploads = signal(0);
  protected readonly bodyPhotoError = signal('');
  protected readonly undescribed = computed(() => this.body().includes(`alt="${DESCRIBE}"`));
  private slugEdited = Boolean(this.id);

  protected readonly canManage = computed(() => this.session.can('journal.manage'));
  protected readonly scheduled = computed(() => {
    const a = this.article();
    return !!a && a.status === 'PUBLISHED' && !!a.publishedAt && new Date(a.publishedAt) > new Date();
  });
  protected readonly live = computed(() => {
    const a = this.article();
    return !!a && a.status === 'PUBLISHED' && !this.scheduled();
  });
  protected readonly deletable = computed(() => {
    const a = this.article();
    return !!a && a.status === 'DRAFT' && !a.publishedAt;
  });

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.pattern(SLUG)]],
    authorName: [this.session.me()?.name ?? '', [Validators.required, Validators.minLength(2)]],
    excerpt: [''],
    coverImageUrl: [''],
    categories: [''],
    tags: [''],
    bodyHtml: [''],
    status: ['DRAFT' as ArticleStatus],
    publishedAt: [''],
  });

  constructor() {
    if (this.id) {
      void this.load(this.id);
    }
    if (!this.canManage()) {
      this.form.disable();
    }
    this.form.controls.coverImageUrl.valueChanges.subscribe((url) => this.cover.set(url.trim()));
    this.form.controls.bodyHtml.valueChanges.subscribe((html) => this.body.set(html));
    this.form.controls.title.valueChanges.subscribe((title) => {
      if (!this.slugEdited) {
        this.form.controls.slug.setValue(slugify(title), { emitEvent: false });
      }
    });
  }

  protected slugTyped(): void {
    this.slugEdited = true;
  }

  protected setCover(url: string): void {
    this.form.controls.coverImageUrl.setValue(url);
    this.form.controls.coverImageUrl.markAsDirty();
  }

  /* ─── Photos in the body: dropped, pasted or chosen ─── */

  protected bodyDragOver(event: DragEvent): void {
    if (!this.canManage() || !carriesFiles(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    this.bodyOver.set(true);
  }

  protected bodyDrop(event: DragEvent): void {
    this.bodyOver.set(false);
    if (!this.canManage() || !carriesFiles(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    // Put the photo where it was dropped, not where the caret happened to be.
    this.bodyField()?.nativeElement.focus();
    void this.addBodyPhotos(imageFiles(event.dataTransfer?.files));
  }

  protected bodyPaste(event: ClipboardEvent): void {
    const files = imageFiles(event.clipboardData?.files);
    if (files.length && this.canManage()) {
      event.preventDefault();
      void this.addBodyPhotos(files);
    }
  }

  protected bodyChosen(event: Event): void {
    const field = event.target as HTMLInputElement;
    void this.addBodyPhotos(imageFiles(field.files));
    field.value = '';
  }

  private async addBodyPhotos(files: File[]): Promise<void> {
    if (!files.length) {
      this.bodyPhotoError.set('That is not a photo. Choose a JPEG, PNG, WebP or GIF file.');
      return;
    }
    this.bodyPhotoError.set('');
    for (const file of files) {
      this.bodyUploads.update((count) => count + 1);
      try {
        this.insertPhoto(await this.photos.upload(file));
      } catch (error) {
        this.bodyPhotoError.set(error instanceof Error && !(error instanceof ApiError) ? error.message : ApiError.from(error).message);
      } finally {
        this.bodyUploads.update((count) => count - 1);
      }
    }
  }

  private insertPhoto(photo: UploadedPhoto): void {
    const control = this.form.controls.bodyHtml;
    const field = this.bodyField()?.nativeElement;
    const text = control.value;
    const at = field ? field.selectionEnd : text.length;
    const before = text.slice(0, at);
    const lead = before && !before.endsWith('\n') ? '\n' : '';
    const figure = `${lead}<figure>\n  <img src="${photo.url}" alt="${DESCRIBE}" width="${photo.width}" height="${photo.height}" />\n</figure>\n`;
    control.setValue(before + figure + text.slice(at));
    control.markAsDirty();
    if (field) {
      const start = before.length + figure.indexOf(DESCRIBE);
      field.focus();
      field.setSelectionRange(start, start + DESCRIBE.length);
    }
  }

  protected warnIfUnsaved(event: BeforeUnloadEvent): void {
    if (this.form.dirty && !this.saving()) {
      event.preventDefault();
    }
  }

  protected async save(status?: ArticleStatus): Promise<void> {
    this.error.set('');
    this.fields.set({});
    if (status) {
      this.form.controls.status.setValue(status);
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('A title, a web address and an author are needed.');
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      title: v.title,
      slug: v.slug,
      authorName: v.authorName,
      excerpt: v.excerpt,
      coverImageUrl: v.coverImageUrl.trim() || null,
      categories: list(v.categories),
      tags: list(v.tags),
      bodyHtml: v.bodyHtml,
      status: v.status,
      publishedAt: v.publishedAt ? fromZonedInput(v.publishedAt, LOCAL_ZONE) : null,
    };
    this.saving.set(true);
    try {
      const current = this.article();
      const saved = current
        ? await this.api.patch<Article>(`/journal/articles/${current.id}`, { ...body, expectedUpdatedAt: current.updatedAt })
        : await this.api.post<Article>('/journal/articles', body);
      this.show(saved);
      this.toasts.success(this.savedMessage(saved));
      if (!current) {
        await this.router.navigate(['/admin/journal', saved.id], { replaceUrl: true });
      }
    } catch (error) {
      const failure = ApiError.from(error);
      if (failure.code === 'stale_article') {
        this.stale.set(true);
      }
      this.error.set(failure.message);
      this.fields.set(failure.fields);
    } finally {
      this.saving.set(false);
    }
  }

  protected async reloadLatest(): Promise<void> {
    if (this.id) {
      this.stale.set(false);
      this.error.set('');
      await this.load(this.id);
    }
  }

  protected async remove(): Promise<void> {
    const article = this.article();
    if (!article) {
      return;
    }
    const yes = await this.confirmations.ask({
      title: `Delete “${article.title}”?`,
      body: 'This draft has never been published, so it can be removed completely. This cannot be undone.',
      confirm: 'Delete draft',
      tone: 'danger',
    });
    if (!yes) {
      return;
    }
    try {
      await this.api.delete(`/journal/articles/${article.id}`);
      this.form.markAsPristine();
      this.toasts.success('Draft deleted.');
      await this.router.navigateByUrl('/admin/journal');
    } catch (error) {
      this.toasts.error(error);
    }
  }

  private savedMessage(article: Article): string {
    if (article.status === 'PUBLISHED') {
      return article.publishedAt && new Date(article.publishedAt) > new Date() ? 'Scheduled.' : 'Published.';
    }
    return article.status === 'ARCHIVED' ? 'Archived.' : 'Draft saved.';
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    try {
      this.show(await this.api.get<Article>(`/journal/articles/${id}`));
    } catch (error) {
      this.error.set(ApiError.from(error).message);
    } finally {
      this.loading.set(false);
    }
  }

  private show(article: Article): void {
    this.article.set(article);
    this.form.reset(
      {
        title: article.title,
        slug: article.slug,
        authorName: article.authorName,
        excerpt: article.excerpt,
        coverImageUrl: article.coverImageUrl ?? '',
        categories: article.categories.join(', '),
        tags: article.tags.join(', '),
        bodyHtml: article.bodyHtml,
        status: article.status,
        publishedAt: toZonedInput(article.publishedAt, LOCAL_ZONE),
      },
      { emitEvent: false },
    );
    this.cover.set(article.coverImageUrl ?? '');
    this.body.set(article.bodyHtml);
  }
}
