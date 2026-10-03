import { Injectable, inject } from '@angular/core';
import { ConsoleApi } from './console-api';

/** A photo stored by the API, ready to place in an article. */
export interface UploadedPhoto {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

const KEPT_AS_IS = ['image/png', 'image/webp', 'image/gif'];
const LONGEST_EDGE = 2000;
const KEEP_UNDER = 1.5 * 1024 * 1024;
const SERVER_LIMIT = 4 * 1024 * 1024;

/** True when a drag or paste carries at least one file. */
export function carriesFiles(data: DataTransfer | null): boolean {
  return !!data && Array.from(data.types).includes('Files');
}

/** The image files in a drop, paste or file picker, in order. */
export function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'));
}

/**
 * Uploads photos from the console. Each photo is prepared in the browser first:
 * turned the right way up, brought down to 2000 pixels on its longest side,
 * and — for camera JPEGs — saved afresh, which also drops hidden details such
 * as where the photo was taken. Small PNG, WebP and GIF files go up unchanged,
 * so transparency and animation survive.
 */
@Injectable({ providedIn: 'root' })
export class PhotoUploads {
  private readonly api = inject(ConsoleApi);

  async upload(file: File): Promise<UploadedPhoto> {
    const prepared = await prepare(file);
    const stored = await this.api.upload<{ url: string }>('/media', prepared.blob, {
      'X-File-Name': encodeURIComponent(file.name.slice(0, 160)),
    });
    return { url: stored.url, width: prepared.width, height: prepared.height };
  }
}

async function prepare(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`“${file.name}” could not be read as a photo. Save it as a JPEG or PNG and try again.`);
  }
  try {
    const { width, height } = bitmap;
    const fits = Math.max(width, height) <= LONGEST_EDGE;
    if (file.type === 'image/gif' && file.size <= SERVER_LIMIT) {
      return { blob: file, width, height };
    }
    if (KEPT_AS_IS.includes(file.type) && fits && file.size <= KEEP_UNDER) {
      return { blob: file, width, height };
    }
    const scale = fits ? 1 : LONGEST_EDGE / Math.max(width, height);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('This browser cannot prepare photos. Try another browser.');
    }
    // JPEG has no transparency: transparent areas become white, not black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, w, h);
    context.drawImage(bitmap, 0, 0, w, h);
    for (const quality of [0.86, 0.75, 0.6]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= SERVER_LIMIT) {
        return { blob, width: w, height: h };
      }
    }
    throw new Error(`“${file.name}” is too large to upload, even made smaller.`);
  } finally {
    bitmap.close();
  }
}
