import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DEPARTMENT_PAGES,
  DepartmentPage,
  ProgramDetail,
  getDepartmentPageLabel,
  getDepartmentPagePath,
} from '../university/department-pages';

interface ProgramSection {
  readonly id: string;
  readonly title: string;
  readonly type: 'text' | 'list' | 'table';
}

interface ProgramMatch {
  readonly page: DepartmentPage;
  readonly program: ProgramDetail;
}

interface ProgramFact {
  readonly label: string;
  readonly value: string;
}

interface OverviewPoint {
  readonly title: string;
  readonly description: string;
}

interface CurriculumRow {
  readonly stage: string;
  readonly item: string;
  readonly showStage: boolean;
}

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './program-detail.component.html',
  styleUrls: ['./program-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly programSlug = computed(() => {
    const map = this.paramMap();
    return map.get('programSlug') || map.get('slug') || map.get('id') || '';
  });

  readonly programContext = computed<ProgramMatch | null>(() => {
    const slug = this.normalizeSlug(this.programSlug());
    for (const page of DEPARTMENT_PAGES) {
      const program = page.featuredDepartment.programs.find((candidate) =>
        this.isMatchingProgram(candidate, slug),
      );
      if (program) {
        return { page, program };
      }
    }
    return null;
  });

  readonly program = computed<ProgramDetail | null>(() => this.programContext()?.program ?? null);

  readonly sourcePage = computed<DepartmentPage | null>(() => this.programContext()?.page ?? null);

  readonly level = computed(() => {
    const levelFromRoute = this.paramMap().get('level');
    if (levelFromRoute) {
      return levelFromRoute;
    }

    const program = this.program();
    if (!program) {
      return 'bachelors';
    }

    return this.resolveLevel(program);
  });

  readonly levelLabel = computed(() => {
    const level = this.level();
    const labels: Record<string, string> = {
      phd: 'PhD Programmes',
      masters: 'Masters Degree Programmes',
      'postgraduate-diploma': 'Postgraduate Diploma Programmes',
      bachelors: 'Bachelors Degree Programmes',
      diploma: 'Diploma Programmes',
      certificate: 'Certificate Programmes',
    };
    return labels[level] ?? `${level.replace('-', ' ')} Programmes`;
  });

  readonly sourcePageLabel = computed(() => {
    const page = this.sourcePage();
    return page ? getDepartmentPageLabel(page) : 'Programme Page';
  });

  readonly sourcePagePath = computed(() => {
    const page = this.sourcePage();
    return page ? getDepartmentPagePath(page) : '/home';
  });

  readonly studyLabel = computed(() => {
    const program = this.program();
    if (!program) {
      return 'this programme';
    }

    const award = program.award.trim();
    const normalizedAward = award.toLowerCase();
    if (award && !['diploma', 'certificate'].includes(normalizedAward) && award.length <= 12) {
      return award;
    }

    return program.title;
  });

  readonly overviewSectionTitle = computed(() => {
    const level = this.level();
    if (level === 'diploma' || level === 'certificate') {
      return 'Career Prospects';
    }

    return `Why Study ${this.studyLabel()} at Sankofa`;
  });

  readonly curriculumSectionTitle = computed(() => {
    const level = this.level();
    if (level === 'diploma' || level === 'certificate') {
      return 'Program Options';
    }

    return 'Program Structure';
  });

  readonly activeSection = signal('overview');

  readonly sections = computed<ProgramSection[]>(() => [
    { id: 'overview', title: this.overviewSectionTitle(), type: 'text' },
    { id: 'objectives', title: 'Programme Objectives', type: 'list' },
    { id: 'outcomes', title: 'Learning Outcomes', type: 'list' },
    { id: 'admissions', title: 'Admission Requirements', type: 'list' },
    { id: 'duration', title: 'Program Duration', type: 'text' },
    { id: 'curriculum', title: this.curriculumSectionTitle(), type: 'table' },
    { id: 'tuition', title: 'Tuition', type: 'list' },
    { id: 'contact', title: 'Request for more Information', type: 'text' },
  ]);

  readonly sectionHeading = computed(() => {
    const program = this.program();
    if (!program) {
      return '';
    }

    const active = this.activeSection();
    if (active === 'overview') {
      if (this.overviewSectionTitle() === 'Career Prospects') {
        return `Career Prospects for ${program.title}`;
      }

      return `Here's why you should choose/study ${this.studyLabel()} at Sankofa:`;
    }
    if (active === 'curriculum') {
      return this.curriculumSectionTitle();
    }
    if (active === 'contact') {
      return 'Request for more Information';
    }

    return this.sections().find((section) => section.id === active)?.title ?? 'Programme Overview';
  });

  readonly sectionIntro = computed(() => {
    const program = this.program();
    if (!program) {
      return '';
    }

    switch (this.activeSection()) {
      case 'overview':
        if (this.overviewSectionTitle() === 'Career Prospects') {
          return 'A quick view of the professional, entrepreneurial, and further-study pathways this programme can support.';
        }

        return '';
      case 'objectives':
        return '';
      case 'outcomes':
        return '';
      case 'admissions':
        return '';
      case 'duration':
        return '';
      case 'tuition':
        return '';
      case 'curriculum':
        return '';
      default:
        return 'For programme enquiries, admissions support, and guidance, use the links below or contact the university directly.';
    }
  });

  readonly overviewParagraphs = computed(() => {
    const program = this.program();
    if (!program) {
      return [];
    }

    const supporting = `Within ${this.sourcePageLabel()}, ${program.title} is designed to connect rigorous study with practical relevance, ethical leadership, and Pan-African impact.`;
    return [program.overview, supporting].filter(Boolean);
  });

  readonly programmeFacts = computed<ProgramFact[]>(() => {
    const program = this.program();
    if (!program) {
      return [];
    }

    return [
      { label: 'Award', value: program.award },
      { label: 'Programme Duration', value: program.duration },
      { label: 'School / Institute', value: this.sourcePageLabel() },
      { label: 'Tuition', value: program.tuition[0] ?? 'Contact admissions' },
    ];
  });

  readonly overviewHighlights = computed<OverviewPoint[]>(() => {
    const program = this.program();
    if (!program) {
      return [];
    }

    const level = this.level();
    if (level === 'diploma' || level === 'certificate') {
      return [
        {
          title: 'Practical Skills Development',
          description: `${program.title} is structured to build applied knowledge that can be used directly in workplaces, community projects, and entrepreneurial settings.`,
        },
        {
          title: 'Career Readiness',
          description: 'The programme supports workplace confidence through communication, problem-solving, and discipline-specific skill development.',
        },
        {
          title: 'Progression Opportunities',
          description: 'Learners are prepared for immediate professional contribution while also building a pathway into higher academic awards over time.',
        },
        {
          title: 'Industry Relevance',
          description: `Study is aligned with practical expectations within ${this.sourcePageLabel()} and wider regional labour-market needs.`,
        },
      ];
    }

    return [
      {
        title: 'Holistic Curriculum',
        description: `${this.studyLabel()} combines foundational study, applied learning, and contemporary relevance to prepare you for a changing professional landscape.`,
      },
      {
        title: 'Academic Guidance',
        description: `The programme is hosted within ${this.sourcePageLabel()}, connecting learners to structured academic support and disciplinary depth.`,
      },
      {
        title: 'Applied Learning Approach',
        description: 'Coursework is designed to move from foundational understanding toward stronger analytical, professional, and problem-solving capability.',
      },
      {
        title: 'Leadership and Service',
        description: 'The learning experience supports ethical leadership, community relevance, and meaningful contribution across African and global contexts.',
      },
      {
        title: 'Career and Further Study Readiness',
        description: 'Graduates are positioned for employment, service, entrepreneurship, and further academic progression.',
      },
    ];
  });

  readonly programmeObjectives = computed(() => {
    const program = this.program();
    if (!program) {
      return [];
    }

    if (program.objectives?.length) {
      return program.objectives;
    }

    return [
      `Build a strong foundation in ${program.title} and its practical relevance within ${this.sourcePageLabel()}.`,
      'Develop analytical, communication, and problem-solving abilities for contemporary professional contexts.',
      'Strengthen research, writing, and project execution skills needed for academic and workplace success.',
      'Prepare for ethical leadership, service, and meaningful contribution within African and global communities.',
    ];
  });

  readonly programmeOutcomes = computed(() => {
    const program = this.program();
    if (!program) {
      return [];
    }

    if (program.outcomes?.length) {
      return program.outcomes;
    }

    return [
      `Explain the main concepts, principles, and practices that define ${program.title}.`,
      'Apply knowledge and judgement to real problems, projects, and professional situations.',
      'Communicate clearly in academic, workplace, and community-facing contexts.',
      'Demonstrate ethical awareness, critical thinking, and readiness for further study or career progression.',
    ];
  });

  readonly programmeMoreInfo = computed(() => {
    const program = this.program();
    if (!program) {
      return '';
    }

    return (
      program.moreInfo ||
      `For more information on ${program.title}, use the admissions or contact page to request the latest programme guide, application support, and departmental advice.`
    );
  });

  readonly curriculumRows = computed<CurriculumRow[]>(() => {
    const program = this.program();
    if (!program) {
      return [];
    }

    return program.outline.flatMap((outline) =>
      outline.items.map((item, index) => ({
        stage: outline.title,
        item,
        showStage: index === 0,
      })),
    );
  });

  readonly intakeTerm = computed(() => {
    const level = this.level();
    if (level === 'masters' || level === 'phd' || level === 'postgraduate-diploma') {
      return 'January and September';
    }
    if (level === 'diploma' || level === 'certificate') {
      return 'January, May, and September';
    }
    return 'January and August';
  });

  readonly pageTitle = computed(() => {
    const program = this.program();
    if (!program) {
      return 'Programme Details - Sankofa Alkebulan University';
    }
    return `${program.title} - Sankofa Alkebulan University`;
  });

  setSection(id: string) {
    this.activeSection.set(id);
  }

  isActiveSection(id: string): boolean {
    return this.activeSection() === id;
  }

  constructor() {
    effect(() => {
      this.title.setTitle(this.pageTitle());
    });
    effect(() => {
      this.programSlug();
      this.activeSection.set('overview');
    });
  }

  private isMatchingProgram(program: ProgramDetail, slug: string): boolean {
    if (this.normalizeSlug(program.title) === slug) {
      return true;
    }
    if (this.normalizeSlug(program.award) === slug) {
      return true;
    }
    if (this.normalizeSlug(program.title.replace(/[()]/g, '')) === slug) {
      return true;
    }
    return program.title.toLowerCase().includes(slug.replace(/-/g, ' '));
  }

  private normalizeSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private resolveLevel(program: ProgramDetail): string {
    const title = program.title.toLowerCase();
    if (title.includes('phd') || title.includes('doctor of philosophy')) {
      return 'phd';
    }
    if (title.includes('master') || title.includes('masters')) {
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
}
