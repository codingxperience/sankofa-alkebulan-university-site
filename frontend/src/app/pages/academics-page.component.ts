import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../directives/reveal.directive';
import {
  ACADEMIC_ARCHITECTURE_COLLEGES,
  ACADEMIC_ARCHITECTURE_TOTALS,
  type AcademicArchitectureCollege,
} from '../university/academic-architecture';
import { ACADEMIC_RESEARCH_INSTITUTES } from '../university/academic-departments';

interface AcademicDomain {
  readonly label: string;
  readonly description: string;
  readonly ids: readonly number[];
}

interface UnitGroup {
  readonly label: string;
  readonly items: readonly string[];
}

const ACADEMIC_DOMAINS: readonly AcademicDomain[] = [
  {
    label: 'Science and computation',
    description: 'Mathematics, physical science, life science, data, AI, robotics, and space systems.',
    ids: [1, 2, 3, 4, 5, 17, 18, 19, 20, 48],
  },
  {
    label: 'Health and earth futures',
    description: 'Medicine, public health, food systems, climate, environment, water, energy, and human wellbeing.',
    ids: [6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 39, 40, 41, 43, 45, 46],
  },
  {
    label: 'Governance and enterprise',
    description: 'Law, policy, diplomacy, security, leadership, finance, business, logistics, and institutional systems.',
    ids: [21, 22, 23, 24, 25, 26, 27, 28, 29, 47],
  },
  {
    label: 'Civilisation, culture, and sacred knowledge',
    description: 'Humanities, indigenous knowledge, religion, languages, arts, media, tourism, and divine wisdom.',
    ids: [30, 31, 32, 33, 34, 35, 36, 44, 49, 50],
  },
  {
    label: 'Built worlds and mobility',
    description: 'Engineering, architecture, cities, transport, maritime systems, infrastructure, and applied futures.',
    ids: [14, 37, 38, 42],
  },
] as const;

@Component({
  selector: 'app-academics-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './academics-page.component.html',
  styleUrl: './academics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicsPageComponent {
  readonly colleges = ACADEMIC_ARCHITECTURE_COLLEGES;
  readonly totals = ACADEMIC_ARCHITECTURE_TOTALS;
  readonly researchInstitutes = ACADEMIC_RESEARCH_INSTITUTES;
  readonly domains = ACADEMIC_DOMAINS;

  readonly query = signal('');
  readonly activeCollegeId = signal(50);

  readonly visibleColleges = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return this.colleges;
    }

    return this.colleges.filter((college) => this.searchText(college).includes(query));
  });

  readonly activeCollege = computed(() => {
    const visible = this.visibleColleges();
    return visible.find((college) => college.id === this.activeCollegeId()) ?? visible[0] ?? this.colleges[0];
  });

  readonly heroIndex = computed(() => {
    const active = this.activeCollege();
    return [
      {
        number: '01',
        label: 'Colleges live in one source of truth',
        value: `${this.totals.colleges} colleges`,
      },
      {
        number: '02',
        label: 'Schools and departments expand per college',
        value: `${this.totals.schools} schools / ${this.totals.departments} departments`,
      },
      {
        number: '03',
        label: 'Programmes resolve into the admissions and programme-detail system',
        value: `${this.totals.programmes} programmes`,
      },
      {
        number: '04',
        label: `Open now: ${active.name}`,
        value: `${active.schoolStructure.length} schools`,
      },
    ];
  });

  readonly featuredDomain = computed(() =>
    this.domains.find((domain) => domain.ids.includes(this.activeCollege().id)) ?? this.domains[0],
  );

  setSearch(value: string) {
    this.query.set(value);
  }

  setActiveCollege(id: number) {
    this.activeCollegeId.set(id);
  }

  clearSearch() {
    this.query.set('');
  }

  collegeMeta(college: AcademicArchitectureCollege) {
    const departmentCount = college.schoolStructure.reduce((total, school) => total + school.departments.length, 0);
    return `${college.schoolStructure.length} schools / ${departmentCount} departments / ${college.programmes.length} programmes`;
  }

  programmePath(programme: string) {
    return ['/programmes', this.slugify(programme)];
  }

  preview<T>(items: readonly T[], count: number): readonly T[] {
    return items.slice(0, count);
  }

  remainingCount(items: readonly unknown[], count: number) {
    return Math.max(items.length - count, 0);
  }

  unitGroups(college: AcademicArchitectureCollege): readonly UnitGroup[] {
    return [
      { label: 'Centres of Excellence', items: college.centresOfExcellence ?? [] },
      { label: 'Laboratories', items: college.laboratories ?? [] },
      { label: 'Observatories', items: college.observatories ?? [] },
      { label: 'Clinics', items: college.clinics ?? [] },
      { label: 'Archives', items: college.archives ?? [] },
      { label: 'Missions', items: college.missions ?? [] },
      { label: 'Specialized Units', items: college.specializedUnits ?? [] },
    ].filter((group) => group.items.length);
  }

  private searchText(college: AcademicArchitectureCollege) {
    return [
      college.name,
      college.researchInstitute,
      ...college.schools,
      ...college.programmes,
      ...college.schoolStructure.flatMap((school) => [school.name, ...school.departments]),
      ...(college.centresOfExcellence ?? []),
      ...(college.laboratories ?? []),
      ...(college.observatories ?? []),
      ...(college.clinics ?? []),
      ...(college.archives ?? []),
      ...(college.missions ?? []),
      ...(college.specializedUnits ?? []),
    ]
      .join(' ')
      .toLowerCase();
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
