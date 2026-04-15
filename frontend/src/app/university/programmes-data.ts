import { DEPARTMENT_PAGES, ProgramDetail, getDepartmentPagePath } from './department-pages';

export type ProgrammeLevel =
  | 'phd'
  | 'masters'
  | 'postgraduate-diploma'
  | 'bachelors'
  | 'diploma'
  | 'certificate';

export interface ProgrammeCategory {
  readonly level: ProgrammeLevel;
  readonly title: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly layout: 'phd' | 'cards';
  readonly emptyState: string;
}

export interface ProgrammeCard {
  readonly title: string;
  readonly summary: string;
  readonly duration: string;
  readonly tuition: string;
  readonly college: string;
  readonly path: string;
  readonly detailPath: string;
  readonly anchor: string;
  readonly slug: string;
  readonly level: ProgrammeLevel;
}

export interface PhdSection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly items?: readonly string[];
}

const summarize = (text: string): string => {
  const trimmed = text.trim();
  const sentenceEnd = trimmed.indexOf('. ');
  if (sentenceEnd > 50) {
    return trimmed.slice(0, sentenceEnd + 1);
  }
  if (trimmed.length > 150) {
    return trimmed.slice(0, 147) + '...';
  }
  return trimmed;
};

const toAnchor = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const resolveLevel = (program: ProgramDetail): ProgrammeLevel | null => {
  const title = program.title.toLowerCase();
  if (title.includes('doctor of philosophy') || title.includes('phd')) {
    return 'phd';
  }
  if (title.startsWith('master') || title.includes('master of') || title.includes('masters')) {
    return 'masters';
  }
  if (title.includes('postgraduate diploma')) {
    return 'postgraduate-diploma';
  }
  if (title.startsWith('bachelor')) {
    return 'bachelors';
  }
  if (title.startsWith('diploma')) {
    return 'diploma';
  }
  if (title.startsWith('certificate')) {
    return 'certificate';
  }
  return null;
};

export const PROGRAMME_CATEGORIES: readonly ProgrammeCategory[] = [
  {
    level: 'phd',
    title: 'Doctor of Philosophy (PhD) Programmes',
    shortLabel: 'PhD Programmes',
    description:
      'Research-led doctorates aligned with Pan-African knowledge, innovation, and policy transformation across our colleges and schools.',
    layout: 'phd',
    emptyState:
      'PhD programme listings are coordinated by each college. Contact admissions for the current doctoral call and supervision availability.',
  },
  {
    level: 'masters',
    title: 'Masters Degree Programmes',
    shortLabel: 'Masters Programmes',
    description:
      'Advanced professional and research degrees designed for leadership, specialization, and regional impact across disciplines.',
    layout: 'cards',
    emptyState:
      'Masters programme listings are being finalized across departments. Check back or contact admissions for the latest intake.',
  },
  {
    level: 'postgraduate-diploma',
    title: 'Postgraduate Diploma Programmes',
    shortLabel: 'Postgraduate Diplomas',
    description:
      'Postgraduate diplomas provide focused, practice-oriented specialization for professionals and career shifters.',
    layout: 'cards',
    emptyState:
      'Postgraduate diploma listings are being consolidated. Reach out to admissions for available cohorts.',
  },
  {
    level: 'bachelors',
    title: 'Bachelors Degree Programmes',
    shortLabel: 'Bachelors Programmes',
    description:
      'Undergraduate degrees anchored in Pan-African scholarship, professional formation, and community impact.',
    layout: 'cards',
    emptyState:
      'Undergraduate programme listings are being updated. Please contact admissions for guidance.',
  },
  {
    level: 'diploma',
    title: 'Diploma Programmes',
    shortLabel: 'Diploma Programmes',
    description:
      'Two-year diplomas delivering applied knowledge and workforce-ready skills across priority sectors.',
    layout: 'cards',
    emptyState:
      'Diploma programme listings are being updated. Please contact admissions for guidance.',
  },
  {
    level: 'certificate',
    title: 'Certificate Programmes',
    shortLabel: 'Certificate Programmes',
    description:
      'Short, career-focused certificates that build foundational skills and enable progression into higher awards.',
    layout: 'cards',
    emptyState:
      'Certificate programme listings are being updated. Please contact admissions for guidance.',
  },
];

export const PHD_SECTIONS: readonly PhdSection[] = [
  {
    id: 'scope',
    title: 'Scope of the PhD Programme',
    description:
      'Doctoral research is hosted within every college and school, with supervision anchored in Pan-African scholarship, innovation, and community transformation.',
    items: [
      'African Civilizational Studies and Heritage Research',
      'Governance, Policy, and Leadership Studies',
      'Theology and Religious Studies',
      'Science, Technology, and Innovation',
      'Business, Economics, and Entrepreneurship',
      'Law, Human Rights, and Justice Studies',
      'Health Sciences and Biomedical Research',
      'Environmental Sustainability and Climate Futures',
      'Agriculture, Food Security, and Agribusiness',
      'Creative Arts, Media, and Cultural Production',
      'Mathematics, Data Science, and Artificial Intelligence',
      'Psychology, Behavioral, and Cognitive Sciences',
      'Tourism, Hospitality, and Cultural Heritage',
      'Space, Astronomy, and Earth Sciences',
    ],
  },
  {
    id: 'entry',
    title: 'Minimum Entry Requirements',
    description:
      'Applicants must hold a recognized masters degree or equivalent qualification with demonstrable research capacity and a viable research proposal.',
    items: [
      'Relevant masters degree with strong academic standing',
      'Research concept note aligned with a college or school',
      'Evidence of academic or professional research output',
      'Two academic or professional referees',
    ],
  },
  {
    id: 'fees',
    title: 'Fees Structure',
    description:
      'Fees vary by discipline and research mode. Contact admissions for the current PhD fee schedule and funding options.',
  },
  {
    id: 'graduation',
    title: 'Minimum Graduation Requirements',
    description:
      'Doctoral candidates must complete an approved dissertation, satisfy publication requirements, and pass the oral defense.',
    items: [
      'Research proposal defense and ethical approval',
      'Completed dissertation submitted to graduate school',
      'Oral defense and revisions approved by the committee',
    ],
  },
  {
    id: 'supervision',
    title: 'Supervision',
    description:
      'Each candidate is assigned a primary supervisor and a co-supervisor, supported by doctoral seminars and research clusters.',
  },
  {
    id: 'thesis',
    title: 'Thesis and Dissertation Guidelines',
    description:
      'Thesis formatting, submission, and examination procedures follow the Graduate School doctoral handbook and national QA standards.',
  },
];

const programmeCards: ProgrammeCard[] = [];

DEPARTMENT_PAGES.forEach((page) => {
  page.featuredDepartment.programs.forEach((program) => {
    const level = resolveLevel(program);
    if (!level) {
      return;
    }

    const slug = toAnchor(program.title);
    programmeCards.push({
      title: program.title,
      summary: summarize(program.overview),
      duration: program.duration,
      tuition: program.tuition[0] ?? 'Contact admissions for tuition',
      college: page.title,
      path: getDepartmentPagePath(page),
      detailPath: `/home/${level}/${slug}`,
      anchor: slug,
      slug,
      level,
    });
  });
});

export const PROGRAMME_CARDS = programmeCards;

export const PROGRAMME_CARDS_BY_LEVEL = programmeCards.reduce(
  (acc, card) => {
    if (!acc[card.level]) {
      acc[card.level] = [];
    }
    acc[card.level]?.push(card);
    return acc;
  },
  {} as Record<ProgrammeLevel, ProgrammeCard[]>,
);
