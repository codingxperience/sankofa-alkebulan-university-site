import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

interface FieldNote {
  readonly image: string;
  readonly alt: string;
  readonly title: string;
  readonly detail: string;
  readonly position: string;
}

/** Photographs from the University Press field notes, captioned as the press page has them. */
const FIELD_NOTES: readonly FieldNote[] = [
  {
    image: '/assets/press/images/publication-table-african-thought.webp',
    alt: 'African thought publications arranged on a table.',
    title: 'SAU publication table',
    detail: 'Pan-African Convention week · 25 May 2026',
    position: '50% 45%',
  },
  {
    image: '/assets/press/images/diaspora-economic-forum-stage.webp',
    alt: 'Delegate seated in front of the Pan African Diaspora Economic and Investment Forum backdrop.',
    title: 'Diaspora Economic Forum',
    detail: 'Speke Resort, Munyonyo · 22 May 2026',
    position: '50% 40%',
  },
  {
    image: '/assets/press/images/liberation-day-procession.webp',
    alt: 'People walking together during Liberation Day activities.',
    title: 'Liberation Day',
    detail: 'Kampala · 25 May 2026',
    position: '50% 40%',
  },
  {
    image: '/assets/press/images/speke-arrival-delegates.webp',
    alt: 'Delegates at Speke Resort Convention Centre.',
    title: 'Pan-African Convention',
    detail: 'Speke Resort Convention Centre · 21–23 May 2026',
    position: '50% 38%',
  },
];

/** The university's own accounts, as the site footer lists them. */
const SOCIAL = [
  { label: 'Facebook', icon: 'fa-facebook', href: 'https://www.facebook.com/share/18epzuCc9P/' },
  { label: 'X', icon: 'fa-x-twitter', href: 'https://x.com/Kaija1133706' },
  { label: 'LinkedIn', icon: 'fa-linkedin', href: 'https://www.linkedin.com/in/sankofa-alkebulan-university-b177a03a9' },
  { label: 'YouTube', icon: 'fa-youtube', href: 'https://youtube.com/@sankofalkebulaniversity' },
  { label: 'TikTok', icon: 'fa-tiktok', href: 'https://www.tiktok.com/@salkebulaniversity' },
] as const;

/** How far the picture panel's right edge leans in at its foot, as a share of its height. */
const SLANT = 0.054;

/**
 * Every sign-in screen: the field-note pictures on the left, the university's
 * mark and the form passed in on the right, on a white card over the picture.
 */
@Component({
  selector: 'sc-auth-frame',
  imports: [NgOptimizedImage],
  templateUrl: './auth-frame.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sc-auth' },
})
export class AuthFrame {
  protected readonly social = SOCIAL;
  protected readonly count = FIELD_NOTES.length;
  protected readonly index = signal(0);
  protected readonly note = computed(() => FIELD_NOTES[this.index()]);

  /** The panel's outline once it has been measured; until then, plain rounded corners. */
  protected readonly outline = signal<string | null>(null);
  protected readonly lean = signal(0);

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.panel().nativeElement;
      const stacked = window.matchMedia('(max-width: 900px)');
      const measure = () => {
        if (stacked.matches) {
          this.outline.set(null);
          this.lean.set(0);
          return;
        }
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const lean = Math.round(height * SLANT);
        this.lean.set(lean);
        this.outline.set(leaningOutline(width, height, lean, Math.min(56, Math.max(24, width * 0.071))));
      };
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected step(by: number): void {
    this.index.update((index) => (index + by + this.count) % this.count);
  }
}

/** A rounded outline whose right edge leans in by `lean` pixels at the foot. */
function leaningOutline(width: number, height: number, lean: number, radius: number): string {
  const edge = Math.hypot(lean, height);
  // One radius along the leaning edge, from either end.
  const dx = (lean / edge) * radius;
  const dy = (height / edge) * radius;
  const r = radius;
  const n = (value: number) => Math.round(value * 10) / 10;
  const points = [
    `M ${n(r)} 0`,
    `L ${n(width - r)} 0`,
    `Q ${width} 0 ${n(width - dx)} ${n(dy)}`,
    `L ${n(width - lean + dx)} ${n(height - dy)}`,
    `Q ${width - lean} ${height} ${n(width - lean - r)} ${height}`,
    `L ${n(r)} ${height}`,
    `Q 0 ${height} 0 ${n(height - r)}`,
    `L 0 ${n(r)}`,
    `Q 0 0 ${n(r)} 0`,
    'Z',
  ];
  return `path('${points.join(' ')}')`;
}
