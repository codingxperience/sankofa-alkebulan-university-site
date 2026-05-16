import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RevealDirective } from '../directives/reveal.directive';
import {
  ACADEMIC_ARCHITECTURE_COLLEGES,
  type AcademicArchitectureCollege,
} from '../university/academic-architecture';
import {
  ACADEMIC_HERO_VISUALS,
  academicIconForName,
  schoolRoute,
  slugifyAcademic,
} from '../university/academic-navigation';

interface UnitGroup {
  readonly title: string;
  readonly icon: string;
  readonly items: readonly string[];
}

@Component({
  selector: 'app-academic-college-detail-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './academic-college-detail-page.component.html',
  styleUrl: './academic-college-detail-page.component.scss',
})
export class AcademicCollegeDetailPageComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')), {
    initialValue: '',
  });

  readonly heroIndex = signal(0);
  readonly heroVisuals = ACADEMIC_HERO_VISUALS;
  readonly heroVisual = computed(() => this.heroVisuals[this.heroIndex() % this.heroVisuals.length]);

  readonly college = computed<AcademicArchitectureCollege | undefined>(() =>
    ACADEMIC_ARCHITECTURE_COLLEGES.find((college) => slugifyAcademic(college.name) === this.slug()),
  );

  readonly departmentCount = computed(() =>
    this.college()?.schoolStructure.reduce((total, school) => total + school.departments.length, 0) ?? 0,
  );

  readonly unitGroups = computed<readonly UnitGroup[]>(() => {
    const college = this.college();
    if (!college) return [];

    return [
      { title: 'Research institute', icon: 'fa-flask', items: [college.researchInstitute] },
      { title: 'Centres of excellence', icon: 'fa-star', items: college.centresOfExcellence ?? [] },
      { title: 'Laboratories', icon: 'fa-vial', items: college.laboratories ?? [] },
      { title: 'Observatories', icon: 'fa-binoculars', items: college.observatories ?? [] },
      { title: 'Clinics', icon: 'fa-hand-holding-heart', items: college.clinics ?? [] },
      { title: 'Archives', icon: 'fa-box-archive', items: college.archives ?? [] },
      { title: 'Missions', icon: 'fa-route', items: college.missions ?? [] },
      { title: 'Specialized units', icon: 'fa-cubes-stacked', items: college.specializedUnits ?? [] },
    ].filter((group) => group.items.length);
  });

  nextVisual(): void {
    this.heroIndex.update((index) => (index + 1) % this.heroVisuals.length);
  }

  previousVisual(): void {
    this.heroIndex.update((index) => (index + this.heroVisuals.length - 1) % this.heroVisuals.length);
  }

  setVisual(index: number): void {
    this.heroIndex.set(index);
  }

  schoolRoute(collegeName: string, schoolName: string): readonly string[] {
    return schoolRoute(collegeName, schoolName);
  }

  slugify(value: string): string {
    return slugifyAcademic(value);
  }

  iconFor(value: string): string {
    return academicIconForName(value);
  }
}