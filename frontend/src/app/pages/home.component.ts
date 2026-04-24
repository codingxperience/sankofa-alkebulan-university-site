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
  IconDefinition,
  faBalanceScale,
  faBrain,
  faBriefcase,
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
} from '@fortawesome/free-solid-svg-icons';

interface HeroSlide {
  readonly badge: string;
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly imagePosition: string;
  readonly tone: 'warm' | 'cool' | 'neutral';
  readonly ctaLabel: string;
  readonly ctaPath: string;
  readonly secondaryLabel?: string;
  readonly secondaryPath?: string;
  readonly contentSide?: 'left' | 'right';
  readonly contentWidth?: string;
  readonly titleWidth?: string;
  readonly summaryWidth?: string;
  readonly panX?: string;
  readonly panY?: string;
}

interface PathwayCard {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly iconClass: string;
  readonly path: string;
}

interface PromisePillar {
  readonly index: string;
  readonly title: string;
  readonly description: string;
}

interface SignalCard {
  readonly stamp: string;
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly path: string;
  readonly iconClass: string;
  readonly theme: 'light' | 'warm' | 'cool' | 'ink';
}

interface ExperienceCard {
  readonly title: string;
  readonly description: string;
  readonly iconClass: string;
  readonly path: string;
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

  readonly heroSlides: readonly HeroSlide[] = [
    {
      badge: 'Admissions 2026',
      title: 'Pan-African scholars start here.',
      subtitle:
        'Undergraduate, postgraduate, and doctoral admissions in one guided digital journey.',
      image: '/assets/hero/hero-admissions-africa.jpg',
      imagePosition: '77% 34%',
      tone: 'warm',
      ctaLabel: 'Apply now',
      ctaPath: '/admissions',
      secondaryLabel: 'Explore programs',
      secondaryPath: '/programs',
      contentWidth: '40rem',
      titleWidth: '22ch',
      summaryWidth: '31rem',
      panX: '-1.3%',
      panY: '-0.8%',
    },
    {
      badge: 'Research and Innovation',
      title: 'Research with continental consequence.',
      subtitle:
        'Inquiry shaped for public impact across health, AI, climate, governance, and culture.',
      image: '/assets/hero/hero-research-africa.jpg',
      imagePosition: '24% 32%',
      tone: 'cool',
      ctaLabel: 'Explore research',
      ctaPath: '/research-innovation',
      secondaryLabel: 'View institutes',
      secondaryPath: '/research-innovation',
      contentSide: 'right',
      contentWidth: '38rem',
      titleWidth: '20ch',
      summaryWidth: '31rem',
      panX: '1.1%',
      panY: '-0.7%',
    },
    {
      badge: 'Campus and Community',
      title: 'A modern campus experience, on site and online.',
      subtitle:
        'Hybrid learning, digital guidance, and student support built for ambitious futures.',
      image: '/assets/hero/hero-campus-africa.jpg',
      imagePosition: '35% 48%',
      tone: 'neutral',
      ctaLabel: 'Visit virtual campus',
      ctaPath: '/digital-learning',
      secondaryLabel: 'See student life',
      secondaryPath: '/student-life',
      contentSide: 'right',
      contentWidth: '39rem',
      titleWidth: '22ch',
      summaryWidth: '31rem',
      panX: '-0.9%',
      panY: '-0.5%',
    },
  ];

  readonly pathwayCards: readonly PathwayCard[] = [
    {
      eyebrow: 'Start here',
      title: 'Apply',
      description: 'Undergraduate, postgraduate, and international admissions.',
      iconClass: 'pi pi-send',
      path: '/admissions',
    },
    {
      eyebrow: 'Explore',
      title: 'Find a program',
      description: 'Certificates, degrees, and doctoral tracks across the university.',
      iconClass: 'pi pi-book',
      path: '/programs',
    },
    {
      eyebrow: 'Plan',
      title: 'Shape your experience',
      description: 'Virtual campus, live support, and guided next steps.',
      iconClass: 'pi pi-map',
      path: '/digital-learning',
    },
  ];

  readonly promisePillars: readonly PromisePillar[] = [
    {
      index: '01',
      title: 'Pan-African scholarship',
      description: 'Rooted in heritage, serious in method, and future-facing in scope.',
    },
    {
      index: '02',
      title: 'Interdisciplinary ambition',
      description: 'From theology and governance to AI, health, law, and engineering.',
    },
    {
      index: '03',
      title: 'Applied public impact',
      description: 'Teaching and research designed for society, not shelves alone.',
    },
  ];

  readonly currentSignals: readonly SignalCard[] = [
    {
      stamp: 'Admissions',
      title: '2026 intake is open',
      description: 'A guided entry path for domestic, international, and graduate applicants.',
      ctaLabel: 'Start application',
      path: '/admissions',
      iconClass: 'pi pi-arrow-up-right',
      theme: 'warm',
    },
    {
      stamp: 'Research',
      title: 'Labs with public impact',
      description: 'Health, AI, climate, policy, and culture connected through applied inquiry.',
      ctaLabel: 'Explore research',
      path: '/research-innovation',
      iconClass: 'pi pi-globe',
      theme: 'light',
    },
    {
      stamp: 'News and Events',
      title: 'Open days and faculty showcases',
      description: 'Focused sessions for applicants, partners, researchers, and alumni communities.',
      ctaLabel: 'View events',
      path: '/events-conferences',
      iconClass: 'pi pi-calendar',
      theme: 'cool',
    },
    {
      stamp: 'Academics',
      title: 'Schools shaped around clear identities',
      description: 'Eighteen academic gateways from civilizational studies to engineering and AI.',
      ctaLabel: 'Browse schools',
      path: '/faculties-schools',
      iconClass: 'pi pi-book',
      theme: 'ink',
    },
  ];

  readonly experienceCards: readonly ExperienceCard[] = [
    {
      title: 'Mentorship and advising',
      description: 'Guided academic support from admissions through graduation.',
      iconClass: 'pi pi-users',
      path: '/student-life',
    },
    {
      title: 'Career and enterprise',
      description: 'Career coaching, placements, and entrepreneurship pathways.',
      iconClass: 'pi pi-briefcase',
      path: '/student-life',
    },
    {
      title: 'Hybrid classrooms',
      description: 'Digital learning, virtual campus tools, and live academic support.',
      iconClass: 'pi pi-desktop',
      path: '/digital-learning',
    },
    {
      title: 'Wellbeing and access',
      description: 'Wellness, accessibility, and inclusive student services.',
      iconClass: 'pi pi-heart',
      path: '/student-life',
    },
  ];

  private bannerRotationTimer: ReturnType<typeof setInterval> | null = null;
  private departmentRotationTimer: ReturnType<typeof setInterval> | null = null;
  private resizeListener: (() => void) | null = null;

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.heroSlides.length > 1) {
      this.bannerRotationTimer = setInterval(() => {
        const next = (this.activeBannerIndex() + 1) % this.heroSlides.length;
        this.activeBannerIndex.set(next);
      }, 6200);
    }

    this.updateDepartmentsPerPage();
    this.departmentRotationTimer = setInterval(() => {
      const next = (this.departmentPageIndex() + 1) % this.departmentPageCount();
      this.departmentPageIndex.set(next);
    }, 9000);

    this.resizeListener = () => this.updateDepartmentsPerPage();
    window.addEventListener('resize', this.resizeListener);
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

    if (width >= 1440) {
      perPage = 5;
    } else if (width >= 1120) {
      perPage = 4;
    } else if (width >= 820) {
      perPage = 3;
    } else if (width >= 620) {
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
