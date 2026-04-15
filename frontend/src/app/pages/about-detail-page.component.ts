import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ABOUT_RELATED_LINKS,
  ABOUT_SECTION_LINKS,
  getAboutDetailPage,
} from '../university/about-detail-pages';

@Component({
  selector: 'app-about-detail-page',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './about-detail-page.component.html',
  styleUrl: './about-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly sectionLinks = ABOUT_SECTION_LINKS;
  readonly relatedLinks = ABOUT_RELATED_LINKS;
  readonly page = computed(() => getAboutDetailPage(this.paramMap().get('slug')));
}
