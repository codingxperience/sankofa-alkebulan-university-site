import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/**
 * Draw-in reveal: wipes an element in with a clip-path sweep, staggered by its
 * order among all `[data-draw]` elements on the page. Ported from the
 * `[data-draw]` behaviour in the Claude Design prototypes.
 *
 * Visibility is checked by polling getBoundingClientRect on animation frames
 * (like the prototype) rather than IntersectionObserver, because the initial
 * `clip-path: inset(0 100% 0 0)` clips the element to zero visible area and
 * prevents intersection callbacks from ever firing.
 */
@Directive({
  selector: '[data-draw]',
})
export class DrawDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private raf = 0;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      return;
    }

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      return;
    }

    const index = Array.from(document.querySelectorAll('[data-draw]')).indexOf(node);
    node.style.clipPath = 'inset(0 100% 0 0)';
    (node.style as CSSStyleDeclaration & { webkitClipPath: string }).webkitClipPath =
      'inset(0 100% 0 0)';
    node.style.opacity = '0';
    node.style.transform = 'translateY(10px) scale(0.96)';
    node.style.transition =
      'clip-path 860ms cubic-bezier(0.16,1,0.3,1), opacity 560ms ease, transform 640ms cubic-bezier(0.16,1,0.3,1)';
    node.style.transitionDelay = (index >= 0 ? index : 0) * 130 + 'ms';

    const reveal = () => {
      node.style.clipPath = 'inset(0 0 0 0)';
      (node.style as CSSStyleDeclaration & { webkitClipPath: string }).webkitClipPath =
        'inset(0 0 0 0)';
      node.style.opacity = '1';
      node.style.transform = 'none';
    };

    const t0 = performance.now();
    const tick = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const r = node.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 4) {
        reveal();
        this.raf = 0;
        return;
      }
      if (performance.now() - t0 < 20000) {
        this.raf = requestAnimationFrame(tick);
      } else {
        reveal();
        this.raf = 0;
      }
    };
    this.raf = requestAnimationFrame(() => requestAnimationFrame(tick));
  }

  ngOnDestroy(): void {
    if (this.raf && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.raf);
    }
  }
}
