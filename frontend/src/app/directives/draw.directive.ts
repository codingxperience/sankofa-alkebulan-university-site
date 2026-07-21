import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/**
 * Draw-in reveal: wipes an element in with a clip-path sweep, staggered by its
 * order among all `[data-draw]` elements on the page. Ported from the
 * `[data-draw]` behaviour in the Claude Design prototypes.
 */
@Directive({
  selector: '[data-draw]',
})
export class DrawDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.style.clipPath = 'inset(0 0 0 0)';
            (target.style as CSSStyleDeclaration & { webkitClipPath: string }).webkitClipPath =
              'inset(0 0 0 0)';
            target.style.opacity = '1';
            target.style.transform = 'none';
            this.observer?.unobserve(target);
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
