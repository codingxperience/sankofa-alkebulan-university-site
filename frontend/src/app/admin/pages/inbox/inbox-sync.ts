import { Injectable, signal } from '@angular/core';
import type { InquiryDetail } from '../../core/types';

/**
 * Lets the open message tell the list beside it that it changed, so the
 * list updates in place without a reload. Provided by the inbox screen.
 */
@Injectable()
export class InboxSync {
  readonly latest = signal<InquiryDetail | null>(null);

  changed(detail: InquiryDetail): void {
    this.latest.set(detail);
  }
}
