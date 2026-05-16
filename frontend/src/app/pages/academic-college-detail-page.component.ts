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
  readonly icon: string;
  readonly items: readonly string[];
}

interface ProgrammeGroup {
  readonly title: string;
  readonly icon: string;
  readonly summary: string;
  readonly items: readonly string[];
}

interface AcademicNavLink {
  readonly label: string;
  readonly route: string | readonly string[];
  readonly icon: string;
  readonly caption: string;
  readonly active?: boolean;
}

interface JourneyStep {
  readonly step: string;
  readonly title: string;
  readonly text: string;
  readonly icon: string;
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

  readonly academicNav: readonly AcademicNavLink[] = [
    { label: 'Overview', route: '/academics', icon: 'fa-compass', caption: 'Academic front door' },
    { label: 'Colleges', route: '/academics/colleges', icon: 'fa-building-columns', caption: 'Top-level homes', active: true },
    { label: 'Schools', route: '/academics/schools', icon: 'fa-sitemap', caption: 'Academic methods' },
    { label: 'Departments', route: '/academics/departments', icon: 'fa-layer-group', caption: 'Teaching units' },
    { label: 'Research', route: '/academics/research-institutes', icon: 'fa-flask', caption: 'Institutes and labs' },
  ];

  readonly journeySteps: readonly JourneyStep[] = [
    { step: '01', title: 'College', text: 'Choose the academic home that holds the broad question.', icon: 'fa-building-columns' },
    { step: '02', title: 'Schools', text: 'Enter the disciplinary method layer inside that college.', icon: 'fa-sitemap' },
    { step: '03', title: 'Departments', text: 'See where curriculum, teaching, and research ownership sit.', icon: 'fa-layer-group' },
    { step: '04', title: 'Programmes', text: 'Open awards and continue into programme detail pages.', icon: 'fa-graduation-cap' },
  ];

  readonly college = computed<AcademicArchitectureCollege | undefined>(() =>
    ACADEMIC_ARCHITECTURE_COLLEGES.find((college) => this.slugify(college.name) === this.slug()),
  );

  readonly departmentCount = computed(() =>
    this.college()?.schoolStructure.reduce((total, school) => total + school.departments.length, 0) ?? 0,
  );

  readonly programmeGroups = computed<readonly ProgrammeGroup[]>(() => {
    const programmes = this.college()?.programmes ?? [];
    return [
      {
        title: 'Certificate programmes',
        icon: 'fa-certificate',
        summary: 'Short academic entry points and focused competency routes.',
        items: programmes.filter((item) => item.startsWith('Certificate')),
      },
      {
        title: 'Diploma programmes',
        icon: 'fa-scroll',
        summary: 'Practice-facing award routes for foundational and applied study.',
        items: programmes.filter((item) => item.startsWith('Diploma')),
      },
      {
        title: 'Bachelor programmes',
        icon: 'fa-graduation-cap',
        summary: 'Full undergraduate degrees that lead into professional and research identity.',
        items: programmes.filter((item) => item.startsWith('Bachelor') || item.startsWith('BA') || item.startsWith('BSc') || item.startsWith('BBA') || item.startsWith('BEd') || item.startsWith('BPharm') || item.startsWith('LLB') || item.startsWith('MBChB')),
      },
      {
        title: 'Master programmes',
        icon: 'fa-user-graduate',
        summary: 'Advanced postgraduate pathways connected to institutes and field work.',
        items: programmes.filter((item) => item.startsWith('Master') || item.startsWith('MA') || item.startsWith('MSc')),
      },
      {
        title: 'Doctoral programmes',
        icon: 'fa-microscope',
        summary: 'Original research pathways shaped by departments and institutes.',
        items: programmes.filter((item) => item.startsWith('PhD')),
      },
    ].filter((group) => group.items.length);
  });

  readonly unitGroups = computed<readonly UnitGroup[]>(() => {
    const college = this.college();
    if (!college) return [];

    return [
      { title: 'Research institutes', icon: 'fa-flask', items: [college.researchInstitute] },
      { title: 'Centres of excellence', icon: 'fa-star', items: college.centresOfExcellence ?? [] },
      { title: 'Laboratories', icon: 'fa-vial', items: college.laboratories ?? [] },
      { title: 'Observatories', icon: 'fa-binoculars', items: college.observatories ?? [] },
      { title: 'Clinics', icon: 'fa-hand-holding-heart', items: college.clinics ?? [] },
      { title: 'Archives', icon: 'fa-box-archive', items: college.archives ?? [] },
      { title: 'Missions', icon: 'fa-route', items: college.missions ?? [] },
      { title: 'Specialized units', icon: 'fa-cubes-stacked', items: college.specializedUnits ?? [] },
    ].filter((group) => group.items.length);
  });

  featuredSchools(count = 4): readonly string[] {
    return this.college()?.schools.slice(0, count) ?? [];
  }

  programmeRoute(programme: string): readonly string[] {
    return ['/programmes', this.slugify(programme)];
  }

  slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
