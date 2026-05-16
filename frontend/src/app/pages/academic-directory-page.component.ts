import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { RevealDirective } from '../directives/reveal.directive';
import {
  ACADEMIC_ARCHITECTURE_COLLEGES,
  ACADEMIC_ARCHITECTURE_TOTALS,
  type AcademicArchitectureCollege,
} from '../university/academic-architecture';
import { ACADEMIC_RESEARCH_INSTITUTES } from '../university/academic-departments';

type AcademicDirectoryMode = 'colleges' | 'schools' | 'departments' | 'research';

interface AcademicNavLink {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly mode: AcademicDirectoryMode;
}

interface HeroVisual {
  readonly src: string;
  readonly alt: string;
  readonly label: string;
  readonly credit: string;
}

interface CollegeRow {
  readonly college: AcademicArchitectureCollege;
  readonly slug: string;
  readonly schools: number;
  readonly departments: number;
  readonly programmes: number;
}

interface SchoolRow {
  readonly name: string;
  readonly college: string;
  readonly collegeSlug: string;
  readonly departments: readonly string[];
}

interface DepartmentRow {
  readonly name: string;
  readonly school: string;
  readonly college: string;
  readonly collegeSlug: string;
}

interface ResearchRow {
  readonly name: string;
  readonly alignedColleges: readonly string[];
}

@Component({
  selector: 'app-academic-directory-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './academic-directory-page.component.html',
  styleUrl: './academic-directory-page.component.scss',
})
export class AcademicDirectoryPageComponent {
  private readonly router = inject(Router);

  readonly query = signal('');
  readonly heroIndex = signal(0);
  readonly totals = ACADEMIC_ARCHITECTURE_TOTALS;

  readonly academicNav: readonly AcademicNavLink[] = [
    { label: 'Colleges', route: '/academics/colleges', icon: 'fa-building-columns', mode: 'colleges' },
    { label: 'Schools', route: '/academics/schools', icon: 'fa-sitemap', mode: 'schools' },
    { label: 'Departments', route: '/academics/departments', icon: 'fa-layer-group', mode: 'departments' },
    { label: 'Research', route: '/academics/research-institutes', icon: 'fa-flask', mode: 'research' },
  ];

  readonly heroVisuals: readonly HeroVisual[] = [
    {
      src: 'https://images.pexels.com/photos/34162714/pexels-photo-34162714.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'African learners studying together in a classroom',
      label: 'Focused African learning environments',
      credit: 'Photo: Tosin Olowoleni / Pexels',
    },
    {
      src: 'https://images.pexels.com/photos/7683902/pexels-photo-7683902.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Students gathered around an outdoor campus table',
      label: 'Schools, methods, and academic community',
      credit: 'Photo: RDNE Stock project / Pexels',
    },
    {
      src: 'https://images.pexels.com/photos/7683734/pexels-photo-7683734.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'University students studying outdoors with books and tablets',
      label: 'Departments, programmes, and practice',
      credit: 'Photo: RDNE Stock project / Pexels',
    },
  ];

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly mode = computed<AcademicDirectoryMode>(() => this.modeFromUrl(this.currentUrl()));
  readonly heroVisual = computed(() => this.heroVisuals[this.heroIndex() % this.heroVisuals.length]);

  readonly collegeRows: readonly CollegeRow[] = ACADEMIC_ARCHITECTURE_COLLEGES.map((college) => ({
    college,
    slug: this.slugify(college.name),
    schools: college.schoolStructure.length,
    departments: college.schoolStructure.reduce((total, school) => total + school.departments.length, 0),
    programmes: college.programmes.length,
  }));

  readonly schoolRows: readonly SchoolRow[] = ACADEMIC_ARCHITECTURE_COLLEGES.flatMap((college) =>
    college.schoolStructure.map((school) => ({
      name: school.name,
      college: college.name,
      collegeSlug: this.slugify(college.name),
      departments: school.departments,
    })),
  );

  readonly departmentRows: readonly DepartmentRow[] = ACADEMIC_ARCHITECTURE_COLLEGES.flatMap((college) =>
    college.schoolStructure.flatMap((school) =>
      school.departments.map((department) => ({
        name: department,
        school: school.name,
        college: college.name,
        collegeSlug: this.slugify(college.name),
      })),
    ),
  );

  readonly researchRows: readonly ResearchRow[] = ACADEMIC_RESEARCH_INSTITUTES.map((name) => ({
    name,
    alignedColleges: ACADEMIC_ARCHITECTURE_COLLEGES
      .filter((college) => college.researchInstitute === name || college.researchAlignment === name)
      .map((college) => college.name),
  }));

  readonly config = computed(() => {
    switch (this.mode()) {
      case 'schools':
        return {
          eyebrow: 'Schools directory',
          title: 'Schools translate colleges into teachable academic worlds.',
          lead: 'Schools are listed as academic chapters under their parent colleges. Open the college when you want the full schools, departments, programmes, and research connection.',
          count: this.totals.schools,
          label: 'schools',
          placeholder: 'Search by school, college, or department',
        };
      case 'departments':
        return {
          eyebrow: 'Departments directory',
          title: 'Departments make the academic system precise.',
          lead: 'Departments are shown with their school and college context, so the user knows exactly where curriculum ownership sits before moving into programmes.',
          count: this.totals.departments,
          label: 'departments',
          placeholder: 'Search by department, school, or college',
        };
      case 'research':
        return {
          eyebrow: 'Research institutes',
          title: 'Research has its own architecture beyond the programme catalogue.',
          lead: 'Institutes carry advanced research, policy advisory work, publication, innovation, and cross-college collaboration.',
          count: this.totals.researchInstitutes,
          label: 'institutes',
          placeholder: 'Search by institute or aligned college',
        };
      case 'colleges':
      default:
        return {
          eyebrow: 'Colleges directory',
          title: 'Colleges are the first layer of the Sankofa academic estate.',
          lead: 'Start with a college, then move into its schools, departments, programmes, and research institutes from one coherent detail page.',
          count: this.totals.colleges,
          label: 'colleges',
          placeholder: 'Search by college, school, programme, or institute',
        };
    }
  });

  readonly filteredColleges = computed(() =>
    this.collegeRows.filter((row) =>
      this.matches([
        row.college.name,
        row.college.schools.join(' '),
        row.college.programmes.join(' '),
        row.college.researchInstitute,
      ].join(' ')),
    ),
  );

  readonly filteredSchools = computed(() =>
    this.schoolRows.filter((row) => this.matches(`${row.name} ${row.college} ${row.departments.join(' ')}`)),
  );

  readonly filteredDepartments = computed(() =>
    this.departmentRows.filter((row) => this.matches(`${row.name} ${row.school} ${row.college}`)),
  );

  readonly filteredResearch = computed(() =>
    this.researchRows.filter((row) => this.matches(`${row.name} ${row.alignedColleges.join(' ')}`)),
  );

  setSearch(value: string): void {
    this.query.set(value);
  }

  clearSearch(): void {
    this.query.set('');
  }

  isNavActive(item: AcademicNavLink): boolean {
    return item.mode === this.mode();
  }

  nextVisual(): void {
    this.heroIndex.update((index) => (index + 1) % this.heroVisuals.length);
  }

  previousVisual(): void {
    this.heroIndex.update((index) => (index + this.heroVisuals.length - 1) % this.heroVisuals.length);
  }

  visibleCount(): number {
    switch (this.mode()) {
      case 'schools':
        return this.filteredSchools().length;
      case 'departments':
        return this.filteredDepartments().length;
      case 'research':
        return this.filteredResearch().length;
      case 'colleges':
      default:
        return this.filteredColleges().length;
    }
  }

  slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  collegeIcon(row: CollegeRow): string {
    const name = row.college.name.toLowerCase();
    if (name.includes('health') || name.includes('medicine') || name.includes('pharmaceutical')) return 'fa-heart-pulse';
    if (name.includes('computing') || name.includes('data') || name.includes('digital') || name.includes('robotics')) return 'fa-microchip';
    if (name.includes('law') || name.includes('governance') || name.includes('diplomacy')) return 'fa-scale-balanced';
    if (name.includes('agriculture') || name.includes('food') || name.includes('climate') || name.includes('environment')) return 'fa-leaf';
    if (name.includes('divine') || name.includes('religion') || name.includes('spiritual')) return 'fa-dove';
    if (name.includes('arts') || name.includes('media') || name.includes('languages')) return 'fa-palette';
    return 'fa-building-columns';
  }

  preview(items: readonly string[], count = 4): readonly string[] {
    return items.slice(0, count);
  }

  remaining(items: readonly string[], count = 4): number {
    return Math.max(items.length - count, 0);
  }

  private matches(text: string): boolean {
    const term = this.query().trim().toLowerCase();
    return !term || text.toLowerCase().includes(term);
  }

  private modeFromUrl(url: string): AcademicDirectoryMode {
    if (url.includes('/academics/schools')) return 'schools';
    if (url.includes('/academics/departments')) return 'departments';
    if (url.includes('/academics/research-institutes')) return 'research';
    return 'colleges';
  }
}
