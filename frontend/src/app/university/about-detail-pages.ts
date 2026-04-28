export interface AboutNavLink {
  readonly label: string;
  readonly path: string;
  readonly fragment?: string;
}

export interface AboutDetailSection {
  readonly heading: string;
  readonly paragraphs?: readonly string[];
  readonly items?: readonly string[];
}

export interface AboutDetailPage {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly intro: readonly string[];
  readonly highlights: readonly string[];
  readonly sections?: readonly AboutDetailSection[];
}

export const ABOUT_SECTION_LINKS: readonly AboutNavLink[] = [
  { label: 'Founders & Chancellor', path: '/about', fragment: 'founders-chancellor-team' },
  { label: 'Executive Team', path: '/about/executive-team' },
  { label: 'Board of Governance', path: '/about/board-of-governance' },
  { label: 'Advisory Council', path: '/about/advisory-council' },
  { label: 'Research & Scholarly Team', path: '/about/research-scholarly-team' },
  { label: 'History of Sankofa', path: '/about/history-of-sankofa' },
  { label: 'Governance Structure', path: '/about/governance-structure' },
  { label: 'University Council', path: '/about/university-council' },
  { label: 'Academic Senate', path: '/about/academic-senate' },
] as const;

export const ABOUT_RELATED_LINKS: readonly AboutNavLink[] = [
  { label: 'Sankofa Charter', path: '/about/sankofa-charter' },
  { label: 'Sankofa Law Council', path: '/about/sankofa-law-council' },
  { label: 'Statute on Governance & Management', path: '/about/statute-on-governance-and-management' },
  { label: 'University Policies', path: '/about/university-policies' },
  { label: 'Job Opportunities', path: '/about/job-opportunities' },
] as const;

export const ABOUT_DETAIL_PAGES: readonly AboutDetailPage[] = [
  {
    slug: 'history-of-sankofa',
    title: 'History of Sankofa',
    summary: 'The intellectual origin and gradual institutional development of Sankofa Alkebulan University.',
    intro: [
      'Sankofa Alkebulan University was established as an intellectual and academic initiative grounded in the conviction that Africa\'s future must be built upon a conscious recovery of its intellectual, spiritual, and cultural heritage.',
      'Its origins lie in a broader movement seeking to reclaim African knowledge traditions that were marginalized during the colonial and post-colonial eras. The University emerged to create a scholarly platform where African thought could be studied, preserved, and developed with academic rigor.',
      'From its early conceptual stages, Sankofa envisioned itself as a center for intellectual restoration where history, philosophy, theology, political studies, cultural analysis, and indigenous knowledge systems could flourish together.',
      'Over time, the vision expanded into scholarly publication, independent research, public intellectual dialogue, and initiatives that strengthen African intellectual sovereignty and cultural renewal.',
    ],
    highlights: [
      'Recovery of neglected African knowledge traditions',
      'Interdisciplinary scholarship rooted in historical memory',
      'Growth through publication, dialogue, and research',
      'Commitment to intellectual sovereignty and renewal',
    ],
  },
  {
    slug: 'governance-structure',
    title: 'Governance Structure',
    summary: 'A coordinated framework of visionary leadership, policy oversight, academic authority, and executive administration.',
    intro: [
      'The governance system of Sankofa Alkebulan University is designed to promote institutional integrity, academic excellence, and responsible leadership.',
      'The University operates through a multi-layered framework that combines strategic guidance, academic standards, legal oversight, and operational management.',
      'Each body within the system has a clear responsibility so that Sankofa\'s growth remains mission aligned, ethically accountable, and academically rigorous.',
    ],
    highlights: [
      'Founder and Chancellor',
      'Board of Governance',
      'Advisory Council',
      'University Council',
      'Academic Senate',
      'Executive Directors and Academic Offices',
    ],
  },
  {
    slug: 'board-of-governance',
    title: 'Board of Governance',
    summary: 'The highest supervisory authority responsible for strategic oversight, stewardship, and institutional integrity.',
    intro: [
      'The Board of Governance is the highest supervisory authority of the University. It ensures that Sankofa operates in accordance with its Charter, statutes, and long-term objectives.',
      'The Board protects the long-term stability, mission, and credibility of the institution through strategic oversight and principled decision-making.',
    ],
    highlights: [
      'Approves major institutional policies',
      'Oversees financial stewardship and sustainability',
      'Ensures legal and ethical compliance',
      'Protects the University\'s mission and integrity',
    ],
    sections: [
      {
        heading: 'Current Membership',
        items: ['Prof. Mubiru Kisekwa - Board Member', 'Prof. Mutabazi Mugisha - Board Member'],
      },
    ],
  },
  {
    slug: 'founder-chancellor',
    title: 'Founder & Chancellor',
    summary: 'The founding office that safeguards Sankofa\'s vision, mission, and philosophical identity.',
    intro: [
      'The Founder is the originator of the University and the principal custodian of its philosophical vision and institutional mission.',
      'The office provides intellectual direction, safeguards the founding principles of Sankofa, and shapes the long-term direction of the institution.',
      'While not confined to day-to-day administration, the Founder and Chancellor carries symbolic and strategic authority in institutional development and external representation.',
    ],
    highlights: [
      'Custodian of the University\'s founding vision',
      'Provides strategic guidance and intellectual direction',
      'Safeguards fidelity to the Sankofa principle',
      'Represents the institution in major public and strategic engagements',
    ],
    sections: [
      {
        heading: 'Current Office Holder',
        items: ['Diana Kaija - Founder', 'Emmanuel Mihiingo Kaija - Founder and Chancellor'],
      },
    ],
  },
  {
    slug: 'university-council',
    title: 'University Council',
    summary: 'The central governing body responsible for administration, institutional planning, and policy implementation.',
    intro: [
      'The University Council serves as the central governing body responsible for institutional administration and policy implementation.',
      'It translates the strategic direction established by the Board of Governance into operational frameworks that guide the University\'s activities.',
      'The Council supervises planning, coordinates major administrative units, and ensures that the University functions effectively in accordance with its statutes.',
    ],
    highlights: [
      'Implements institutional policy',
      'Coordinates planning and operational oversight',
      'Aligns administration with the Charter and Statutes',
      'Supports accountability, performance, and compliance',
    ],
  },
  {
    slug: 'academic-senate',
    title: 'Academic Senate',
    summary: 'The highest authority on academic matters within Sankofa Alkebulan University.',
    intro: [
      'The Academic Senate oversees the intellectual life of the institution and ensures that teaching, research, and scholarly activity meet rigorous academic standards.',
      'Its responsibilities include academic program approval, curriculum oversight, research priorities, quality assurance, and protection of academic freedom and integrity.',
    ],
    highlights: [
      'Approves academic programs and curricula',
      'Maintains research quality assurance and integrity',
      'Protects academic freedom across the University',
      'Guides teaching, scholarship, and academic standards',
    ],
    sections: [
      {
        heading: 'Current Senate Membership',
        items: [
          'Prof. Joseph - Senate Member',
          'Prof. Lessee - Senate Member',
          'Prof. Mutabazi Mugisha - Senate Member',
        ],
      },
    ],
  },
  {
    slug: 'executive-directors',
    title: 'Executive Directors',
    summary: 'Senior administrative leadership responsible for implementation, operations, and institutional delivery.',
    intro: [
      'Executive Directors constitute the senior administrative leadership responsible for implementing institutional policies and managing operational activities.',
      'Each Executive Director typically oversees a specific domain such as external relations, information technology, finance, or operations and human resources.',
      'They ensure that University strategy is translated into practical programs and systems that advance Sankofa\'s mission.',
    ],
    highlights: [
      'Lead key operational and administrative functions',
      'Translate policy into institutional delivery',
      'Support finance, technology, partnerships, and administration',
      'Report performance through governance structures',
    ],
    sections: [
      {
        heading: 'Current Executive Team',
        items: [
          'Prof. Gumaritahigwa Bongobingiman Ruhinda - Executive Team',
          'Mr. Masabe Michael Jackson - Executive Team',
          'Alice Frimpong Sarkodie - Executive Team',
          'Niyonzima Rogers Kabumba - Executive Team',
        ],
      },
    ],
  },
  {
    slug: 'sankofa-charter',
    title: 'Sankofa Charter',
    summary: 'The supreme governing instrument that defines Sankofa\'s mission, authority, standards, and institutional identity.',
    intro: [
      'The Charter establishes Sankofa Alkebulan University as an academic institution devoted to intellectual inquiry, ethical leadership, and the revitalization of African thought within the global academic community.',
      'It defines the University\'s mission, governance framework, academic standards, ethical commitments, and institutional ceremonies while aligning Sankofa with recognized higher education standards.',
    ],
    highlights: [
      'Motto: Knowledge Reclaimed, Wisdom Renewed',
      'Mission, vision, and foundational principles',
      'Governance and legal authority',
      'Research integrity, student welfare, and institutional identity',
    ],
    sections: [
      {
        heading: 'Core Charter Themes',
        items: [
          'Establishment and legal identity',
          'Mission, vision, and guiding principles',
          'Governance structures and academic authority',
          'Research ethics, student representation, and ceremonies',
        ],
      },
    ],
  },
  {
    slug: 'sankofa-law-council',
    title: 'Sankofa Law Council',
    summary: 'The principal legal advisory and oversight body of the University.',
    intro: [
      'The Law Council ensures that Sankofa Alkebulan University operates within the law, maintains compliance with national and international regulations, and upholds the highest standards of governance and institutional integrity.',
      'It works closely with the Board, Chancellor, and University Council so that institutional decisions remain legally sound, ethically guided, and mission aligned.',
    ],
    highlights: [
      'Legal oversight of statutes and governance frameworks',
      'Contractual and partnership review',
      'Risk management and regulatory compliance',
      'Strategic legal counsel for institutional growth',
    ],
  },
  {
    slug: 'statute-on-governance-and-management',
    title: 'Statute on Governance & Management',
    summary: 'The legal and operational framework for administration, leadership, accountability, and reporting.',
    intro: [
      'The Statute on Governance and Management establishes the legal and operational framework for the administration, leadership, and strategic direction of Sankofa Alkebulan University.',
      'It defines the roles, responsibilities, and relationships among governing and management bodies while ensuring transparency, accountability, and alignment with the institution\'s mission.',
    ],
    highlights: [
      'Governance structure across Board, Chancellor, Council, Senate, and Law Council',
      'Management bodies including Executive Directors and Academic Offices',
      'Decision-making principles of transparency, integrity, and collaboration',
      'Regular reporting, audits, and compliance oversight',
    ],
  },
  {
    slug: 'university-policies',
    title: 'University Policies',
    summary: 'Policies that uphold academic excellence, operational integrity, and internationally aware institutional practice.',
    intro: [
      'Sankofa Alkebulan University commits to strong policy frameworks that support academic excellence, operational integrity, research innovation, and Pan-African leadership.',
      'These policies are designed to align with recognized higher education benchmarks while remaining rooted in African scholarship, ethical responsibility, and institutional quality.',
    ],
    highlights: [
      'Academic quality, assessment, and research integrity',
      'Student admissions, welfare, conduct, and citizenship',
      'Governance, finance, procurement, and compliance',
      'Technology, data protection, sustainability, and international collaboration',
    ],
  },
  {
    slug: 'job-opportunities',
    title: 'Job Opportunities',
    summary: 'Founding opportunities for academic, executive, administrative, and emerging professional roles.',
    intro: [
      'As a pre-accreditation institution, Sankofa Alkebulan University is building its founding team and seeking committed, visionary, and talented professionals across academic, administrative, executive, and operational roles.',
      'This is an opportunity to help shape a transformative African institution from its foundation and contribute to a culture of excellence, service, and intellectual renewal.',
    ],
    highlights: [
      'Academic and research opportunities',
      'Executive leadership and compliance roles',
      'Administrative, technology, and student support positions',
      'Internships and professional development pathways',
    ],
    sections: [
      {
        heading: 'Application Requirements',
        items: [
          'Detailed CV',
          'Statement of purpose',
          'Professional references',
          'Submission through the official recruitment portal as vacancies are published',
        ],
      },
    ],
  },
];

export function getAboutDetailPage(slug: string | null): AboutDetailPage | null {
  if (!slug) {
    return null;
  }

  return ABOUT_DETAIL_PAGES.find((page) => page.slug === slug) ?? null;
}
