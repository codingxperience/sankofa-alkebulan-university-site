import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RevealDirective } from '../directives/reveal.directive';
import {
  ACADEMIC_ARCHITECTURE_COLLEGES,
  type AcademicArchitectureCollege,
} from '../university/academic-architecture';

interface UnitGroup {
  readonly title: string;
  readonly items: readonly string[];
}

interface ProgrammeGroup {
  readonly title: string;
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

  readonly college = computed<AcademicArchitectureCollege | undefined>(() =>
    ACADEMIC_ARCHITECTURE_COLLEGES.find((college) => this.slugify(college.name) === this.slug()),
  );

  readonly departmentCount = computed(() =>
    this.college()?.schoolStructure.reduce((total, school) => total + school.departments.length, 0) ?? 0,
  );

  readonly programmeGroups = computed<readonly ProgrammeGroup[]>(() => {
    const programmes = this.college()?.programmes ?? [];
    return [
      { title: 'Certificate programmes', items: programmes.filter((item) => item.startsWith('Certificate')) },
      { title: 'Diploma programmes', items: programmes.filter((item) => item.startsWith('Diploma')) },
      {
        title: 'Bachelor programmes',
        items: programmes.filter((item) => item.startsWith('Bachelor') || item.startsWith('BA') || item.startsWith('BSc') || item.startsWith('BBA') || item.startsWith('BEd') || item.startsWith('BPharm') || item.startsWith('LLB') || item.startsWith('MBChB')),
      },
      { title: 'Master programmes', items: programmes.filter((item) => item.startsWith('Master') || item.startsWith('MA') || item.startsWith('MSc')) },
      { title: 'Doctoral programmes', items: programmes.filter((item) => item.startsWith('PhD')) },
    ].filter((group) => group.items.length);
  });

  readonly unitGroups = computed<readonly UnitGroup[]>(() => {
    const college = this.college();
    if (!college) return [];

    return [
      { title: 'Research institutes', items: [college.researchInstitute] },
      { title: 'Centres of excellence', items: college.centresOfExcellence ?? [] },
      { title: 'Laboratories', items: college.laboratories ?? [] },
      { title: 'Observatories', items: college.observatories ?? [] },
      { title: 'Clinics', items: college.clinics ?? [] },
      { title: 'Archives', items: college.archives ?? [] },
      { title: 'Missions', items: college.missions ?? [] },
      { title: 'Specialized units', items: college.specializedUnits ?? [] },
    ].filter((group) => group.items.length);
  });

  slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
