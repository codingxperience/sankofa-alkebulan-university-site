export interface AboutNavLink {
  readonly label: string;
  readonly path: string;
  readonly fragment?: string;
}

export interface AboutDetailSection {
  readonly id?: string;
  readonly heading: string;
  readonly paragraphs?: readonly string[];
  readonly items?: readonly string[];
  readonly groups?: readonly AboutDetailGroup[];
}

export interface AboutDetailGroup {
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
  { label: 'History of Sankofa', path: '/about/history-of-sankofa' },
  { label: 'Governance Structure', path: '/about/governance-structure' },
  { label: 'University Council', path: '/about/university-council' },
  { label: 'Academic Senate', path: '/about/academic-senate' },
] as const;

export const ABOUT_RELATED_LINKS: readonly AboutNavLink[] = [
  { label: 'Sankofa Charter', path: '/about/sankofa-charter' },
  { label: 'Annual Reports', path: '/about/annual-reports' },
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
          'Prof. Leslee Anne - Senate Member',
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
        id: 'preamble',
        heading: '1. Preamble',
        paragraphs: [
          'We, the Founding Authority of Sankofa Alkebulan University, hereby establish this institution as a Pan-African university dedicated to advanced learning, research excellence, and civilisational knowledge production.',
          'This Charter constitutes the supreme institutional framework governing the University\'s legal identity, academic structure, governance system, and operational principles.',
        ],
      },
      {
        id: 'legal-status',
        heading: '2. Legal Status & Authority',
        groups: [
          {
            heading: '2.1 Establishment',
            paragraphs: [
              'The University is established as a private higher education institution in accordance with applicable national higher education laws and regulatory frameworks.',
            ],
          },
          {
            heading: '2.2 Legal Personality',
            paragraphs: ['The University is a body corporate with perpetual succession, empowered to:'],
            items: ['Own, acquire, and dispose of property', 'Enter into contracts', 'Sue and be sued in its own name'],
          },
          {
            heading: '2.3 Regulatory Compliance',
            paragraphs: ['The University shall operate under:'],
            items: ['National Higher Education regulatory authority requirements', 'International academic quality standards'],
          },
        ],
      },
      {
        id: 'institutional-identity',
        heading: '3. Institutional Identity',
        groups: [
          {
            heading: '3.1 Vision',
            paragraphs: [
              'To become a leading Pan-African centre of excellence in science, governance, innovation, and civilisational knowledge systems.',
            ],
          },
          {
            heading: '3.2 Mission',
            paragraphs: [
              'To provide transformative education, produce impactful research, and develop systems-based solutions for African and global development challenges.',
            ],
          },
          {
            heading: '3.3 Philosophy',
            paragraphs: ['The University is guided by:'],
            items: [
              'Epistemic independence',
              'Interdisciplinary systems thinking',
              'African-centred knowledge production',
              'Ethical and socially responsible scholarship',
            ],
          },
        ],
      },
      {
        id: 'core-objectives',
        heading: '4. Core Objectives',
        paragraphs: ['The University shall:'],
        items: [
          'Deliver accredited academic programmes at all levels',
          'Advance research and innovation across disciplines',
          'Promote African indigenous and global knowledge integration',
          'Contribute to policy development and institutional reform',
          'Develop skilled, globally competitive graduates',
          'Foster international academic collaboration',
        ],
      },
      {
        id: 'academic-structure',
        heading: '5. Academic Structure',
        groups: [
          {
            heading: '5.1 Institutional Hierarchy',
            paragraphs: ['The academic system shall be structured as: University -> Colleges -> Schools -> Departments -> Programmes -> Courses.'],
          },
          {
            heading: '5.2 Research Architecture',
            paragraphs: ['Research shall be conducted through:'],
            items: ['Academic Departments', 'Schools', 'Research Institutes (cross-disciplinary systems units)'],
          },
          {
            heading: '5.3 Academic Awards',
            paragraphs: ['The University shall confer:'],
            items: ['Diplomas', 'Bachelor\'s Degrees', 'Master\'s Degrees', 'Doctoral Degrees'],
          },
        ],
      },
      {
        id: 'governance-structure',
        heading: '6. Governance Structure',
        groups: [
          {
            heading: '6.1 University Council (Supreme Authority)',
            paragraphs: ['Mandate:', 'Powers:'],
            items: [
              'Institutional governance and oversight',
              'Financial and strategic control',
              'Appointment of senior leadership',
              'Approves statutes, budgets, and institutional policies',
              'Ensures regulatory compliance',
            ],
          },
          {
            heading: '6.2 University Senate (Academic Authority)',
            paragraphs: ['Mandate: Academic governance and quality assurance.', 'Functions:'],
            items: [
              'Approves curricula and programmes',
              'Regulates examinations and academic standards',
              'Oversees academic integrity',
            ],
          },
          {
            heading: '6.3 Executive Leadership',
            items: [
              'Vice-Chancellor: Chief Executive and Academic Officer of the University',
              'Deputy Vice-Chancellor: Academic Affairs',
              'Deputy Vice-Chancellor: Research & Innovation',
              'Deputy Vice-Chancellor: Finance & Administration',
              'Deputy Vice-Chancellor: Student Affairs',
            ],
          },
        ],
      },
      {
        id: 'academic-governance-units',
        heading: '7. Academic Governance Units',
        groups: [
          {
            heading: '7.1 Colleges',
            items: ['Led by Deans', 'Responsible for disciplinary coordination'],
          },
          {
            heading: '7.2 Schools',
            items: ['Led by School Directors', 'Responsible for programme execution'],
          },
          {
            heading: '7.3 Departments',
            items: ['Led by Heads of Department', 'Responsible for teaching, research, and curriculum delivery'],
          },
        ],
      },
      {
        id: 'research-institutes',
        heading: '8. Research Institutes System',
        groups: [
          {
            heading: '8.1 Status',
            paragraphs: ['Research Institutes are semi-autonomous interdisciplinary units reporting to the DVC Research.'],
          },
          {
            heading: '8.2 Functions',
            items: [
              'Advanced research and innovation',
              'Policy advisory services',
              'Knowledge production and dissemination',
              'Patent and intellectual property generation',
            ],
          },
          {
            heading: '8.3 Governance',
            paragraphs: ['Each Institute shall be led by a Director and governed by a Research Advisory Board.'],
          },
        ],
      },
      {
        id: 'quality-assurance',
        heading: '9. Quality Assurance Framework',
        groups: [
          {
            heading: '9.1 Directorate of Quality Assurance',
            paragraphs: ['Responsible for:'],
            items: [
              'Academic audits',
              'Programme validation',
              'Teaching and learning evaluation',
              'Compliance monitoring',
            ],
          },
          {
            heading: '9.2 External Examination System',
            paragraphs: ['All academic programmes shall be subject to independent external examination.'],
          },
        ],
      },
      {
        id: 'academic-regulations',
        heading: '10. Academic Regulations (Integrated)',
        groups: [
          {
            heading: '10.1 Credit System',
            paragraphs: ['The University shall adopt a standardized credit unit system consistent with international academic frameworks.'],
          },
          {
            heading: '10.2 Programme Approval',
            paragraphs: ['All academic programmes shall:'],
            items: ['Undergo Senate approval', 'Be reviewed periodically', 'Meet regulatory accreditation standards'],
          },
          {
            heading: '10.3 Progression Rules',
            paragraphs: ['Students shall progress based on:'],
            items: ['Academic performance', 'Credit accumulation', 'Programme requirements'],
          },
        ],
      },
      {
        id: 'staffing',
        heading: '11. Staffing and Appointment Framework',
        groups: [
          {
            heading: '11.1 Academic Staff Categories',
            items: ['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Assistant Lecturer'],
          },
          {
            heading: '11.2 Appointment Principles',
            paragraphs: ['Appointments shall be based on:'],
            items: ['Academic merit', 'Research output', 'Teaching competence', 'Professional integrity'],
          },
        ],
      },
      {
        id: 'student-governance',
        heading: '12. Student Governance',
        groups: [
          {
            heading: '12.1 Student Union',
            paragraphs: ['Represents student interests and welfare.'],
          },
          {
            heading: '12.2 Student Affairs Directorate',
            paragraphs: ['Responsible for:'],
            items: ['Welfare services', 'Discipline', 'Counseling and support'],
          },
        ],
      },
      {
        id: 'financial-governance',
        heading: '13. Financial Governance',
        groups: [
          {
            heading: '13.1 Revenue Sources',
            items: ['Tuition fees', 'Research grants', 'Donations and endowments', 'Consultancy services'],
          },
          {
            heading: '13.2 Financial Controls',
            items: ['Annual external audits', 'Transparent budgeting system', 'Council-approved financial policies'],
          },
        ],
      },
      {
        id: 'ethics-integrity',
        heading: '14. Ethics, Integrity & Discipline',
        paragraphs: ['The University shall uphold:', 'A Disciplinary Committee shall enforce compliance.'],
        items: [
          'Academic integrity',
          'Research ethics',
          'Professional conduct standards',
          'Anti-corruption principles',
        ],
      },
      {
        id: 'partnerships',
        heading: '15. Partnerships & Collaboration',
        paragraphs: ['The University may engage with:'],
        items: ['Governments', 'International institutions', 'Industry partners', 'Research organizations'],
      },
      {
        id: 'infrastructure',
        heading: '16. Infrastructure & Delivery Modes',
        paragraphs: ['The University may operate through:'],
        items: [
          'Physical campuses',
          'Digital learning platforms',
          'Hybrid academic delivery systems',
          'Research laboratories and innovation hubs',
        ],
      },
      {
        id: 'amendment',
        heading: '17. Amendment of the Charter',
        paragraphs: ['This Charter may be amended by:'],
        items: [
          'University Council',
          'Upon recommendation of Senate',
          'In compliance with national regulatory requirements',
        ],
      },
      {
        id: 'commencement',
        heading: '18. Commencement',
        paragraphs: ['This Charter shall take effect upon:'],
        items: ['Approval by the Governing Council', 'Recognition by the relevant regulatory authority'],
      },
      {
        id: 'seal',
        heading: '19. Seal of the University',
        paragraphs: ['The University shall maintain an official seal for:'],
        items: [
          'Degree certification',
          'Legal documentation',
          'Institutional authentication',
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
    slug: 'annual-reports',
    title: 'Annual Reports',
    summary: 'A public reporting home for institutional progress, finances, governance, and academic development.',
    intro: [
      'Annual reporting at Sankofa Alkebulan University is designed to keep the institution accountable to its mission, students, partners, and governing bodies.',
      'Reports will organize progress across academic development, research activity, student access, governance, finances, quality assurance, and public impact.',
    ],
    highlights: [
      'Academic and research progress',
      'Admissions, access, and student support reporting',
      'Governance and quality assurance updates',
      'Financial stewardship and public accountability',
    ],
    sections: [
      {
        heading: 'Reporting Areas',
        items: [
          'Academic programmes, colleges, schools, and departments',
          'Research institutes, publications, and policy outputs',
          'Student life, scholarships, access, and welfare indicators',
          'Governance, finance, risk, and compliance updates',
        ],
      },
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
