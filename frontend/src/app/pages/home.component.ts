import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DEPARTMENT_PAGES, getDepartmentPagePath } from '../university/department-pages';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBalanceScale,
  faBriefcase,
  faBrain,
  faChurch,
  faCog,
  faDesktop,
  faGlobe,
  faHeart,
  faLandmark,
  faLeaf,
  faPalette,
  faQuestionCircle,
  faRocket,
  faUsers,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

interface HomeFeature {
  readonly title: string;
  readonly description: string;
  readonly path: string;
}

interface HomePost {
  readonly title: string;
  readonly date: string;
  readonly summary: string;
}

interface HeroRailItem {
  readonly title: string;
  readonly description: string;
  readonly iconClass: string;
  readonly path: string;
}

interface HeroSlideCard {
  readonly title: string;
  readonly subtitle: string;
  readonly badge: string;
  readonly ctaLabel: string;
  readonly ctaPath: string;
  readonly image: string;
  readonly creditLabel: string;
  readonly creditUrl: string;
}

interface HeroSlide {
  readonly primary: HeroSlideCard;
  readonly secondary: HeroSlideCard;
  readonly rail: readonly HeroRailItem[];
}





interface DepartmentCard {
  readonly title: string;
  readonly description: string;
  readonly icon: IconDefinition;
  readonly path: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, FontAwesomeModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly departmentPageData = DEPARTMENT_PAGES;

  readonly activeBannerIndex = signal(0);
  readonly activeSlide = computed(
    () => this.heroSlides[this.activeBannerIndex()] ?? this.heroSlides[0],
  );

  private readonly departmentThemeByFaculty: Record<
    string,
    { icon: IconDefinition; description: string }
  > = {
    'College of African Civilizational Studies': {
      icon: faLandmark,
      description: 'African civilization, heritage studies, and historical scholarship.',
    },
    'College of Theology and Religious Studies': {
      icon: faChurch,
      description: 'Theological studies, spiritual traditions, and interfaith scholarship.',
    },
    'College of Humanities and Cultural Studies': {
      icon: faPalette,
      description: 'Humanities, cultural studies, and expressive traditions across the continent.',
    },
    'College of Leadership and Governance': {
      icon: faUsers,
      description: 'Leadership, governance, and public sector transformation pathways.',
    },
    'College of Science, Technology, and Innovation': {
      icon: faCog,
      description: 'Scientific discovery, innovation hubs, and applied technology systems.',
    },
    'School of Global Education and International Relations': {
      icon: faGlobe,
      description: 'Global education, diplomacy, and international relations programs.',
    },
    'School of Business, Economics, and Entrepreneurship': {
      icon: faBriefcase,
      description: 'Enterprise leadership, finance strategy, and entrepreneurship practice.',
    },
    'School of Law and Human Rights': {
      icon: faBalanceScale,
      description: 'Law, justice, policy analysis, and human rights advocacy.',
    },
    'College of Health Sciences and Biomedical Studies': {
      icon: faHeart,
      description: 'Health sciences, biomedical research, and clinical innovation.',
    },
    'School of Environmental and Sustainability Studies': {
      icon: faLeaf,
      description: 'Environmental stewardship, climate resilience, and sustainability programs.',
    },
    'School of Agriculture and Food Security': {
      icon: faLeaf,
      description: 'Agriculture, food systems, and resilient supply innovation.',
    },
    'School of Engineering and Applied Technologies': {
      icon: faCog,
      description: 'Engineering, applied technologies, and industrial innovation labs.',
    },
    'College of Social Sciences and Public Policy': {
      icon: faUsers,
      description: 'Social sciences, public policy, and community development research.',
    },
    'School of Creative Arts, Music, and Media': {
      icon: faPalette,
      description: 'Creative arts, music, media, and cultural expression studios.',
    },
    'School of Mathematics, Data Science, and AI': {
      icon: faDesktop,
      description: 'Mathematics, data science, AI systems, and digital research.',
    },
    'School of Psychology, Behavioral, and Cognitive Sciences': {
      icon: faBrain,
      description: 'Psychology, behavioral science, and cognitive research pathways.',
    },
    'School of Tourism, Hospitality, and Cultural Heritage': {
      icon: faLandmark,
      description: 'Tourism, hospitality management, and cultural heritage leadership.',
    },
    'School of Space, Astronomy, and Earth Sciences': {
      icon: faRocket,
      description: 'Space science, astronomy, and earth observation research.',
    },
    'Graduate School': {
      icon: faUsers,
      description: 'Advanced master and doctoral research training for scholars and professionals.',
    },
    'School of Education': {
      icon: faLandmark,
      description: 'Teacher education, curriculum design, and inclusive learning leadership.',
    },
    'Institute of Public Health & Health Sciences': {
      icon: faHeart,
      description: 'Public health and biomedical training with applied field practice.',
    },
    'Institute of African Culture, Science and Technology (IACST)': {
      icon: faBrain,
      description: 'Applied African cultural, science, and technology innovation programs.',
    },
  };

  private summarizeOverview(overview: string): string {
    const trimmed = overview.trim();
    const sentenceEnd = trimmed.indexOf('. ');
    if (sentenceEnd > 40) {
      return trimmed.slice(0, sentenceEnd + 1);
    }
    if (trimmed.length > 140) {
      return trimmed.slice(0, 137) + '...';
    }
    return trimmed;
  }

  private getFacultyTheme(faculty: string) {
    return (
      this.departmentThemeByFaculty[faculty] ?? {
        icon: faQuestionCircle,
        description: 'Academic department with interdisciplinary programming across the institution.',
      }
    );
  }

  readonly departmentCards: readonly DepartmentCard[] = this.departmentPageData.map((page) => {
    const theme = this.getFacultyTheme(page.title);
    return {
      title: page.title,
      description: this.summarizeOverview(page.overview) || theme.description,
      icon: theme.icon,
      path: getDepartmentPagePath(page),
    };
  });

  readonly departmentPageIndex = signal(0);
  readonly departmentsPerPage = signal(4);
  readonly departmentPageCount = computed(() => {
    const perPage = this.departmentsPerPage();
    return Math.max(1, Math.ceil(this.departmentCards.length / perPage));
  });
  readonly departmentPages = computed(() =>
    Array.from({ length: this.departmentPageCount() }, (_, index) => index),
  );
  readonly visibleDepartments = computed(() => {
    const perPage = this.departmentsPerPage();
    const start = this.departmentPageIndex() * perPage;
    return this.departmentCards.slice(start, start + perPage);
  });

  readonly safeDepartments = computed(() => {
    const visible = this.visibleDepartments();
    return visible.length ? visible : this.departmentCards.slice(0, this.departmentsPerPage());
  });

  readonly quickApply: readonly HomeFeature[] = [
    {
      title: 'Undergraduate Admissions',
      description:
        "Apply for certificates, diplomas, and bachelor's programs with step-by-step guidance.",
      path: '/admissions',
    },
    {
      title: 'Postgraduate Admissions',
      description:
        "Master's and doctoral pathways with research supervision matching and proposal support.",
      path: '/admissions',
    },
    {
      title: 'Scholarships and Funding',
      description: 'Explore bursaries, financial aid, and mobility funding aligned with your program.',
      path: '/admissions',
    },
  ];

  readonly announcements: readonly HomePost[] = [
    {
      title: 'Admissions 2026 Intake Now Open',
      date: 'March 2026',
      summary:
        'Domestic and international applicants can submit documents, track status, and book admissions support.',
    },
    {
      title: 'Pan-African Research Seed Fund: Round 1',
      date: 'March 2026',
      summary:
        'Interdisciplinary faculty teams can submit proposals in health, governance, climate, and AI.',
    },
    {
      title: 'Virtual Open Day Schedule Released',
      date: 'April 2026',
      summary:
        'Prospective students can join faculty showcases, admissions workshops, and live Q and A sessions.',
    },
  ];

  readonly researchSpotlights: readonly HomeFeature[] = [
    {
      title: 'AI and Robotics for Social Development',
      description: 'Human-centered AI research with policy and deployment pathways across African contexts.',
      path: '/research-innovation',
    },
    {
      title: 'Water, Agriculture, and Food Security Innovation',
      description:
        'Applied research labs connecting climate intelligence, agronomy, and resilient food systems.',
      path: '/research-innovation',
    },
    {
      title: 'Policy, Peace, and Conflict Resolution Studio',
      description:
        'Data-informed governance and peacebuilding models for local, national, and continental action.',
      path: '/research-innovation',
    },
  ];

  readonly aiHighlights: readonly string[] = [
    'Career coaching and placement support',
    'Scholarship advising and financial aid guidance',
    'Peer mentoring and alumni network access',
    'Wellbeing, counseling, and accessibility services',
  ];

  readonly heroSlides: readonly HeroSlide[] = [
    {
      primary: {
        title: 'Admissions 2026 Intake Is Open',
        subtitle: 'Domestic and international admissions for 2026 are now open.',
        badge: 'Admissions',
        ctaLabel: 'Apply for 2026',
        ctaPath: '/admissions',
        image: '/assets/hero/hero-campus-banner.png',
        creditLabel: 'Pexels / Akb Issue',
        creditUrl:
          'https://www.pexels.com/photo/group-of-students-with-books-and-notebook-computers-29558436/',
      },
      secondary: {
        title: 'Pan-African Innovation Labs',
        subtitle: '18 institutes advancing health, governance, AI, and climate resilience.',
        badge: 'Research Highlight',
        ctaLabel: 'Open Research Labs',
        ctaPath: '/research-innovation',
        image: '/assets/hero/hero-lab-banner.png',
        creditLabel: 'Pexels / Retha Ferguson',
        creditUrl: 'https://www.pexels.com/photo/person-holding-black-and-white-microscope-3825434/',
      },
      rail: [
        {
          title: 'Launch Your Application',
          description: 'Domestic and international pipelines',
          iconClass: 'pi pi-send',
          path: '/admissions',
        },
        {
          title: 'Compare Programs',
          description: 'Certificates to doctorates',
          iconClass: 'pi pi-book',
          path: '/programs',
        },
        {
          title: 'Plan Campus Experience',
          description: 'Virtual tour and interactive map',
          iconClass: 'pi pi-map',
          path: '/digital-learning',
        },
      ],
    },
    {
      primary: {
        title: 'Research Highlight: Pan-African Innovation Labs',
        subtitle: 'Collaborative programs with funding, policy translation, and industry links.',
        badge: 'Research',
        ctaLabel: 'Open Research Labs',
        ctaPath: '/research-innovation',
        image: '/assets/hero/hero-lab-banner.png',
        creditLabel: 'Pexels / Retha Ferguson',
        creditUrl: 'https://www.pexels.com/photo/person-holding-black-and-white-microscope-3825434/',
      },
      secondary: {
        title: 'Conferences and Public Scholarship',
        subtitle: 'Hybrid events and public scholarship connecting scholars and policy leaders.',
        badge: 'Events',
        ctaLabel: 'Join Events',
        ctaPath: '/events-conferences',
        image: '/assets/hero/hero-campus-banner.png',
        creditLabel: 'Pexels / Akb Issue',
        creditUrl:
          'https://www.pexels.com/photo/group-of-students-with-books-and-notebook-computers-29558436/',
      },
      rail: [
        {
          title: 'Join Open Day Webinars',
          description: 'Admissions briefs and Q and A',
          iconClass: 'pi pi-video',
          path: '/admissions',
        },
        {
          title: 'Submit Conference Abstract',
          description: 'Hybrid and VR-ready sessions',
          iconClass: 'pi pi-megaphone',
          path: '/events-conferences',
        },
        {
          title: 'Browse Research Institutes',
          description: '18 centers and institutes',
          iconClass: 'pi pi-sparkles',
          path: '/research-innovation',
        },
      ],
    },
    {
      primary: {
        title: 'Global Conferences and Hybrid Learning',
        subtitle: 'Virtual and on-campus collaboration for global classrooms and applied research.',
        badge: 'Hybrid Campus',
        ctaLabel: 'Join Hybrid Events',
        ctaPath: '/events-conferences',
        image: '/assets/hero/hero-campus-banner.png',
        creditLabel: 'Pexels / Akb Issue',
        creditUrl:
          'https://www.pexels.com/photo/group-of-students-with-books-and-notebook-computers-29558436/',
      },
      secondary: {
        title: 'Digital Learning and AI Advising',
        subtitle: 'Adaptive LMS, secure assessments, and AI mentorship for student success.',
        badge: 'Virtual Campus',
        ctaLabel: 'Enter Virtual Campus',
        ctaPath: '/digital-learning',
        image: '/assets/hero/hero-lab-banner.png',
        creditLabel: 'Pexels / Retha Ferguson',
        creditUrl: 'https://www.pexels.com/photo/person-holding-black-and-white-microscope-3825434/',
      },
      rail: [
        {
          title: 'Access Learning Platform',
          description: 'Adaptive courses and mentoring',
          iconClass: 'pi pi-desktop',
          path: '/digital-learning',
        },
        {
          title: 'Explore AI Campus Guide',
          description: 'Instant support and routing',
          iconClass: 'pi pi-comments',
          path: '/ai-advanced-tools',
        },
        {
          title: 'Check Event Calendar',
          description: 'Conferences and seminars',
          iconClass: 'pi pi-calendar',
          path: '/events-conferences',
        },
      ],
    },
    {
      primary: {
        title: 'Strategic Partnerships Across Africa and Beyond',
        subtitle: 'University alliances for exchange, mobility, funding, and innovation.',
        badge: 'Global Relations',
        ctaLabel: 'View Partnerships',
        ctaPath: '/partnerships-global',
        image: '/assets/hero/hero-lab-banner.png',
        creditLabel: 'Pexels / Retha Ferguson',
        creditUrl: 'https://www.pexels.com/photo/person-holding-black-and-white-microscope-3825434/',
      },
      secondary: {
        title: 'Funding, Scholarships, and Development',
        subtitle: 'Integrated donor, scholarship, and project tracking for sustainable growth.',
        badge: 'Institutional Growth',
        ctaLabel: 'Open Funding Hub',
        ctaPath: '/institutional-development',
        image: '/assets/hero/hero-campus-banner.png',
        creditLabel: 'Pexels / Akb Issue',
        creditUrl:
          'https://www.pexels.com/photo/group-of-students-with-books-and-notebook-computers-29558436/',
      },
      rail: [
        {
          title: 'View Partner Network',
          description: 'Universities and institutions',
          iconClass: 'pi pi-globe',
          path: '/partnerships-global',
        },
        {
          title: 'Discover Scholarships',
          description: 'Bursaries and mobility tracks',
          iconClass: 'pi pi-wallet',
          path: '/admissions',
        },
        {
          title: 'Support University Growth',
          description: 'Endowment and donor portal',
          iconClass: 'pi pi-chart-line',
          path: '/institutional-development',
        },
      ],
    },
  ];

  private bannerRotationTimer: ReturnType<typeof setInterval> | null = null;
  private departmentRotationTimer: ReturnType<typeof setInterval> | null = null;
  private resizeListener: (() => void) | null = null;

  ngOnInit(): void {
    if (typeof window === 'undefined' || this.heroSlides.length <= 1) {
      return;
    }

    this.bannerRotationTimer = setInterval(() => {
      const next = (this.activeBannerIndex() + 1) % this.heroSlides.length;
      this.activeBannerIndex.set(next);
    }, 5500);

    if (typeof window !== 'undefined') {
      this.updateDepartmentsPerPage();
      this.departmentRotationTimer = setInterval(() => {
        const next = (this.departmentPageIndex() + 1) % this.departmentPageCount();
        this.departmentPageIndex.set(next);
      }, 9000);

      this.resizeListener = () => this.updateDepartmentsPerPage();
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.bannerRotationTimer) {
      clearInterval(this.bannerRotationTimer);
      this.bannerRotationTimer = null;
    }

    if (this.departmentRotationTimer) {
      clearInterval(this.departmentRotationTimer);
      this.departmentRotationTimer = null;
    }

    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
  }

  private updateDepartmentsPerPage(): void {
    const width = window.innerWidth;
    let perPage = 4;

    if (width >= 1400) {
      perPage = 5;
    } else if (width >= 1200) {
      perPage = 4;
    } else if (width >= 980) {
      perPage = 3;
    } else if (width >= 720) {
      perPage = 2;
    } else {
      perPage = 1;
    }

    if (perPage !== this.departmentsPerPage()) {
      this.departmentsPerPage.set(perPage);
      this.departmentPageIndex.set(0);
    }
  }

  setDepartmentPage(index: number): void {
    const maxIndex = this.departmentPageCount() - 1;
    const clamped = Math.min(Math.max(index, 0), maxIndex);
    this.departmentPageIndex.set(clamped);
  }

  previousDepartmentPage(): void {
    this.setDepartmentPage(this.departmentPageIndex() - 1);
  }

  nextDepartmentPage(): void {
    this.setDepartmentPage(this.departmentPageIndex() + 1);
  }

  selectBanner(index: number): void {
    this.activeBannerIndex.set(index);
  }

  nextBanner(): void {
    this.activeBannerIndex.set((this.activeBannerIndex() + 1) % this.heroSlides.length);
  }

  previousBanner(): void {
    this.activeBannerIndex.set(
      (this.activeBannerIndex() - 1 + this.heroSlides.length) % this.heroSlides.length,
    );
  }
}











