import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getTeamCategoryLabel, getTeamMember } from '../university/team-members';

@Component({
  selector: 'app-team-profile-page',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './team-profile-page.component.html',
  styleUrl: './team-profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamProfilePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly member = computed(() => getTeamMember(this.paramMap().get('slug')));
  readonly categoryLabels = computed(() => this.member()?.categories.map(getTeamCategoryLabel) ?? []);
  readonly backTarget = computed(() => {
    const category = this.member()?.categories[0] ?? 'founders';

    switch (category) {
      case 'executive':
        return { label: 'Back to Executive Team', path: '/about/executive-team', fragment: null };
      case 'board':
        return { label: 'Back to Board of Governance', path: '/about/board-of-governance', fragment: null };
      case 'advisory':
        return { label: 'Back to Advisory Council', path: '/about/advisory-council', fragment: null };
      case 'research-scholarly':
        return { label: 'Back to Research & Scholarly Team', path: '/about/research-scholarly-team', fragment: null };
      default:
        return { label: 'Back to Founders & Chancellor', path: '/about', fragment: 'leadership-team' };
    }
  });
  readonly adminEmail = 'sankofalkebulanuniversity@outlook.com';
}
