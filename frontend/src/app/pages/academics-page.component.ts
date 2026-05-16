import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../directives/reveal.directive';
import { ACADEMIC_ARCHITECTURE_COLLEGES, ACADEMIC_ARCHITECTURE_TOTALS } from '../university/academic-architecture';
import { ACADEMIC_RESEARCH_INSTITUTES } from '../university/academic-departments';
import {
  academicImageForName,
  programmeRoute,
  slugifyAcademic,
} from '../university/academic-navigation';

interface AcademicSearchResult {
  readonly label: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly route: readonly string[] | string;
}

@Component({
  selector: 'app-academics-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './academics-page.component.html',
  styleUrl: './academics-page.component.scss',
})
export class AcademicsPageComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly totals = ACADEMIC_ARCHITECTURE_TOTALS;
  readonly searchQuery = signal('');
  readonly featuredIndex = signal(0);

  readonly featuredCollege = computed(() => ACADEMIC_ARCHITECTURE_COLLEGES[this.featuredIndex() % ACADEMIC_ARCHITECTURE_COLLEGES.length]);
  readonly featuredImage = computed(() => academicImageForName(this.featuredCollege().name));

  readonly heroChips = [
    { icon: 'fa-building-columns', label: 'Colleges', route: '/academics/colleges' },
    { icon: 'fa-sitemap', label: 'Schools', route: '/academics/schools' },
    { icon: 'fa-layer-group', label: 'Departments', route: '/academics/departments' },
    { icon: 'fa-flask', label: 'Research institutes', route: '/academics/research-institutes' },
  ];

  readonly allSearchItems: readonly AcademicSearchResult[] = [
    ...ACADEMIC_ARCHITECTURE_COLLEGES.map((college) => ({
      label: college.name,
      eyebrow: 'College',
      description: `${college.schoolStructure.length} schools, ${college.programmes.length} programmes, ${college.researchInstitute}`,
      route: ['/academics/colleges', slugifyAcademic(college.name)] as const,
    })),
    ...ACADEMIC_ARCHITECTURE_COLLEGES.flatMap((college) =>
      college.schoolStructure.map((school) => ({
        label: school.name,
        eyebrow: 'School',
        description: `${school.departments.length} departments inside ${college.name}`,
        route: ['/academics/colleges', slugifyAcademic(college.name), 'schools', slugifyAcademic(school.name)] as const,
      })),
    ),
    ...ACADEMIC_ARCHITECTURE_COLLEGES.flatMap((college) =>
      college.schoolStructure.flatMap((school) =>
        school.departments.map((department) => ({
          label: department,
          eyebrow: 'Department',
          description: `${school.name} - ${college.name}`,
          route: [
            '/academics/colleges',
            slugifyAcademic(college.name),
            'schools',
            slugifyAcademic(school.name),
            'departments',
            slugifyAcademic(department),
          ] as const,
        })),
      ),
    ),
    ...ACADEMIC_ARCHITECTURE_COLLEGES.flatMap((college) =>
      college.programmes.map((programme) => ({
        label: programme,
        eyebrow: 'Programme',
        description: college.name,
        route: programmeRoute(programme),
      })),
    ),
  ];

  readonly searchResults = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.allSearchItems
        .filter((item) => ['College', 'Programme'].includes(item.eyebrow))
        .slice(0, 5);
    }

    return this.allSearchItems
      .filter((item) => `${item.label} ${item.eyebrow} ${item.description}`.toLowerCase().includes(query))
      .slice(0, 7);
  });

  readonly anchorQuestions = computed(() => {
    const college = this.featuredCollege();
    return this.anchorQuestionsForCollege(college.name);
  });

  readonly featureProgrammes = computed(() =>
    this.featuredCollege().programmes.slice(0, 7).map((programme) => ({
      b: programme,
      s: this.programmePathway(programme),
      route: programmeRoute(programme),
    })),
  );

  readonly architectureLanes = computed(() => {
    const featured = this.featuredCollege();
    return [
      {
        num: '01',
        feature: true,
        b: 'Colleges',
        p: 'Where the question lives.',
        icon: 'fa-building-columns',
        tags: `${this.totals.colleges} colleges`,
        route: '/academics/colleges',
      },
      {
        num: '02',
        feature: false,
        b: 'Schools',
        p: 'Where the method forms.',
        icon: 'fa-sitemap',
        tags: `${this.totals.schools} schools`,
        route: '/academics/schools',
      },
      {
        num: '03',
        feature: false,
        b: 'Departments',
        p: 'Where teaching and research are held.',
        icon: 'fa-layer-group',
        tags: `${this.totals.departments} departments`,
        route: '/academics/departments',
      },
      {
        num: '04',
        feature: false,
        b: 'Programmes',
        p: 'Where study becomes an award.',
        icon: 'fa-graduation-cap',
        tags: `${this.totals.programmes} programmes`,
        route: '/programmes',
      },
      {
        num: '05',
        feature: false,
        b: 'Research Institutes',
        p: 'Where scholarship meets public consequence.',
        icon: 'fa-flask',
        tags: `${ACADEMIC_RESEARCH_INSTITUTES.length} institutes`,
        route: '/academics/research-institutes',
      },
      {
        num: '06',
        feature: false,
        b: featured.name,
        p: `${featured.researchInstitute}.`,
        icon: 'fa-dove',
        tags: `${featured.schools.length} schools - ${featured.programmes.length} programmes`,
        route: ['/academics/colleges', slugifyAcademic(featured.name)],
      },
    ];
  });

  readonly pathways = [
    {
      icon: 'fa-graduation-cap',
      b: 'Undergraduate',
      p: "Bachelor's degrees and undergraduate diplomas organised through colleges and schools, with professional and research continuity.",
      meta: ['Certificates, diplomas, and bachelor degrees', 'College-led admissions pathways', 'Programme detail pages stay separate', 'September 2026 intake'],
      cta: 'Explore undergraduate programmes',
      route: '/home/bachelors',
    },
    {
      icon: 'fa-user-graduate',
      b: 'Postgraduate',
      p: "Master's degrees, postgraduate diplomas, and advanced professional pathways connected to institutes and external practice.",
      meta: ['Masters and postgraduate diplomas', 'Research and professional tracks', 'Supervision alignment by school', 'Hybrid and on-campus options'],
      cta: 'Explore postgraduate programmes',
      route: '/home/masters',
    },
    {
      icon: 'fa-flask',
      b: 'Doctoral',
      p: 'Doctoral study anchored in departments and research institutes, with a clearer route into publication and public scholarship.',
      meta: ['PhD pathways across the colleges', 'Institute-linked research culture', 'Supervision governance', 'Thesis and dissertation standards'],
      cta: 'Explore doctoral programmes',
      route: '/home/phd',
    },
    {
      icon: 'fa-laptop',
      b: 'Online & short courses',
      p: 'Short, stackable digital routes for learners who need focused study before entering a longer award pathway.',
      meta: ['Certificate-ready learning blocks', 'Professional skills and academic bridges', 'Digital learning support', 'Future LMS alignment'],
      cta: 'Explore certificate pathways',
      route: '/home/certificate',
    },
  ];

  readonly categories = [
    { icon: 'fa-landmark', label: 'Civilisational systems', selected: true },
    { icon: 'fa-microscope', label: 'Science & innovation', selected: false },
    { icon: 'fa-scale-balanced', label: 'Governance & law', selected: false },
    { icon: 'fa-heart-pulse', label: 'Health & society', selected: false },
    { icon: 'fa-chart-line', label: 'Economics & enterprise', selected: false },
    { icon: 'fa-leaf', label: 'Agriculture & climate', selected: false },
    { icon: 'fa-book-open', label: 'Humanities', selected: false },
    { icon: 'fa-laptop-code', label: 'Computing & data', selected: false },
    { icon: 'fa-people-roof', label: 'Education', selected: false },
    { icon: 'fa-globe-africa', label: 'Pan-African systems', selected: false },
    { icon: 'fa-dove', label: 'Divine wisdom', selected: false },
  ];

  readonly institutes = ACADEMIC_RESEARCH_INSTITUTES.slice(0, 4).map((name, index) => ({
    icon: ['fa-globe-africa', 'fa-building-shield', 'fa-scale-balanced', 'fa-shield-halved'][index] ?? 'fa-flask',
    h: name,
    p: this.instituteSummary(name),
    meta: 'Cross-college research architecture',
  }));

  readonly standards = [
    'Colleges, schools, departments, programmes, and institutes are separated for clean navigation.',
    'The full academic architecture remains available through dedicated pages instead of being compressed into one page.',
    'Programme detail pages remain focused on admissions, curriculum, outcomes, and funding.',
    'Research institutes stay visible as the bridge between teaching, policy, publication, and innovation.',
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.featuredIndex.set(Math.floor(Math.random() * ACADEMIC_ARCHITECTURE_COLLEGES.length));
      const timer = window.setInterval(() => {
        this.featuredIndex.set(Math.floor(Math.random() * ACADEMIC_ARCHITECTURE_COLLEGES.length));
      }, 120000);
      this.destroyRef.onDestroy(() => window.clearInterval(timer));
    }
  }

  setSearch(value: string): void {
    this.searchQuery.set(value);
  }

  programmePathway(programme: string): string {
    if (programme.startsWith('PhD')) return 'Doctoral pathway';
    if (programme.startsWith('Master') || programme.startsWith('MSc') || programme.startsWith('MA')) return 'Postgraduate pathway';
    if (programme.startsWith('Diploma')) return 'Diploma pathway';
    if (programme.startsWith('Certificate')) return 'Certificate pathway';
    return 'Undergraduate pathway';
  }

  slugify(value: string): string {
    return slugifyAcademic(value);
  }

  private instituteSummary(name: string): string {
    if (name.includes('Pan-African')) return 'Civilisational thought, public scholarship, continental identity, and historical continuity.';
    if (name.includes('Governance')) return 'Statecraft, institutional reform, policy systems, and public administration.';
    if (name.includes('Law')) return 'Justice systems, constitutional development, regulation, and legal transformation.';
    if (name.includes('Security')) return 'Peacebuilding, strategic studies, human security, and continental stability.';
    return 'A cross-disciplinary research unit aligned to colleges, departments, and public impact.';
  }

  private anchorQuestionsForCollege(name: string): readonly string[] {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('divine wisdom') || lowerName.includes('spiritual') || lowerName.includes('religion')) {
      return [
        'What wisdom survives when empire teaches a people to distrust their own sacred memory?',
        'How can consciousness, ethics, and ritual knowledge become public responsibility rather than private sentiment?',
        'Where does inner formation meet governance, healing, ecology, and civilisational renewal?',
        'Which programme turns wisdom into disciplined practice, service, and human transformation?',
      ];
    }

    if (lowerName.includes('indigenous') || lowerName.includes('civilisation') || lowerName.includes('humanities')) {
      return [
        'What does Africa remember that the modern archive still fails to hold?',
        'How can memory become method without becoming nostalgia?',
        'Where do language, philosophy, history, and identity become a living academic system?',
        'Which programme trains a scholar to recover knowledge and make it usable again?',
      ];
    }

    if (lowerName.includes('law') || lowerName.includes('governance') || lowerName.includes('diplomacy') || lowerName.includes('security')) {
      return [
        'What kind of institution can govern power without surrendering justice?',
        'How do law, policy, diplomacy, and security become instruments of public dignity?',
        'Where does constitutional order meet African statecraft and continental responsibility?',
        'Which programme prepares a learner to move from argument to accountable leadership?',
      ];
    }

    if (lowerName.includes('health') || lowerName.includes('medicine') || lowerName.includes('pharmacy') || lowerName.includes('biomedical')) {
      return [
        'What would health systems look like if care, science, and community trust were designed together?',
        'How do clinical practice, public health, medicines, and diagnostics become one accountable system?',
        'Where does laboratory knowledge become protection for families, cities, and nations?',
        'Which programme prepares a practitioner to serve both patient and public life?',
      ];
    }

    if (lowerName.includes('agriculture') || lowerName.includes('food') || lowerName.includes('climate') || lowerName.includes('water') || lowerName.includes('environment')) {
      return [
        'What must be restored when land, food, water, and climate are treated as one living system?',
        'How does ecological knowledge become food sovereignty, public health, and economic resilience?',
        'Where do field practice, policy, and science meet the daily survival of communities?',
        'Which programme prepares a learner to protect the systems that keep life possible?',
      ];
    }

    if (lowerName.includes('computing') || lowerName.includes('data') || lowerName.includes('digital') || lowerName.includes('robotics') || lowerName.includes('space')) {
      return [
        'Who owns the intelligence systems that will shape African public life?',
        'How can computation, data, automation, and infrastructure serve sovereignty rather than dependency?',
        'Where does software become policy, industry, security, and human capability?',
        'Which programme prepares a builder to make technology answerable to society?',
      ];
    }

    if (lowerName.includes('business') || lowerName.includes('finance') || lowerName.includes('trade') || lowerName.includes('entrepreneurship')) {
      return [
        'What kind of economy grows when enterprise is measured by dignity as well as profit?',
        'How do finance, trade, management, and innovation become systems of continental capacity?',
        'Where does value creation meet ethics, logistics, institutions, and public consequence?',
        'Which programme prepares a learner to build ventures that can outlast the pitch deck?',
      ];
    }

    if (lowerName.includes('engineering') || lowerName.includes('manufacturing') || lowerName.includes('energy') || lowerName.includes('transport')) {
      return [
        'What must be built when infrastructure is understood as public imagination made physical?',
        'How do energy, machines, materials, and mobility become a continental operating system?',
        'Where does design discipline meet maintenance, safety, production, and social trust?',
        'Which programme prepares a builder to turn technical knowledge into durable systems?',
      ];
    }

    return [
      'What question is this college responsible enough to hold for a generation?',
      'How does its school structure turn curiosity into method?',
      'Where do departments convert knowledge into curriculum, supervision, and public work?',
      'Which programme lets a learner carry that responsibility into recognised practice?',
    ];
  }
}
