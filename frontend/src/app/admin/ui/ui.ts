import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AgoPipe, WhenPipe, initials } from '../core/format';
import { Confirmations, Toasts } from '../core/feedback';
import type { Activity, Note } from '../core/types';
import type { Tone } from '../core/vocabulary';

/** A record's state, in words and colour. */
@Component({
  selector: 'sc-pill',
  template: '{{ label() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"sc-pill sc-pill--" + tone()' },
})
export class Pill {
  readonly label = input.required<string>();
  readonly tone = input<Tone>('muted');
}

/**
 * A person shown by their initials, on one of six warm tones picked from
 * their name, so the same person always wears the same colour. Decorative:
 * the name itself is always written beside it.
 */
@Component({
  selector: 'sc-face',
  template: '{{ letters() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sc-face', 'aria-hidden': 'true', '[attr.data-tone]': 'tone()' },
})
export class Face {
  readonly name = input<string | null | undefined>('');
  protected readonly letters = computed(() => initials(this.name()));
  protected readonly tone = computed(() => {
    let hash = 0;
    for (const char of (this.name() ?? '').toLowerCase()) {
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }
    return (hash % 6) + 1;
  });
}

/** What a list shows when there is nothing in it — said plainly, with what to do next. */
@Component({
  selector: 'sc-empty',
  template: `
    <i [class]="'pi ' + icon()" aria-hidden="true"></i>
    <strong>{{ title() }}</strong>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sc-empty' },
})
export class Empty {
  readonly title = input.required<string>();
  readonly icon = input('pi-inbox');
}

/** Placeholder lines while a screen loads. */
@Component({
  selector: 'sc-skeleton',
  template: `@for (line of rows(); track $index) {<span></span>}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sc-skeleton', 'aria-busy': 'true', 'aria-label': 'Loading' },
})
export class Skeleton {
  readonly lines = input(4);
  protected readonly rows = computed(() => Array.from({ length: this.lines() }));
}

interface Moment {
  readonly id: string;
  readonly at: string;
  readonly kind: 'note' | 'reply' | 'event';
  readonly who: string;
  readonly text: string;
}

/**
 * The story of a record: notes the team wrote, replies sent, and every
 * change made to it, in the order they happened.
 */
@Component({
  selector: 'sc-timeline',
  imports: [WhenPipe, AgoPipe],
  template: `
    @if (moments().length) {
      <ol class="sc-timeline">
        @for (moment of moments(); track moment.id) {
          <li class="sc-moment">
            @switch (moment.kind) {
              @case ('note') {
                <span class="sc-moment__mark sc-moment__mark--note" aria-hidden="true"><i class="pi pi-pencil"></i></span>
                <div>
                  <p class="sc-moment__meta">
                    <strong>{{ moment.who }}</strong> added a note ·
                    <time [attr.datetime]="moment.at" [title]="moment.at | when: 'full'">{{ moment.at | ago }}</time>
                  </p>
                  <div class="sc-moment__body sc-moment__body--note">{{ moment.text }}</div>
                </div>
              }
              @case ('reply') {
                <span class="sc-moment__mark sc-moment__mark--reply" aria-hidden="true"><i class="pi pi-send"></i></span>
                <div>
                  <p class="sc-moment__meta">
                    <strong>{{ moment.who }}</strong> replied by email ·
                    <time [attr.datetime]="moment.at" [title]="moment.at | when: 'full'">{{ moment.at | ago }}</time>
                  </p>
                  <div class="sc-moment__body">{{ moment.text }}</div>
                </div>
              }
              @default {
                <span class="sc-moment__mark" aria-hidden="true"><i class="pi pi-history"></i></span>
                <div>
                  <p class="sc-moment__text">{{ moment.text }}</p>
                  <p class="sc-moment__meta">
                    <time [attr.datetime]="moment.at" [title]="moment.at | when: 'full'">{{ moment.at | when: 'short' }}</time>
                  </p>
                </div>
              }
            }
          </li>
        }
      </ol>
    } @else {
      <p class="sc-muted">Nothing has happened here yet.</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Timeline {
  readonly notes = input<readonly Note[]>([]);
  readonly activity = input<readonly Activity[]>([]);

  protected readonly moments = computed<Moment[]>(() => {
    const notes: Moment[] = this.notes().map((note) => ({
      id: `n-${note.id}`,
      at: note.createdAt,
      kind: note.kind === 'REPLY' ? 'reply' : 'note',
      who: note.author?.name ?? 'A former colleague',
      text: note.body,
    }));
    // Replies and notes already tell their own story; the matching log lines would repeat it.
    const events: Moment[] = this.activity()
      .filter((entry) => entry.action !== 'inquiry.replied')
      .map((entry) => ({ id: `a-${entry.id}`, at: entry.createdAt, kind: 'event', who: entry.actorLabel, text: entry.summary }));
    return [...notes, ...events].sort((a, b) => a.at.localeCompare(b.at));
  });
}

/** A link someone needs to pass on by hand, with a button that copies it. */
@Component({
  selector: 'sc-copy-link',
  template: `
    <div class="sc-copy">
      <input class="sc-input" [value]="url()" readonly [attr.aria-label]="label()" (focus)="select($event)" />
      <button type="button" class="sc-btn" (click)="copy()">
        <i class="pi" [class.pi-copy]="!copied()" [class.pi-check]="copied()" aria-hidden="true"></i>
        {{ copied() ? 'Copied' : 'Copy' }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyLink {
  private readonly toasts = inject(Toasts);
  readonly url = input.required<string>();
  readonly label = input('Link');
  protected readonly copied = signal(false);

  protected select(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2400);
    } catch {
      this.toasts.error('Your browser blocked copying. Select the link and copy it by hand.');
    }
  }
}

/** Where toasts appear. Successes are announced politely; errors interrupt. */
@Component({
  selector: 'sc-toaster',
  template: `
    <div class="sc-toasts" role="status" aria-live="polite">
      @for (toast of toasts.list(); track toast.id) {
        <div class="sc-toast" [class.sc-toast--error]="toast.kind === 'error'" [attr.role]="toast.kind === 'error' ? 'alert' : null">
          <i [class]="toast.kind === 'error' ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'" aria-hidden="true"></i>
          <span>{{ toast.text }}</span>
          <button type="button" (click)="toasts.dismiss(toast.id)" aria-label="Dismiss"><i class="pi pi-times" aria-hidden="true"></i></button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toaster {
  protected readonly toasts = inject(Toasts);
}

/** The single confirmation dialog, driven by the Confirmations service. */
@Component({
  selector: 'sc-confirm',
  template: `
    <dialog #dialog class="sc-dialog" aria-labelledby="sc-confirm-title" (cancel)="answer($event, false)">
      @if (confirmations.current(); as request) {
        <div class="sc-dialog__head">
          <h2 id="sc-confirm-title">{{ request.title }}</h2>
          <p>{{ request.body }}</p>
        </div>
        <div class="sc-dialog__foot">
          <button type="button" class="sc-btn sc-btn--quiet" (click)="answer($event, false)">Keep it</button>
          <button
            type="button"
            class="sc-btn"
            [class.sc-btn--solid-danger]="request.tone === 'danger'"
            [class.sc-btn--primary]="request.tone !== 'danger'"
            (click)="answer($event, true)"
          >
            {{ request.confirm }}
          </button>
        </div>
      }
    </dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmHost {
  protected readonly confirmations = inject(Confirmations);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.confirmations.current() && !dialog.open) {
        dialog.showModal();
      } else if (!this.confirmations.current() && dialog.open) {
        dialog.close();
      }
    });
  }

  protected answer(event: Event, value: boolean): void {
    event.preventDefault();
    this.confirmations.answer(value);
  }
}

/**
 * A modal dialog built on the native <dialog> element, which brings focus
 * trapping, Escape to close and an inert background for free.
 */
@Component({
  selector: 'sc-modal',
  template: `
    <dialog #dialog class="sc-dialog" [class.sc-dialog--wide]="wide()" [attr.aria-labelledby]="labelledBy()" (close)="closed.emit()">
      @if (open()) {
        <ng-content />
      }
    </dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  readonly open = input(false);
  readonly wide = input(false);
  readonly labelledBy = input<string>();
  readonly closed = output<void>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }
}

/**
 * Places a native popover just below the control that opens it, lined up
 * with its start or end edge, and closes it if the page scrolls away. The
 * popover API itself brings Escape, outside clicks and focus return.
 */
@Directive({
  selector: '[scPopAnchor]',
  host: { '(beforetoggle)': 'place($event)', '(window:scroll)': 'hide()', '(window:resize)': 'hide()' },
})
export class PopAnchor {
  readonly scPopAnchor = input.required<HTMLElement>();
  readonly align = input<'start' | 'end'>('start');
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  protected place(event: Event): void {
    if ((event as ToggleEvent).newState !== 'open') {
      return;
    }
    const anchor = this.scPopAnchor().getBoundingClientRect();
    const style = this.element.nativeElement.style;
    style.top = `${Math.round(anchor.bottom + 10)}px`;
    if (this.align() === 'end') {
      style.left = 'auto';
      style.right = `${Math.max(12, Math.round(window.innerWidth - anchor.right))}px`;
    } else {
      style.right = 'auto';
      style.left = `${Math.max(12, Math.round(anchor.left))}px`;
    }
  }

  protected hide(): void {
    const popover = this.element.nativeElement;
    if (popover.matches(':popover-open')) {
      popover.hidePopover();
    }
  }
}
