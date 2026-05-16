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
import {
  ACADEMIC_HERO_VISUALS,
  type AcademicCardVisual,
  academicImageForName,
  academicIconForName,
  collegeRoute as buildCollegeRoute,
  departmentRoute as buildDepartmentRoute,
  schoolRoute as buildSchoolRoute,
  slugifyAcademic,
} from '../university/academic-navigation';

type AcademicDirectoryMode = 'colleges' | 'schools' | 'departments' | 'research';

interface CollegeRow {
  readonly college: AcademicArchitectureCollege;
  readonly slug: string;
  readonly schools: number;
  readonly departments: number;
  readonly programmes: number;
  readonly image: AcademicCardVisual;
}

interface SchoolRow {
  readonly name: string;
  readonly college: string;
  readonly collegeSlug: string;
  readonly schoolSlug: string;
  readonly departments: readonly string[];
  readonly image: AcademicCardVisual;
}

interface DepartmentRow {
  readonly name: string;
  readonly school: string;
  readonly college: string;
  readonly collegeSlug: string;
  readonly schoolSlug: string;
  readonly departmentSlug: string;
  readonly image: AcademicCardVisual;
}

interface ResearchRow {
  readonly name: string;
  readonly alignedColleges: readonly string[];
  readonly image: AcademicCardVisual;
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
  readonly heroVisuals = ACADEMIC_HERO_VISUALS;

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
    image: academicImageForName(college.name),
  }));

  readonly schoolRows: readonly SchoolRow[] = ACADEMIC_ARCHITECTURE_COLLEGES.flatMap((college) =>
    college.schoolStructure.map((school) => ({
      name: school.name,
      college: college.name,
      collegeSlug: slugifyAcademic(college.name),
      schoolSlug: slugifyAcademic(school.name),
      departments: school.departments,
      image: academicImageForName(`${college.name} ${school.name}`),
    })),
  );

  readonly departmentRows: readonly DepartmentRow[] = ACADEMIC_ARCHITECTURE_COLLEGES.flatMap((college) =>
    college.schoolStructure.flatMap((school) =>
      school.departments.map((department) => ({
        name: department,
        school: school.name,
        college: college.name,
        collegeSlug: slugifyAcademic(college.name),
        schoolSlug: slugifyAcademic(school.name),
        departmentSlug: slugifyAcademic(department),
        image: academicImageForName(`${college.name} ${school.name} ${department}`),
      })),
    ),
  );

  readonly researchRows: readonly ResearchRow[] = ACADEMIC_RESEARCH_INSTITUTES.map((name) => ({
    name,
    alignedColleges: ACADEMIC_ARCHITECTURE_COLLEGES
      .filter((college) => college.researchInstitute === name || college.researchAlignment === name)
      .map((college) => college.name),
    image: academicImageForName(name),
  }));

  readonly config = computed(() => {
    switch (this.mode()) {
      case 'schools':
        return {
          eyebrow: 'Schools directory',
          title: 'Schools give each college its method.',
          lead: 'Choose a school, then enter the departments that hold teaching, research, and programme pathways.',
          count: this.totals.schools,
          label: 'schools',
          placeholder: 'Search by school, college, or department',
        };
      case 'departments':
        return {
          eyebrow: 'Departments directory',
          title: 'Departments hold the work.',
          lead: 'A department is where the subject becomes curriculum, supervision, research, and a path into programmes.',
          count: this.totals.departments,
          label: 'departments',
          placeholder: 'Search by department, school, or college',
        };
      case 'research':
        return {
          eyebrow: 'Research institutes',
          title: 'Research is a public instrument.',
          lead: 'Institutes carry inquiry beyond the classroom into publication, policy, innovation, and continental service.',
          count: this.totals.researchInstitutes,
          label: 'institutes',
          placeholder: 'Search by institute or aligned college',
        };
      case 'colleges':
      default:
        return {
          eyebrow: 'Colleges directory',
          title: 'Choose the question, then the college.',
          lead: 'Each college holds a field of responsibility. From there, the route moves to schools, departments, and live programme pages.',
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

  nextVisual(): void {
    this.heroIndex.update((index) => (index + 1) % this.heroVisuals.length);
  }

  previousVisual(): void {
    this.heroIndex.update((index) => (index + this.heroVisuals.length - 1) % this.heroVisuals.length);
  }

  setVisual(index: number): void {
    this.heroIndex.set(index);
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
    return slugifyAcademic(value);
  }

  collegeIcon(row: CollegeRow): string {
    return academicIconForName(row.college.name);
  }

  schoolIcon(row: SchoolRow): string {
    return academicIconForName(row.name);
  }

  departmentIcon(row: DepartmentRow): string {
    return academicIconForName(row.name);
  }

  collegeRoute(name: string): readonly string[] {
    return buildCollegeRoute(name);
  }

  schoolRoute(collegeName: string, schoolName: string): readonly string[] {
    return buildSchoolRoute(collegeName, schoolName);
  }

  departmentRoute(collegeName: string, schoolName: string, departmentName: string): readonly string[] {
    return buildDepartmentRoute(collegeName, schoolName, departmentName);
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
