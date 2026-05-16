import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
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
  readonly caption: string;
  readonly mode?: AcademicDirectoryMode;
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
  private readonly route = inject(ActivatedRoute);

  readonly query = signal('');
  readonly totals = ACADEMIC_ARCHITECTURE_TOTALS;

  readonly academicNav: readonly AcademicNavLink[] = [
    { label: 'Overview', route: '/academics', icon: 'fa-compass', caption: 'Academic front door' },
    { label: 'Colleges', route: '/academics/colleges', icon: 'fa-building-columns', caption: 'Top-level homes', mode: 'colleges' },
    { label: 'Schools', route: '/academics/schools', icon: 'fa-sitemap', caption: 'Academic methods', mode: 'schools' },
    { label: 'Departments', route: '/academics/departments', icon: 'fa-layer-group', caption: 'Teaching units', mode: 'departments' },
    { label: 'Research', route: '/academics/research-institutes', icon: 'fa-flask', caption: 'Institutes and labs', mode: 'research' },
  ];

  readonly mode = toSignal(
    this.route.data.pipe(map((data) => (data['mode'] as AcademicDirectoryMode | undefined) ?? 'colleges')),
    { initialValue: 'colleges' as AcademicDirectoryMode },
  );

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
          lead: 'Every school is shown with its parent college and departments, so the structure remains readable without compressing the whole university into one page.',
          count: this.totals.schools,
          label: 'schools',
          placeholder: 'Search by school, college, or department',
        };
      case 'departments':
        return {
          eyebrow: 'Departments directory',
          title: 'Departments are where curriculum, teaching, and research ownership becomes precise.',
          lead: 'Browse the full departmental layer across the colleges and schools. Each department keeps its academic context visible.',
          count: this.totals.departments,
          label: 'departments',
          placeholder: 'Search by department, school, or college',
        };
      case 'research':
        return {
          eyebrow: 'Research institutes',
          title: 'Research has its own architecture, beyond the programme catalogue.',
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
          lead: 'Each college opens into schools, departments, programmes, and research alignment. This page gives the full list without forcing all details onto the main Academics page.',
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
}
