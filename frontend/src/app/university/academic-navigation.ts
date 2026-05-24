export type AcademicVisualTone = 'study' | 'science' | 'culture' | 'systems' | 'research';

export interface AcademicHeroVisual {
  readonly src: string;
  readonly alt: string;
  readonly label: string;
  readonly credit: string;
  readonly tone: AcademicVisualTone;
  readonly position?: string;
}

export interface AcademicCardVisual {
  readonly src: string;
  readonly alt: string;
  readonly credit: string;
  readonly position?: string;
}

export const ACADEMIC_HERO_VISUALS: readonly AcademicHeroVisual[] = [
  {
    src: '/assets/academics/world-science-intelligence.jpg',
    alt: 'African scholar using a laptop in a bright study setting',
    label: 'Study, technology, and African intellectual confidence',
    credit: 'Sankofa academic visual archive',
    tone: 'study',
    position: '72% center',
  },
  {
    src: '/assets/academics/world-governance-justice.jpg',
    alt: 'Professionals studying documents in a governance and law setting',
    label: 'Policy, law, and institutional judgement',
    credit: 'Sankofa academic visual archive',
    tone: 'systems',
    position: '70% center',
  },
  {
    src: '/assets/academics/world-health-earth.jpg',
    alt: 'Agricultural field work in a green landscape',
    label: 'Land, food, climate, and public life',
    credit: 'Sankofa academic visual archive',
    tone: 'research',
    position: '68% center',
  },
  {
    src: '/assets/academics/world-heritage-civilization.jpg',
    alt: 'African cultural gathering and heritage expression',
    label: 'Culture treated as knowledge, not decoration',
    credit: 'Sankofa academic visual archive',
    tone: 'culture',
    position: '74% center',
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
  if (
    name.includes('health') ||
    name.includes('medicine') ||
    name.includes('pharmacy') ||
    name.includes('pharmaceutical') ||
    name.includes('biomedical')
  )
    return 'fa-heart-pulse';
  if (
    name.includes('computing') ||
    name.includes('data') ||
    name.includes('digital') ||
    name.includes('robotics') ||
    name.includes('ai') ||
    name.includes('telecommunication')
  )
    return 'fa-microchip';
  if (
    name.includes('law') ||
    name.includes('justice') ||
    name.includes('governance') ||
    name.includes('diplomacy') ||
    name.includes('policy')
  )
    return 'fa-scale-balanced';
  if (
    name.includes('agriculture') ||
    name.includes('food') ||
    name.includes('climate') ||
    name.includes('environment') ||
    name.includes('water') ||
    name.includes('ecology')
  )
    return 'fa-leaf';
  if (
    name.includes('divine') ||
    name.includes('religion') ||
    name.includes('spiritual') ||
    name.includes('wisdom') ||
    name.includes('sacred')
  )
    return 'fa-dove';
  if (
    name.includes('arts') ||
    name.includes('media') ||
    name.includes('language') ||
    name.includes('creative') ||
    name.includes('culture')
  )
    return 'fa-palette';
  if (
    name.includes('engineering') ||
    name.includes('manufacturing') ||
    name.includes('energy') ||
    name.includes('infrastructure')
  )
    return 'fa-gears';
  if (name.includes('mathemat') || name.includes('quantitative') || name.includes('statistics'))
    return 'fa-square-root-variable';
  if (name.includes('space') || name.includes('aerospace') || name.includes('satellite'))
    return 'fa-satellite';
  if (name.includes('security') || name.includes('peace') || name.includes('strategic'))
    return 'fa-shield-halved';
  return 'fa-building-columns';
}

const ACADEMIC_CARD_BASE = '/assets/design/academic-cards';

function cardVisual(
  src: string,
  alt: string,
  credit: string,
  position = 'center center',
): AcademicCardVisual {
  return { src, alt, credit, position };
}

function hashAcademicValue(value: string): number {
  return [...value].reduce((hash, char) => Math.imul(31, hash) + char.charCodeAt(0), 7) >>> 0;
}

function pickAcademicVisual(
  value: string,
  visuals: readonly AcademicCardVisual[],
): AcademicCardVisual {
  return visuals[hashAcademicValue(value) % visuals.length];
}

const STUDY_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/academic-science.jpg',
    'African scholar using a laptop in a contemporary learning space',
    'Sankofa academic visual archive',
    '62% center',
  ),
  cardVisual(
    '/assets/design/photo-students.jpg',
    'Students studying together on campus',
    'Sankofa academic visual archive',
    '56% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/education-laptop.jpg`,
    'Learner presenting digital work in a classroom',
    'One Laptop per Child / Openverse',
    '45% center',
  ),
  cardVisual(
    '/assets/student-life-hero-classroom.jpg',
    'Students in a classroom learning environment',
    'Sankofa academic visual archive',
    '56% center',
  ),
];

const SCIENCE_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    `${ACADEMIC_CARD_BASE}/lab-microscopy.jpg`,
    'Research microscope work in a science laboratory',
    'US Army Africa / Openverse',
    '56% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/health-training.jpg`,
    'Laboratory training with microscope and clinical equipment',
    'US Army Africa / Openverse',
    '48% center',
  ),
  cardVisual(
    '/assets/academics/world-science-intelligence.jpg',
    'African scholar using a laptop for study and research',
    'Sankofa academic visual archive',
    '70% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/earth-observation.jpg`,
    'Earth observation image showing Africa, Europe, and the Middle East at night',
    'NASA Goddard / Openverse',
    '50% center',
  ),
];

const HEALTH_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/card-medicine.jpg',
    'Diverse medical team of doctors and nurses in a hospital setting',
    'Pexels',
    '50% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/health-training.jpg`,
    'Health researchers reviewing diagnostic work in a laboratory',
    'US Army Africa / Openverse',
    '52% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/community-health.jpg`,
    'Community health training session with families and practitioners',
    'US Army Africa / Openverse',
    '42% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/lab-microscopy.jpg`,
    'Hands-on biomedical laboratory work',
    'US Army Africa / Openverse',
    '56% center',
  ),
];

const AGRICULTURE_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/card-agriculture.jpg',
    'Farmers working together in a rice field in Nigeria',
    'Pexels',
    '52% center',
  ),
  cardVisual(
    '/assets/academics/world-health-earth.jpg',
    'Agricultural field work in a green landscape',
    'Sankofa academic visual archive',
    '68% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/agriculture-field.jpg`,
    'Agricultural field systems beside a water channel',
    'USAID Mozambique / Openverse',
    '58% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/culinary-nutrition.jpg`,
    'Professional culinary and food preparation training',
    'US Army Africa / Openverse',
    '48% center',
  ),
];

const ENGINEERING_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/card-engineering.jpg',
    'Engineers installing and testing solar power systems at a construction site',
    'Pexels',
    '58% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/water-engineering.jpg`,
    'Water and engineering training session',
    'US Army Africa / Openverse',
    '54% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/architecture-studio.jpg`,
    'Landscape architecture design drawings and planning work',
    'UC Davis Arboretum / Openverse',
    '52% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/aerospace-rocket.jpg`,
    'Rocket launch trail for aerospace systems study',
    'NASA Goddard / Openverse',
    '50% center',
  ),
];

const TECHNOLOGY_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/card-technology.jpg',
    'Scholar working at a laptop in a contemporary technology environment',
    'Pexels',
    '54% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/computer-lab.jpg`,
    'Professional on a campus walkway beside institutional buildings',
    'USDAgov / Openverse',
    '62% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/robotics-fair.jpg`,
    'Students gathered around a robotics project in a learning space',
    'U.S. Embassy Dhaka / Openverse',
    '52% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/telecom-5g-forum.jpg`,
    'Technology policy forum on next-generation telecommunications',
    'ITU Pictures / Openverse',
    '50% center',
  ),
];

const GOVERNANCE_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/card-law.jpg',
    'Professional reviewing legal documents in a formal office setting',
    'Pexels',
    '52% center',
  ),
  cardVisual(
    '/assets/academics/world-governance-justice.jpg',
    'Professionals studying documents in a governance and law setting',
    'Sankofa academic visual archive',
    '70% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/governance-seminar.jpg`,
    'Policy seminar with participants studying a presentation',
    'US Army Africa / Openverse',
    '50% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/business-training.jpg`,
    'Applied training and institutional support session',
    'US Army Africa / Openverse',
    '45% center',
  ),
];

const BUSINESS_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/card-business.jpg',
    'African professional presenting ideas to a colleague in a modern boardroom',
    'Pexels',
    '55% center',
  ),
  cardVisual(
    '/assets/academics/world-governance-justice.jpg',
    'Professionals reviewing documents and data together',
    'Sankofa academic visual archive',
    '70% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/business-training.jpg`,
    'Applied professional training conversation',
    'US Army Africa / Openverse',
    '45% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/telecom-5g-forum.jpg`,
    'Strategic forum audience in a modern conference room',
    'ITU Pictures / Openverse',
    '50% center',
  ),
];

const CULTURE_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/card-culture.jpg',
    'Gathering of people in traditional African attire at a cultural ceremony in Kano, Nigeria',
    'Pexels',
    '52% center',
  ),
  cardVisual(
    '/assets/design/card-arts.jpg',
    'African performers with traditional drums at a vibrant cultural showcase',
    'Pexels',
    '55% center',
  ),
  cardVisual(
    '/assets/design/card-ceremony.jpg',
    'Traditional African ceremony under a vibrant canopy',
    'Pexels',
    '56% center',
  ),
  cardVisual(
    '/assets/academics/world-heritage-civilization.jpg',
    'African cultural gathering and heritage expression',
    'Sankofa academic visual archive',
    '74% center',
  ),
  cardVisual(
    '/assets/design/card-dance.jpg',
    'Women performing a traditional dance in vibrant coloured attire',
    'Pexels',
    '50% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/radio-journalism.jpg`,
    'Journalism student practicing radio presentation',
    'African Union Mission in Somalia / Openverse',
    '38% center',
  ),
];

const COMMUNITY_VISUALS: readonly AcademicCardVisual[] = [
  cardVisual(
    '/assets/design/photo-students.jpg',
    'Students studying together on campus',
    'Sankofa academic visual archive',
    '56% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/community-health.jpg`,
    'Community health and family support training',
    'US Army Africa / Openverse',
    '42% center',
  ),
  cardVisual(
    '/assets/student-life-wellbeing.jpg',
    'Student wellbeing and support setting',
    'Sankofa academic visual archive',
    '58% center',
  ),
  cardVisual(
    `${ACADEMIC_CARD_BASE}/sports-development.jpg`,
    'Sports development leader at an international event',
    'Save the Dream / Openverse',
    '50% center',
  ),
];

export function academicImageForName(value: string): AcademicCardVisual {
  const name = value.toLowerCase();

  if (
    name.includes('laboratory') ||
    name.includes('biochem') ||
    name.includes('microbiology') ||
    name.includes('genetics') ||
    name.includes('biotechnology') ||
    name.includes('chemistry') ||
    name.includes('physics') ||
    name.includes('mathemat') ||
    name.includes('quantitative') ||
    name.includes('statistics')
  ) {
    return pickAcademicVisual(value, SCIENCE_VISUALS);
  }

  if (
    name.includes('health') ||
    name.includes('medicine') ||
    name.includes('pharmacy') ||
    name.includes('pharmaceutical') ||
    name.includes('biomedical') ||
    name.includes('nursing') ||
    name.includes('clinical') ||
    name.includes('epidemiology') ||
    name.includes('public health')
  ) {
    return pickAcademicVisual(value, HEALTH_VISUALS);
  }

  if (
    name.includes('agriculture') ||
    name.includes('food') ||
    name.includes('nutrition') ||
    name.includes('climate') ||
    name.includes('environment') ||
    name.includes('water') ||
    name.includes('ecology') ||
    name.includes('hemp') ||
    name.includes('soil') ||
    name.includes('natural resource') ||
    name.includes('earth') ||
    name.includes('geology') ||
    name.includes('geoscience')
  ) {
    return pickAcademicVisual(value, AGRICULTURE_VISUALS);
  }

  if (
    name.includes('computing') ||
    name.includes('data') ||
    name.includes('digital') ||
    name.includes('robotics') ||
    name.includes('artificial intelligence') ||
    name.includes('telecommunication') ||
    name.includes('software') ||
    name.includes('information technology') ||
    name.includes('cyber') ||
    name.includes('network')
  ) {
    return pickAcademicVisual(value, TECHNOLOGY_VISUALS);
  }

  if (
    name.includes('engineering') ||
    name.includes('manufacturing') ||
    name.includes('energy') ||
    name.includes('infrastructure') ||
    name.includes('architecture') ||
    name.includes('urban') ||
    name.includes('transport') ||
    name.includes('construction') ||
    name.includes('space') ||
    name.includes('aerospace') ||
    name.includes('mechanical') ||
    name.includes('electrical') ||
    name.includes('materials') ||
    name.includes('mining')
  ) {
    return pickAcademicVisual(value, ENGINEERING_VISUALS);
  }

  if (
    name.includes('law') ||
    name.includes('justice') ||
    name.includes('legal') ||
    name.includes('governance') ||
    name.includes('diplomacy') ||
    name.includes('policy') ||
    name.includes('public administration') ||
    name.includes('human rights') ||
    name.includes('security') ||
    name.includes('peace') ||
    name.includes('strategic') ||
    name.includes('defence') ||
    name.includes('intelligence')
  ) {
    return pickAcademicVisual(value, GOVERNANCE_VISUALS);
  }

  if (
    name.includes('business') ||
    name.includes('finance') ||
    name.includes('banking') ||
    name.includes('trade') ||
    name.includes('entrepreneurship') ||
    name.includes('logistics') ||
    name.includes('economics') ||
    name.includes('accounting') ||
    name.includes('commerce') ||
    name.includes('management')
  ) {
    return pickAcademicVisual(value, BUSINESS_VISUALS);
  }

  if (
    name.includes('arts') ||
    name.includes('creative') ||
    name.includes('visual') ||
    name.includes('design') ||
    name.includes('film') ||
    name.includes('performance') ||
    name.includes('music') ||
    name.includes('dance') ||
    name.includes('theatre') ||
    name.includes('media') ||
    name.includes('language') ||
    name.includes('journalism') ||
    name.includes('communication') ||
    name.includes('tourism') ||
    name.includes('hospitality') ||
    name.includes('civilisation') ||
    name.includes('heritage') ||
    name.includes('history') ||
    name.includes('african studies') ||
    name.includes('pan-african') ||
    name.includes('divine') ||
    name.includes('religion') ||
    name.includes('spiritual') ||
    name.includes('wisdom') ||
    name.includes('sacred') ||
    name.includes('indigenous') ||
    name.includes('knowledge system')
  ) {
    return pickAcademicVisual(value, CULTURE_VISUALS);
  }

  if (
    name.includes('education') ||
    name.includes('pedagogy') ||
    name.includes('teacher') ||
    name.includes('curriculum') ||
    name.includes('learning') ||
    name.includes('psychology') ||
    name.includes('social') ||
    name.includes('sociology') ||
    name.includes('anthropology') ||
    name.includes('human development') ||
    name.includes('counselling') ||
    name.includes('sports') ||
    name.includes('kinesiology') ||
    name.includes('physical education')
  ) {
    return pickAcademicVisual(value, COMMUNITY_VISUALS);
  }

  return pickAcademicVisual(value, STUDY_VISUALS);
}

function legacyAcademicImageForName(value: string): AcademicCardVisual {
  const name = value.toLowerCase();

  if (
    name.includes('health') ||
    name.includes('medicine') ||
    name.includes('pharmacy') ||
    name.includes('pharmaceutical') ||
    name.includes('biomedical') ||
    name.includes('nursing') ||
    name.includes('clinical')
  ) {
    return {
      src: '/assets/design/card-medicine.jpg',
      alt: 'Diverse medical team of doctors and nurses in a hospital setting',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('computing') ||
    name.includes('data') ||
    name.includes('digital') ||
    name.includes('robotics') ||
    name.includes('artificial intelligence') ||
    name.includes('telecommunication') ||
    name.includes('software') ||
    name.includes('information technology') ||
    name.includes('cyber')
  ) {
    return {
      src: '/assets/design/card-technology.jpg',
      alt: 'Scholar working at a laptop in a contemporary technology environment',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('law') ||
    name.includes('justice') ||
    name.includes('legal') ||
    name.includes('governance') ||
    name.includes('diplomacy') ||
    name.includes('policy') ||
    name.includes('public administration') ||
    name.includes('human rights')
  ) {
    return {
      src: '/assets/design/card-law.jpg',
      alt: 'Professional reviewing legal documents in a formal office setting',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('security') ||
    name.includes('peace') ||
    name.includes('strategic') ||
    name.includes('defence') ||
    name.includes('intelligence')
  ) {
    return {
      src: '/assets/design/card-law.jpg',
      alt: 'Professional reviewing legal documents in a formal office setting',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('agriculture') ||
    name.includes('food') ||
    name.includes('climate') ||
    name.includes('environment') ||
    name.includes('water') ||
    name.includes('ecology') ||
    name.includes('hemp') ||
    name.includes('soil') ||
    name.includes('natural resource')
  ) {
    return {
      src: '/assets/design/card-agriculture.jpg',
      alt: 'Farmers working together in a rice field in Nigeria',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('divine') ||
    name.includes('religion') ||
    name.includes('spiritual') ||
    name.includes('wisdom') ||
    name.includes('sacred') ||
    name.includes('indigenous') ||
    name.includes('knowledge system')
  ) {
    return {
      src: '/assets/design/card-ceremony.jpg',
      alt: 'Traditional African ceremony — a king in ceremonial attire under a vibrant canopy',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('civilisation') ||
    name.includes('heritage') ||
    name.includes('history') ||
    name.includes('african studies') ||
    name.includes('pan-african')
  ) {
    return {
      src: '/assets/design/card-culture.jpg',
      alt: 'Gathering of people in traditional African attire at a cultural ceremony in Kano, Nigeria',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('arts') ||
    name.includes('creative') ||
    name.includes('visual') ||
    name.includes('design') ||
    name.includes('film') ||
    name.includes('performance')
  ) {
    return {
      src: '/assets/design/card-arts.jpg',
      alt: 'African performers with traditional drums at a vibrant cultural showcase',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('music') ||
    name.includes('dance') ||
    name.includes('theatre') ||
    name.includes('dramatic') ||
    name.includes('cultural expression')
  ) {
    return {
      src: '/assets/design/card-dance.jpg',
      alt: 'Women performing a traditional Zulu dance in vibrant coloured attire',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('media') ||
    name.includes('language') ||
    name.includes('journalism') ||
    name.includes('communication') ||
    name.includes('tourism') ||
    name.includes('hospitality')
  ) {
    return {
      src: '/assets/design/card-culture.jpg',
      alt: 'Gathering of people in traditional African attire at a cultural ceremony in Kano, Nigeria',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('engineering') ||
    name.includes('manufacturing') ||
    name.includes('energy') ||
    name.includes('infrastructure') ||
    name.includes('architecture') ||
    name.includes('urban') ||
    name.includes('transport') ||
    name.includes('construction') ||
    name.includes('space') ||
    name.includes('aerospace') ||
    name.includes('mechanical') ||
    name.includes('electrical')
  ) {
    return {
      src: '/assets/design/card-engineering.jpg',
      alt: 'Engineers installing and testing solar power systems at a construction site',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('business') ||
    name.includes('finance') ||
    name.includes('banking') ||
    name.includes('trade') ||
    name.includes('entrepreneurship') ||
    name.includes('logistics') ||
    name.includes('economics') ||
    name.includes('accounting') ||
    name.includes('commerce') ||
    name.includes('management')
  ) {
    return {
      src: '/assets/design/card-business.jpg',
      alt: 'African professional presenting ideas to a colleague in a modern boardroom',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('sports') ||
    name.includes('kinesiology') ||
    name.includes('physical education')
  ) {
    return {
      src: '/assets/design/card-dance.jpg',
      alt: 'Women performing a traditional Zulu dance in vibrant coloured attire',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('psychology') ||
    name.includes('social') ||
    name.includes('sociology') ||
    name.includes('anthropology') ||
    name.includes('human development') ||
    name.includes('counselling')
  ) {
    return {
      src: '/assets/design/card-business.jpg',
      alt: 'African professional presenting ideas to a colleague in a modern boardroom',
      credit: 'Pexels',
    };
  }

  if (
    name.includes('laboratory') ||
    name.includes('biomedical') ||
    name.includes('biochem') ||
    name.includes('microbiology') ||
    name.includes('genetics')
  ) {
    return {
      src: '/assets/design/card-medicine.jpg',
      alt: 'Diverse medical team of doctors and nurses in a hospital setting',
      credit: 'Pexels',
    };
  }

  /* default — academic study context */
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
  return [
    '/academics/colleges',
    slugifyAcademic(collegeName),
    'schools',
    slugifyAcademic(schoolName),
  ];
}

export function departmentRoute(
  collegeName: string,
  schoolName: string,
  departmentName: string,
): readonly string[] {
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
  if (name.startsWith('master') || name.startsWith('msc') || name.startsWith('ma '))
    return 'Masters';
  if (name.startsWith('diploma')) return 'Diploma';
  if (name.startsWith('certificate')) return 'Certificate';
  if (name.startsWith('mbchb')) return 'Professional degree';
  return 'Undergraduate';
}

export function programmeDuration(programme: string): string {
  const name = programme.toLowerCase();
  if (name.startsWith('phd')) return '3 to 5 years';
  if (name.startsWith('master') || name.startsWith('msc') || name.startsWith('ma '))
    return '2 years';
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
      const score = keywords(programme).reduce(
        (total, word) => total + (nodeKeywords.has(word) ? 1 : 0),
        0,
      );
      return { programme, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.programme.localeCompare(b.programme));

  if (scored.length) {
    return scored.map((item) => item.programme);
  }

  return programmes;
}
