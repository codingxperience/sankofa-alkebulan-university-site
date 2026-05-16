export type AcademicVisualTone = 'study' | 'science' | 'culture' | 'systems' | 'research';

export interface AcademicHeroVisual {
  readonly src: string;
  readonly alt: string;
  readonly label: string;
  readonly credit: string;
  readonly tone: AcademicVisualTone;
}

export interface AcademicCardVisual {
  readonly src: string;
  readonly alt: string;
  readonly credit: string;
}

export const ACADEMIC_HERO_VISUALS: readonly AcademicHeroVisual[] = [
  {
    src: '/assets/design/academic-heritage.jpg',
    alt: 'African cultural gathering and heritage expression',
    label: 'Culture treated as knowledge, not decoration',
    credit: 'Sankofa academic visual archive',
    tone: 'culture',
  },
  {
    src: '/assets/design/academic-science.jpg',
    alt: 'African scholar using a laptop in a contemporary learning space',
    label: 'Modern study with African intellectual posture',
    credit: 'Sankofa academic visual archive',
    tone: 'study',
  },
  {
    src: '/assets/design/academic-governance.jpg',
    alt: 'Scholars reviewing documents in a governance setting',
    label: 'Policy, law, and institutional judgement',
    credit: 'Sankofa academic visual archive',
    tone: 'systems',
  },
  {
    src: '/assets/design/academic-health.jpg',
    alt: 'African agricultural field work in a green landscape',
    label: 'Land, food, climate, and public life',
    credit: 'Sankofa academic visual archive',
    tone: 'research',
  },
];

export function slugifyAcademic(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function academicIconForName(value: string): string {
  const name = value.toLowerCase();
  if (name.includes('health') || name.includes('medicine') || name.includes('pharmacy') || name.includes('pharmaceutical') || name.includes('biomedical')) return 'fa-heart-pulse';
  if (name.includes('computing') || name.includes('data') || name.includes('digital') || name.includes('robotics') || name.includes('ai') || name.includes('telecommunication')) return 'fa-microchip';
  if (name.includes('law') || name.includes('justice') || name.includes('governance') || name.includes('diplomacy') || name.includes('policy')) return 'fa-scale-balanced';
  if (name.includes('agriculture') || name.includes('food') || name.includes('climate') || name.includes('environment') || name.includes('water') || name.includes('ecology')) return 'fa-leaf';
  if (name.includes('divine') || name.includes('religion') || name.includes('spiritual') || name.includes('wisdom') || name.includes('sacred')) return 'fa-dove';
  if (name.includes('arts') || name.includes('media') || name.includes('language') || name.includes('creative') || name.includes('culture')) return 'fa-palette';
  if (name.includes('engineering') || name.includes('manufacturing') || name.includes('energy') || name.includes('infrastructure')) return 'fa-gears';
  if (name.includes('mathemat') || name.includes('quantitative') || name.includes('statistics')) return 'fa-square-root-variable';
  if (name.includes('space') || name.includes('aerospace') || name.includes('satellite')) return 'fa-satellite';
  if (name.includes('security') || name.includes('peace') || name.includes('strategic')) return 'fa-shield-halved';
  return 'fa-building-columns';
}

export function academicImageForName(value: string): AcademicCardVisual {
  const name = value.toLowerCase();

  if (name.includes('health') || name.includes('medicine') || name.includes('pharmacy') || name.includes('pharmaceutical') || name.includes('biomedical') || name.includes('laboratory')) {
    return {
      src: '/assets/design/academic-health.jpg',
      alt: 'African agricultural and public health field context',
      credit: 'Sankofa academic visual archive',
    };
  }

  if (name.includes('computing') || name.includes('data') || name.includes('digital') || name.includes('robotics') || name.includes('ai') || name.includes('telecommunication') || name.includes('software')) {
    return {
      src: '/assets/design/academic-science.jpg',
      alt: 'African scholar using a laptop in a contemporary learning space',
      credit: 'Sankofa academic visual archive',
    };
  }

  if (name.includes('law') || name.includes('justice') || name.includes('governance') || name.includes('diplomacy') || name.includes('policy') || name.includes('security') || name.includes('peace')) {
    return {
      src: '/assets/design/academic-governance.jpg',
      alt: 'Scholars reviewing documents in a governance setting',
      credit: 'Sankofa academic visual archive',
    };
  }

  if (name.includes('agriculture') || name.includes('food') || name.includes('climate') || name.includes('environment') || name.includes('water') || name.includes('ecology') || name.includes('hemp')) {
    return {
      src: '/assets/design/academic-health.jpg',
      alt: 'African agricultural field work in a green landscape',
      credit: 'Sankofa academic visual archive',
    };
  }

  if (name.includes('divine') || name.includes('religion') || name.includes('spiritual') || name.includes('wisdom') || name.includes('sacred') || name.includes('civilisation') || name.includes('indigenous')) {
    return {
      src: '/assets/design/academic-heritage.jpg',
      alt: 'African cultural gathering and heritage expression',
      credit: 'Sankofa academic visual archive',
    };
  }

  if (name.includes('arts') || name.includes('media') || name.includes('language') || name.includes('creative') || name.includes('culture') || name.includes('tourism')) {
    return {
      src: '/assets/design/academic-heritage.jpg',
      alt: 'African cultural gathering and heritage expression',
      credit: 'Sankofa academic visual archive',
    };
  }

  if (name.includes('engineering') || name.includes('manufacturing') || name.includes('energy') || name.includes('infrastructure') || name.includes('architecture') || name.includes('urban') || name.includes('transport') || name.includes('space') || name.includes('aerospace')) {
    return {
      src: '/assets/design/academic-science.jpg',
      alt: 'African scholar using a laptop in a contemporary learning space',
      credit: 'Sankofa academic visual archive',
    };
  }

  if (name.includes('business') || name.includes('finance') || name.includes('banking') || name.includes('trade') || name.includes('entrepreneurship') || name.includes('logistics')) {
    return {
      src: '/assets/design/academic-governance.jpg',
      alt: 'Scholars reviewing documents in a governance setting',
      credit: 'Sankofa academic visual archive',
    };
  }

  if (name.includes('sports') || name.includes('psychology') || name.includes('performance') || name.includes('human development')) {
    return {
      src: '/assets/design/academic-science.jpg',
      alt: 'African scholar using a laptop in a contemporary learning space',
      credit: 'Sankofa academic visual archive',
    };
  }

  return {
    src: '/assets/design/academic-science.jpg',
    alt: 'African scholar using a laptop in a contemporary learning space',
    credit: 'Sankofa academic visual archive',
  };
}

export function collegeRoute(collegeName: string): readonly string[] {
  return ['/academics/colleges', slugifyAcademic(collegeName)];
}

export function schoolRoute(collegeName: string, schoolName: string): readonly string[] {
  return ['/academics/colleges', slugifyAcademic(collegeName), 'schools', slugifyAcademic(schoolName)];
}

export function departmentRoute(collegeName: string, schoolName: string, departmentName: string): readonly string[] {
  return [
    '/academics/colleges',
    slugifyAcademic(collegeName),
    'schools',
    slugifyAcademic(schoolName),
    'departments',
    slugifyAcademic(departmentName),
  ];
}

export function programmeRoute(programme: string): readonly string[] {
  return ['/programmes', slugifyAcademic(programme)];
}

export function programmeLevel(programme: string): string {
  const name = programme.toLowerCase();
  if (name.startsWith('phd')) return 'Doctoral';
  if (name.startsWith('master') || name.startsWith('msc') || name.startsWith('ma ')) return 'Masters';
  if (name.startsWith('diploma')) return 'Diploma';
  if (name.startsWith('certificate')) return 'Certificate';
  if (name.startsWith('mbchb')) return 'Professional degree';
  return 'Undergraduate';
}

export function programmeDuration(programme: string): string {
  const name = programme.toLowerCase();
  if (name.startsWith('phd')) return '3 to 5 years';
  if (name.startsWith('master') || name.startsWith('msc') || name.startsWith('ma ')) return '2 years';
  if (name.startsWith('diploma')) return '2 years';
  if (name.startsWith('certificate')) return '6 to 12 months';
  if (name.startsWith('mbchb')) return '5 years';
  return '3 to 4 years';
}

export function programmeSummary(programme: string, collegeName: string): string {
  const level = programmeLevel(programme).toLowerCase();
  return `${programme} is a ${level} pathway in ${collegeName}, linked to its school, department, and research home.`;
}

const PROGRAMME_STOP_WORDS = new Set([
  'and',
  'the',
  'of',
  'in',
  'for',
  'to',
  'with',
  'systems',
  'system',
  'science',
  'sciences',
  'studies',
  'study',
  'department',
  'school',
  'college',
  'advanced',
  'integrated',
  'management',
  'development',
]);

function keywords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !PROGRAMME_STOP_WORDS.has(word));
}

export function programmesForAcademicNode(
  programmes: readonly string[],
  schoolName: string,
  departmentName?: string,
): readonly string[] {
  const nodeKeywords = new Set([...keywords(schoolName), ...keywords(departmentName ?? '')]);

  if (!nodeKeywords.size) {
    return programmes;
  }

  const scored = programmes
    .map((programme) => {
      const score = keywords(programme).reduce((total, word) => total + (nodeKeywords.has(word) ? 1 : 0), 0);
      return { programme, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.programme.localeCompare(b.programme));

  if (scored.length) {
    return scored.map((item) => item.programme);
  }

  return programmes;
}
