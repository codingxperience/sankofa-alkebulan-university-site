import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DEPARTMENT_PAGES,
  DepartmentPage,
  ProgramDetail,
  getDepartmentPageLabel,
} from '../university/department-pages';

type PrimaryTab = 'programmes' | 'heads' | 'staff';

interface ProgramSection extends ProgramDetail {
  readonly anchor: string;
  readonly levelKey: string;
}

@Component({
  selector: 'app-department-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './department-page.component.html',
  styleUrls: ['./department-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  readonly slug = computed(() => {
    const routeSlug = this.paramMap().get('slug');
    if (routeSlug) {
      return routeSlug;
    }

    const dataSlug = this.routeData()['slug'];
    return typeof dataSlug === 'string' ? dataSlug : '';
  });

  readonly page = computed(() => {
    const slug = this.slug();
    return DEPARTMENT_PAGES.find((page) => page.slug === slug) ?? null;
  });

  readonly pageLabel = computed(() => {
    const page = this.page();
    if (!page) {
      return 'Department';
    }

    return getDepartmentPageLabel(page);
  });

  readonly pageType = computed(() => {
    const label = this.pageLabel().toLowerCase();
    return label.includes('institute') ? 'Institute' : 'School';
  });

  readonly leaderRole = computed(() => (this.pageType() === 'Institute' ? 'Director' : 'Dean'));

  readonly leaderOfficeLabel = computed(() => `Office of the ${this.leaderRole()}`);

  readonly leaderTitle = computed(() => `${this.leaderRole()}, ${this.pageLabel()}`);

  readonly leadershipImagePath = computed(() =>
    this.pageType() === 'Institute'
      ? '/assets/hero/hero-lab-source.jpg'
      : '/assets/hero/hero-campus-source.jpg',
  );

  readonly introParagraphs = computed<readonly string[]>(() => {
    const page = this.page();
    if (!page) {
      return [];
    }

    return [
      `Sankofa Alkebulan University ${this.pageLabel()} advances teaching, applied learning, research, and leadership formation across its academic units.`,
      page.overview,
      `Students benefit from ${page.departments.length} departments and ${page.featuredDepartment.programs.length} featured programmes designed for rigorous study, innovation, and service.`,
    ];
  });

  readonly visionStatement = computed(() => {
    const page = this.page();
    if (!page) {
      return '';
    }

    return `To be a leading ${this.pageType().toLowerCase()} for transformative teaching, applied research, and innovation that strengthens African communities and institutions.`;
  });

  readonly missionStatement = computed(() => {
    const page = this.page();
    if (!page) {
      return '';
    }

    return `To prepare graduates and researchers through high-quality instruction, ethical leadership formation, and community-responsive practice across ${page.departments.length} departments and ${page.featuredDepartment.programs.length} featured programmes.`;
  });

  readonly activePrimaryTab = signal<PrimaryTab>('programmes');
  readonly activeDepartment = signal('');

  readonly departmentTabs = computed<readonly string[]>(() => {
    const page = this.page();
    if (!page) {
      return [];
    }

    const featured = page.featuredDepartment.name;
    const departments = [...page.departments];

    if (!departments.includes(featured)) {
      return [featured, ...departments];
    }

    return [featured, ...departments.filter((department) => department !== featured)];
  });

  readonly featuredDepartmentName = computed(() => this.page()?.featuredDepartment.name ?? '');

  readonly programSections = computed<readonly ProgramSection[]>(() => {
    const page = this.page();
    if (!page) {
      return [];
    }

    return page.featuredDepartment.programs.map((program) => ({
      ...program,
      anchor: this.toAnchor(program.title),
      levelKey: this.resolveLevel(program),
    }));
  });

  readonly departmentProgrammeNotice = computed(() => {
    const activeDepartment = this.activeDepartment();
    const featuredDepartment = this.featuredDepartmentName();
    if (!activeDepartment || !featuredDepartment || activeDepartment === featuredDepartment) {
      return '';
    }

    return `Programme tables for ${activeDepartment} are being consolidated. The currently published programme list highlights ${featuredDepartment}.`;
  });

  readonly programmeGroups = computed(() => {
    if (this.departmentProgrammeNotice()) {
      return [];
    }

    const order = [
      'phd',
      'masters',
      'postgraduate-diploma',
      'bachelors',
      'diploma',
      'certificate',
    ];
    const labels: Record<string, string> = {
      phd: 'Doctoral Programmes',
      masters: 'Masters Degree Programmes',
      'postgraduate-diploma': 'Postgraduate Diploma Programmes',
      bachelors: 'Undergraduate Degree Programmes',
      diploma: 'Undergraduate Diploma Programmes',
      certificate: 'Certificate Programmes',
    };

    return order
      .map((levelKey) => ({
        id: levelKey,
        title: labels[levelKey],
        programmes: this.programSections().filter((program) => program.levelKey === levelKey),
      }))
      .filter((group) => group.programmes.length);
  });

  readonly headProfiles = computed(() => {
    if (!this.page()) {
      return [];
    }

    return this.departmentTabs().map((department) => ({
      title: department,
      subtitle: 'Head of Department',
      description: `Leadership for ${department} supports academic quality, student guidance, and programme delivery within ${this.pageLabel()}.`,
    }));
  });

  readonly academicStaffProfiles = computed(() => {
    if (!this.page()) {
      return [];
    }

    return this.departmentTabs().map((department) => ({
      title: department,
      subtitle: 'Academic Staff',
      description: `Academic staff in ${department} contribute to teaching, mentorship, supervision, and practice-based learning within ${this.pageLabel()}.`,
    }));
  });

  constructor() {
    effect(() => {
      const departmentTabs = this.departmentTabs();
      this.page();
      this.activePrimaryTab.set('programmes');
      this.activeDepartment.set(departmentTabs[0] ?? '');
    });
  }

  setPrimaryTab(tab: PrimaryTab) {
    this.activePrimaryTab.set(tab);
  }

  setActiveDepartment(department: string) {
    this.activeDepartment.set(department);
  }

  private toAnchor(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private resolveLevel(program: ProgramDetail): string {
    const title = program.title.toLowerCase();
    if (title.includes('phd') || title.includes('doctor of philosophy')) {
      return 'phd';
    }
    if (title.includes('master')) {
      return 'masters';
    }
    if (title.includes('postgraduate diploma')) {
      return 'postgraduate-diploma';
    }
    if (title.includes('bachelor')) {
      return 'bachelors';
    }
    if (title.includes('diploma')) {
      return 'diploma';
    }
    if (title.includes('certificate')) {
      return 'certificate';
    }
    return 'bachelors';
  }

  getProgramDetailPath(program: ProgramDetail): string {
    return `/home/${this.resolveLevel(program)}/${this.toAnchor(program.title)}`;
  }
}
