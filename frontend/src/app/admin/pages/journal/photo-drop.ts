import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ApiError } from '../../../core/api/api-client';
import { PhotoUploads, carriesFiles, imageFiles } from '../../core/photos';

/**
 * A place to drop, choose or replace one photo. It uploads the photo itself
 * and reports the stored address, so the form only ever holds an address.
 */
@Component({
  selector: 'sc-photo-drop',
  template: `
    <div
      class="pd"
      [class.is-over]="over()"
      [class.is-busy]="busy()"
      [class.is-filled]="!!url()"
      (dragenter)="enter($event)"
      (dragover)="enter($event)"
      (dragleave)="leave($event)"
      (drop)="drop($event)"
    >
      @if (url(); as current) {
        <img class="pd__preview" [src]="current" [alt]="label() + ': current photo'" />
      }
      <div class="pd__body">
        @if (busy()) {
          <span class="pd__spinner" aria-hidden="true"></span>
          <p>Uploading the photo…</p>
        } @else if (over()) {
          <i class="pi pi-download" aria-hidden="true"></i>
          <p>Drop to use this photo</p>
        } @else {
          @if (!url()) {
            <i class="pi pi-image" aria-hidden="true"></i>
            <p>Drag a photo here</p>
          }
          <div class="pd__actions">
            <button type="button" class="sc-btn sc-btn--small" [disabled]="disabled()" (click)="picker.click()">
              <i class="pi pi-upload" aria-hidden="true"></i>{{ url() ? 'Replace photo' : 'Choose a photo' }}
            </button>
            @if (url()) {
              <button type="button" class="sc-btn sc-btn--small sc-btn--quiet" [disabled]="disabled()" (click)="removed.emit()">
                Remove
              </button>
            }
          </div>
          @if (!url()) {
            <span class="pd__hint">JPEG, PNG, WebP or GIF. Large photos are made smaller for the web.</span>
          }
        }
      </div>
      <input #picker type="file" accept="image/*" hidden (change)="chosen($event)" [attr.aria-label]="'Choose a file for the ' + label()" />
    </div>
    <p class="pd__status" role="status" aria-live="polite">
      @if (error()) {
        <span class="sc-error">{{ error() }}</span>
      } @else if (busy()) {
        Uploading the photo…
      }
    </p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 6px;
    }

    .pd {
      position: relative;
      display: grid;
      overflow: hidden;
      border: 1.5px dashed var(--sc-line);
      border-radius: 16px;
      background: var(--sc-paper);
      transition:
        border-color 160ms var(--sc-ease),
        background 160ms var(--sc-ease);

      &.is-filled {
        border-style: solid;
      }

      &.is-over {
        border-color: var(--sc-gold-bright);
        background: var(--sc-gold-soft);
      }
    }

    .pd__preview {
      display: block;
      width: 100%;
      max-height: 200px;
      object-fit: cover;
    }

    .pd__body {
      display: grid;
      justify-items: center;
      gap: 8px;
      padding: 18px 14px;
      text-align: center;

      i.pi-image,
      i.pi-download {
        font-size: 22px;
        color: var(--sc-gold-ink);
      }

      p {
        font-size: 13.5px;
        color: var(--sc-ink-2);
      }
    }

    .is-filled .pd__body {
      padding: 10px 12px;
    }

    .is-filled.is-over .pd__body,
    .is-filled.is-busy .pd__body {
      position: absolute;
      inset: 0;
      align-content: center;
      background: rgba(6, 13, 22, 0.78);
    }

    .pd__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
    }

    .pd__hint {
      font-size: 12px;
      color: var(--sc-ink-3);
    }

    .pd__spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: var(--sc-gold);
      border-radius: 50%;
      animation: sc-spin 700ms linear infinite;
    }

    .pd__status:empty {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoDrop {
  private readonly photos = inject(PhotoUploads);

  readonly url = input<string>('');
  readonly label = input('photo');
  readonly disabled = input(false);
  readonly uploaded = output<string>();
  readonly removed = output<void>();

  protected readonly over = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected enter(event: DragEvent): void {
    if (this.disabled() || this.busy() || !carriesFiles(event.dataTransfer)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.over.set(true);
  }

  protected leave(event: DragEvent): void {
    const into = event.relatedTarget as Node | null;
    if (!into || !(event.currentTarget as HTMLElement).contains(into)) {
      this.over.set(false);
    }
  }

  protected drop(event: DragEvent): void {
    if (!this.over()) {
      return;
    }
    event.preventDefault();
    this.over.set(false);
    void this.take(imageFiles(event.dataTransfer?.files));
  }

  protected chosen(event: Event): void {
    const field = event.target as HTMLInputElement;
    void this.take(imageFiles(field.files));
    field.value = '';
  }

  private async take(files: File[]): Promise<void> {
    const [file] = files;
    if (!file) {
      this.error.set('That is not a photo. Choose a JPEG, PNG, WebP or GIF file.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const photo = await this.photos.upload(file);
      this.uploaded.emit(photo.url);
    } catch (error) {
      this.error.set(error instanceof Error && !(error instanceof ApiError) ? error.message : ApiError.from(error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
