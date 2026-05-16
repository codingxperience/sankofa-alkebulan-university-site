import { Component, computed, inject, signal } from '@angular/core';
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
  readonly active?: boolean;
}

interface HeroVisual {
  readonly src: string;
  readonly alt: string;
  readonly label: string;
  readonly credit: string;
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

  readonly academicNav: readonly AcademicNavLink[] = [
    { label: 'Colleges', route: '/academics/colleges', icon: 'fa-building-columns', active: true },
    { label: 'Schools', route: '/academics/schools', icon: 'fa-sitemap' },
    { label: 'Departments', route: '/academics/departments', icon: 'fa-layer-group' },
    { label: 'Research', route: '/academics/research-institutes', icon: 'fa-flask' },
  ];

  readonly heroVisuals: readonly HeroVisual[] = [
    {
      src: 'https://images.pexels.com/photos/34162714/pexels-photo-34162714.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'African learners studying together in a classroom',
      label: 'Schools, departments, programmes',
      credit: 'Photo: Tosin Olowoleni / Pexels',
    },
    {
      src: 'https://images.pexels.com/photos/7683902/pexels-photo-7683902.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Students collaborating around an outdoor campus table',
      label: 'Academic community and method',
      credit: 'Photo: RDNE Stock project / Pexels',
    },
    {
      src: 'https://images.pexels.com/photos/7683734/pexels-photo-7683734.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Students studying outdoors with books and digital tools',
      label: 'From college to programme detail',
      credit: 'Photo: RDNE Stock project / Pexels',
    },
  ];

  readonly heroVisual = computed(() => this.heroVisuals[this.heroIndex() % this.heroVisuals.length]);

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

  nextVisual(): void {
    this.heroIndex.update((index) => (index + 1) % this.heroVisuals.length);
  }

  previousVisual(): void {
    this.heroIndex.update((index) => (index + this.heroVisuals.length - 1) % this.heroVisuals.length);
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
