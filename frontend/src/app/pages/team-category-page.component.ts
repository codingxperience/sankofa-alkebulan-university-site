import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getTeamCategoryGroup } from '../university/team-members';

@Component({
  selector: 'app-team-category-page',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './team-category-page.component.html',
  styleUrl: './team-category-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCategoryPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  readonly group = computed(() => getTeamCategoryGroup(this.routeData()['categoryId'] as string | null));
}
