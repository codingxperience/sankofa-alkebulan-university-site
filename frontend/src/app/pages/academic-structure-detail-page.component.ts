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
  type AcademicCardVisual,
  academicImageForName,
  academicIconForName,
  departmentRoute as buildDepartmentRoute,
  programmeDuration,
  programmeLevel,
  programmeRoute as buildProgrammeRoute,
  programmeSummary,
  programmesForAcademicNode,
  schoolRoute as buildSchoolRoute,
  slugifyAcademic,
} from '../university/academic-navigation';
import type { AcademicArchitectureSchool } from '../university/academic-departments';

type StructureView = 'school' | 'department';

interface ProgrammeCard {
  readonly title: string;
  readonly level: string;
  readonly duration: string;
  readonly summary: string;
  readonly route: readonly string[];
  readonly icon: string;
  readonly image: AcademicCardVisual;
}

interface DepartmentCard {
  readonly name: string;
  readonly icon: string;
  readonly image: AcademicCardVisual;
}

@Component({
  selector: 'app-academic-structure-detail-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './academic-structure-detail-page.component.html',
  styleUrl: './academic-structure-detail-page.component.scss',
})
export class AcademicStructureDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap.pipe(map((params) => params)), {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly visuals = ACADEMIC_HERO_VISUALS;
  readonly heroIndex = signal(1);
  readonly heroVisual = computed(() => this.visuals[this.heroIndex() % this.visuals.length]);

  readonly college = computed<AcademicArchitectureCollege | undefined>(() => {
    const slug = this.params().get('slug') ?? '';
    return ACADEMIC_ARCHITECTURE_COLLEGES.find((college) => slugifyAcademic(college.name) === slug);
  });

  readonly school = computed<AcademicArchitectureSchool | undefined>(() => {
    const schoolSlug = this.params().get('schoolSlug') ?? '';
    return this.college()?.schoolStructure.find((school) => slugifyAcademic(school.name) === schoolSlug);
  });

  readonly departmentName = computed(() => {
    const departmentSlug = this.params().get('departmentSlug') ?? '';
    return this.school()?.departments.find((department) => slugifyAcademic(department) === departmentSlug);
  });

  readonly view = computed<StructureView>(() => (this.departmentName() ? 'department' : 'school'));

  readonly matchedProgrammes = computed<readonly string[]>(() => {
    const college = this.college();
    const school = this.school();
    if (!college || !school) return [];
    return programmesForAcademicNode(college.programmes, school.name, this.departmentName());
  });

  readonly departmentCards = computed<readonly DepartmentCard[]>(() => {
    const college = this.college();
    const school = this.school();
    if (!college || !school) return [];
    return school.departments.map((department) => ({
      name: department,
      icon: academicIconForName(department),
      image: academicImageForName(`${college.name} ${school.name} ${department}`),
    }));
  });

  readonly programmeCards = computed<readonly ProgrammeCard[]>(() => {
    const college = this.college();
    if (!college) return [];
    return this.matchedProgrammes().map((programme) => ({
      title: programme,
      level: programmeLevel(programme),
      duration: programmeDuration(programme),
      summary: programmeSummary(programme, college.name),
      route: buildProgrammeRoute(programme),
      icon: academicIconForName(programme),
      image: academicImageForName(`${college.name} ${programme}`),
    }));
  });

  readonly title = computed(() => this.departmentName() ?? this.school()?.name ?? 'Academic structure');

  readonly lead = computed(() => {
    const college = this.college();
    const school = this.school();
    const department = this.departmentName();
    if (!college || !school) return '';
    if (department) {
      return `${department} turns the subject into curriculum, supervision, research, and public work. Programme pathways continue below.`;
    }
    return `${school.name} gives ${college.name} its method. Choose a department to see where the work is held.`;
  });

  nextVisual(): void {
    this.heroIndex.update((index) => (index + 1) % this.visuals.length);
  }

  previousVisual(): void {
    this.heroIndex.update((index) => (index + this.visuals.length - 1) % this.visuals.length);
  }

  setVisual(index: number): void {
    this.heroIndex.set(index);
  }

  schoolRoute(collegeName: string, schoolName: string): readonly string[] {
    return buildSchoolRoute(collegeName, schoolName);
  }

  departmentRoute(collegeName: string, schoolName: string, departmentName: string): readonly string[] {
    return buildDepartmentRoute(collegeName, schoolName, departmentName);
  }

  programmeRoute(programme: string): readonly string[] {
    return buildProgrammeRoute(programme);
  }

  iconFor(value: string): string {
    return academicIconForName(value);
  }

  slugify(value: string): string {
    return slugifyAcademic(value);
  }
}
