export type AcademicVisualTone = 'study' | 'science' | 'culture' | 'systems' | 'research';

export interface AcademicHeroVisual {
  readonly src: string;
  readonly alt: string;
  readonly label: string;
  readonly credit: string;
  readonly tone: AcademicVisualTone;
}

export const ACADEMIC_HERO_VISUALS: readonly AcademicHeroVisual[] = [
  {
    src: 'https://images.pexels.com/photos/34162714/pexels-photo-34162714.jpeg?auto=compress&cs=tinysrgb&w=1600',
    alt: 'African learners studying together in a classroom',
    label: 'Learning environments shaped around serious attention',
    credit: 'Photo: Tosin Olowoleni / Pexels',
    tone: 'study',
  },
  {
    src: 'https://images.pexels.com/photos/8197511/pexels-photo-8197511.jpeg?auto=compress&cs=tinysrgb&w=1600',
    alt: 'University students studying in a lecture room',
    label: 'Programme pathways with a clear academic home',
    credit: 'Photo: Monstera Production / Pexels',
    tone: 'systems',
  },
  {
    src: 'https://images.pexels.com/photos/7683734/pexels-photo-7683734.jpeg?auto=compress&cs=tinysrgb&w=1600',
    alt: 'Students studying outdoors with books and digital tools',
    label: 'Schools, departments, and peer academic formation',
    credit: 'Photo: RDNE Stock project / Pexels',
    tone: 'study',
  },
  {
    src: 'https://images.pexels.com/photos/8325912/pexels-photo-8325912.jpeg?auto=compress&cs=tinysrgb&w=1600',
    alt: 'Researcher working in a laboratory',
    label: 'Research institutes connect teaching to public evidence',
    credit: 'Photo: Mikhail Nilov / Pexels',
    tone: 'science',
  },
  {
    src: 'https://images.pexels.com/photos/7683896/pexels-photo-7683896.jpeg?auto=compress&cs=tinysrgb&w=1600',
    alt: 'Students collaborating in a modern learning setting',
    label: 'A collegiate system built for movement, not confusion',
    credit: 'Photo: RDNE Stock project / Pexels',
    tone: 'culture',
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
  return `${programme} is a ${level} pathway housed in ${collegeName}, connected to school-level teaching, departmental ownership, and research alignment.`;
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