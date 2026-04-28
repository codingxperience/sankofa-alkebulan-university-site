export interface TeamCategory {
  readonly id: string;
  readonly anchor: string;
  readonly label: string;
}

export interface TeamContact {
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

export interface TeamMember {
  readonly slug: string;
  readonly name: string;
  readonly role: string;
  readonly image: string;
  readonly categories: readonly string[];
  readonly summary: string;
  readonly profile: readonly string[];
  readonly contacts?: readonly TeamContact[];
  readonly objectPosition?: string;
}

export interface TeamCategoryGroup extends TeamCategory {
  readonly members: readonly TeamMember[];
}

export const TEAM_CATEGORIES: readonly TeamCategory[] = [
  {
    id: 'founders',
    anchor: 'founders-chancellor-team',
    label: 'Founders & Chancellor',
  },
  {
    id: 'executive',
    anchor: 'executive-team',
    label: 'Executive Team',
  },
  {
    id: 'board',
    anchor: 'board-governance-team',
    label: 'Board of Governance',
  },
  {
    id: 'advisory',
    anchor: 'advisory-council-team',
    label: 'Advisory Council',
  },
  {
    id: 'research-scholarly',
    anchor: 'research-scholarly-team',
    label: 'Research & Scholarly Team',
  },
] as const;

export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    slug: 'emmanuel-mihiingo-kaija',
    name: 'Emmanuel Mihiingo Kaija',
    role: 'Founder & Chancellor',
    image: '/assets/about/sankofa-founder.jpeg',
    objectPosition: '50% 22%',
    categories: ['founders'],
    summary: 'Founding custodian of the University vision and Sankofa-centered institutional identity.',
    profile: [
      'Provides founding direction for Sankofa Alkebulan University and its commitment to African intellectual renewal, ethical leadership, and scholarship that serves public purpose.',
    ],
    contacts: [
      { label: 'Phone', value: '0765871126', href: 'tel:0765871126' },
      { label: 'Phone', value: '0706938536', href: 'tel:0706938536' },
    ],
  },
  {
    slug: 'diana-kaija',
    name: 'Diana Kaija',
    role: 'Founder',
    image: '/assets/team/diana-kaija.jpeg',
    categories: ['founders'],
    summary: 'Supports the founding mission, community spirit, and long-range Sankofa vision.',
    profile: [
      'Contributes to the founding identity of the University and its commitment to restoring knowledge, building confidence, and strengthening African-centered educational pathways.',
    ],
    objectPosition: '54% 32%',
  },
  {
    slug: 'prof-gumaritahigwa-bongobingiman-ruhinda',
    name: 'Prof. Gumaritahigwa Bongobingiman Ruhinda',
    role: 'Executive Team',
    image: '/assets/team/Prof. Gumaritahigwa Bongobingiman Ruhinda.jpeg',
    categories: ['executive'],
    summary: 'Executive leadership supporting the University\'s scholarly and institutional formation.',
    profile: [
      'Serves within the executive leadership structure as Sankofa develops its academic, cultural, and public scholarship systems.',
    ],
    objectPosition: '56% 24%',
  },
  {
    slug: 'mr-masabe-michael-jackson',
    name: 'Mr. Masabe Michael Jackson',
    role: 'Executive Team',
    image: '/assets/team/mr-masabe-michael-jackson.jpeg',
    categories: ['executive'],
    summary: 'Executive team member supporting institutional administration and implementation.',
    profile: [
      'Supports practical execution across the University\'s administrative and development priorities as Sankofa builds deployable systems for students, faculty, and partners.',
    ],
    objectPosition: '72% 24%',
  },
  {
    slug: 'alice-frimpong-sarkodie',
    name: 'Alice Frimpong Sarkodie',
    role: 'Executive Team',
    image: '/assets/team/alice-frimpong-sarkodie.jpeg',
    categories: ['executive'],
    summary: 'Executive team member advancing institutional presence, coordination, and engagement.',
    profile: [
      'Contributes to Sankofa\'s executive work through brand presence, engagement, and the disciplined coordination needed to move an emerging university from vision to operating reality.',
    ],
    objectPosition: '50% 22%',
  },
  {
    slug: 'niyonzima-rogers-kabumba',
    name: 'Niyonzima Rogers Kabumba',
    role: 'Executive Team',
    image: '/assets/team/niyonzima-rogers-kabumba.jpeg',
    categories: ['executive'],
    summary: 'Executive team member supporting institutional growth and operational readiness.',
    profile: [
      'Supports the University\'s executive development work, helping align institutional operations with Sankofa\'s academic and community-facing mission.',
    ],
    objectPosition: '50% 20%',
  },
  {
    slug: 'prof-mutabazi-mugisha',
    name: 'Prof. Mutabazi Mugisha',
    role: 'Board of Governance',
    image: '/assets/team/prof-mutabazi-mugisha.jpeg',
    categories: ['board'],
    summary: 'Governance member supporting oversight, credibility, and academic direction.',
    profile: [
      'Serves within the Board of Governance, supporting institutional stewardship, policy direction, and the stable growth of Sankofa Alkebulan University.',
    ],
    objectPosition: '50% 25%',
  },
  {
    slug: 'prof-mubiru-kisekwa',
    name: 'Prof. Mubiru Kisekwa',
    role: 'Board of Governance',
    image: '/assets/team/prof-mubiru-kisekwa.jpeg',
    categories: ['board'],
    summary: 'Governance member contributing to institutional oversight and long-range stability.',
    profile: [
      'Supports the Board of Governance in safeguarding Sankofa\'s institutional mission, development priorities, and standards of responsible leadership.',
    ],
    objectPosition: '50% 30%',
  },
  {
    slug: 'prof-lessee-and-joseph',
    name: 'Prof. Lessee and Prof. Joseph',
    role: 'Advisory Council',
    image: '/assets/team/prof-lessee-and-joseph.jpeg',
    categories: ['advisory'],
    summary: 'Advisory council members supporting academic perspective and partnership wisdom.',
    profile: [
      'Serve in an advisory capacity to strengthen Sankofa\'s academic direction, partnership culture, and international scholarly relationships.',
    ],
    objectPosition: '50% 32%',
  },
  {
    slug: 'obi-onyeigwe',
    name: 'Obi Onyeigwe',
    role: 'Advisory Council',
    image: '/assets/team/obi-onyeigwe.jpeg',
    categories: ['advisory'],
    summary: 'Peacebuilder, development practitioner, and researcher working across policy, youth leadership, gender justice, and community resilience.',
    profile: [
      'Obi Onyeigwe is a devoted African, multidisciplinary peacebuilder, development practitioner, and researcher committed to advancing peace, social justice, and inclusive development across Africa.',
      'He works at the intersection of research, policy, and grassroots transformation, with experience spanning youth leadership, interfaith dialogue, governance, public health advocacy, gender justice, and community resilience.',
      'He is Co-Founder and leader of Youths for Peacebuilding & Development in Africa (YOUPEDA), a youth-driven organization focused on peacebuilding, conflict prevention, youth empowerment, women\'s leadership, and innovative responses to emerging social challenges.',
      'His intellectual interests center on how African-led solutions, youth innovation, and local languages can transform education, research, leadership, and scientific breakthroughs.',
    ],
    objectPosition: '50% 24%',
  },
  {
    slug: 'mukashema-winnie',
    name: 'Am. Mukashema Winnie',
    role: 'Research & Scholarly Team',
    image: '/assets/team/mukashema-winnie.jpeg',
    categories: ['research-scholarly'],
    summary: 'Research and scholarly team member supporting academic coordination and knowledge development.',
    profile: [
      'Supports Sankofa\'s research and scholarly work through academic coordination, knowledge development, and contributor engagement.',
    ],
    contacts: [
      { label: 'Email', value: 'mukashemawinnie69@gmail.com', href: 'mailto:mukashemawinnie69@gmail.com' },
    ],
    objectPosition: '50% 24%',
  },
  {
    slug: 'musemeza-jonah',
    name: 'Musemeza Jonah',
    role: 'Research & Scholarly Team',
    image: '/assets/team/musemeza-jonah.jpeg',
    categories: ['research-scholarly'],
    summary: 'Research and scholarly team member contributing to academic programs and knowledge systems.',
    profile: [
      'Contributes to Sankofa\'s scholarly development work, supporting research pathways, academic organization, and African-centered knowledge systems.',
    ],
    objectPosition: '50% 24%',
  },
  {
    slug: 'chinaza-ekeoma',
    name: 'Chinaza Ekeoma',
    role: 'Research & Scholarly Team',
    image: '/assets/team/chinaza-ekeoma.jpeg',
    categories: ['research-scholarly'],
    summary: 'Research and scholarly team member supporting inquiry, documentation, and institutional knowledge work.',
    profile: [
      'Supports Sankofa\'s research culture through inquiry, documentation, and the careful development of institutional scholarly records.',
    ],
    objectPosition: '50% 24%',
  },
  {
    slug: 'musanjufu-benjamin-kavubu',
    name: 'Musanjufu Benjamin Kavubu',
    role: 'Executive Director - Student Affairs',
    image: '/assets/team/musanjufu-benjamin-kavubu.jpeg',
    categories: ['research-scholarly'],
    summary: 'Executive Director for Student Affairs supporting student-facing systems and academic community development.',
    profile: [
      'Supports student affairs, learner engagement, and the practical student-facing systems needed for Sankofa\'s academic community.',
    ],
    objectPosition: '50% 22%',
  },
] as const;

export const TEAM_CATEGORY_GROUPS: readonly TeamCategoryGroup[] = TEAM_CATEGORIES.map((category) => ({
  ...category,
  members: TEAM_MEMBERS.filter((member) => member.categories.includes(category.id)),
}));

export function getTeamMember(slug: string | null): TeamMember | null {
  if (!slug) {
    return null;
  }

  return TEAM_MEMBERS.find((member) => member.slug === slug) ?? null;
}

export function getTeamCategoryGroup(categoryId: string | null): TeamCategoryGroup | null {
  if (!categoryId) {
    return null;
  }

  return TEAM_CATEGORY_GROUPS.find((category) => category.id === categoryId) ?? null;
}

export function getTeamCategoryLabel(categoryId: string): string {
  return TEAM_CATEGORIES.find((category) => category.id === categoryId)?.label ?? 'Leadership';
}
