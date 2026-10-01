import { Injectable, TemplateRef, signal } from '@angular/core';

/**
 * The left of the row across the top of the console belongs to whichever
 * screen is open. A screen hands its template in when it opens and takes it
 * back when it closes; the shell draws whatever is there.
 */
@Injectable({ providedIn: 'root' })
export class TopSlot {
  readonly template = signal<TemplateRef<unknown> | null>(null);

  show(template: TemplateRef<unknown>): void {
    this.template.set(template);
  }

  clear(template: TemplateRef<unknown>): void {
    if (this.template() === template) {
      this.template.set(null);
    }
  }
}
