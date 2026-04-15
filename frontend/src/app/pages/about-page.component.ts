import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PurposeCard {
  readonly title: string;
  readonly text: string;
}

interface CoreValue {
  readonly title: string;
  readonly description: string;
}

interface PhilosophyItem {
  readonly title: string;
  readonly summary: string;
  readonly focusAreas: readonly string[];
  readonly details: string;
}

interface GovernanceBody {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly responsibilities: readonly string[];
}

interface LeadershipGroup {
  readonly title: string;
  readonly people: readonly string[];
}

interface ContentGroup {
  readonly title: string;
  readonly items: readonly string[];
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  readonly overviewParagraphs: readonly string[] = [
    'Sankofa Alkebulan University is an independent intellectual and educational initiative dedicated to advancing African knowledge systems, critical scholarship, and transformative research.',
    'Founded on the Akan principle of Sankofa, meaning to go back and retrieve what has been lost, the University believes societies must draw wisdom from their past to build a stronger and more enlightened future.',
    'The institution cultivates a scholarly environment where African history, philosophy, spirituality, governance traditions, and indigenous knowledge are studied with intellectual rigor and dignity.',
    'Through research, writing, dialogue, and academic collaboration, Sankofa promotes the recovery and reinterpretation of African intellectual heritage that has too often been marginalized in global academic discourse.',
    'Its programs and initiatives nurture a community of thinkers committed to ethical leadership, intellectual independence, public engagement, and scholarship that serves truth and human flourishing.',
  ];

  readonly purposeCards: readonly PurposeCard[] = [
    {
      title: 'Our Vision',
      text: 'To become a leading African university renowned for scholarship, intellectual leadership, and the revitalization of African knowledge traditions.',
    },
    {
      title: 'Our Mission',
      text: 'To advance knowledge through rigorous research and innovation, preserve African intellectual traditions, foster ethical leadership, and contribute to sustainable development in Africa and beyond.',
    },
    {
      title: 'Core Functions',
      text: 'Multidisciplinary scholarship, research, teaching, publication, and knowledge dissemination supported by dialogue, collaboration, and public engagement.',
    },
  ];

  readonly coreValues: readonly CoreValue[] = [
    {
      title: 'Academic Freedom',
      description: 'Scholars enjoy freedom of research, teaching, and expression within ethical and scholarly boundaries.',
    },
    {
      title: 'Intellectual Integrity',
      description: 'All academic work adheres to the highest standards of honesty, rigor, and reproducibility.',
    },
    {
      title: 'African Intellectual Renewal',
      description: 'The University prioritizes the preservation and advancement of African knowledge systems.',
    },
    {
      title: 'Ethical Leadership',
      description: 'Scholarship must serve justice, human dignity, and societal transformation.',
    },
    {
      title: 'Global Engagement',
      description: 'International collaborations are pursued while maintaining autonomy and African-centered perspectives.',
    },
    {
      title: 'Inclusivity and Equity',
      description: 'Access, diversity, and gender equality are promoted across programs, research, and governance structures.',
    },
    {
      title: 'Sustainability',
      description: 'Environmental stewardship, social responsibility, and ethical finance guide institutional operations.',
    },
  ];

  readonly philosophyItems: readonly PhilosophyItem[] = [
    {
      title: 'Historical Memory',
      summary: 'Sankofa calls the University to recover wisdom from Africa\'s past and apply it to contemporary realities.',
      focusAreas: [
        'Reclaiming neglected intellectual traditions',
        'Grounding present scholarship in historical memory',
        'Restoring dignity to African knowledge systems',
      ],
      details: 'The institution treats memory as a scholarly resource, not nostalgia, and uses it to shape research, teaching, and public thought for the future.',
    },
    {
      title: 'Multidisciplinary Scholarship',
      summary: 'Research and teaching bridge theology, philosophy, political analysis, cultural studies, and the social sciences.',
      focusAreas: [
        'Cross-disciplinary inquiry rooted in African realities',
        'Publication, dialogue, and collaborative research',
        'Scholarship that speaks to both local and global challenges',
      ],
      details: 'Sankofa positions scholarship as a meeting point for ideas, methods, and traditions capable of addressing complex social questions with rigor and imagination.',
    },
    {
      title: 'Ethical Leadership',
      summary: 'Knowledge is expected to serve justice, human flourishing, and responsible citizenship.',
      focusAreas: [
        'Leadership shaped by integrity and service',
        'Research that informs public policy and social renewal',
        'Formation of scholars committed to the common good',
      ],
      details: 'The University does not separate academic excellence from moral responsibility, and it expects learning to create leaders who can act with wisdom and accountability.',
    },
    {
      title: 'Intellectual Independence',
      summary: 'The University strengthens African intellectual sovereignty by creating space for autonomous thought and rigorous critique.',
      focusAreas: [
        'Independent inquiry beyond inherited colonial frames',
        'Reinterpretation of African philosophies on their own terms',
        'Institution building rooted in confidence and clarity of purpose',
      ],
      details: 'Sankofa encourages scholars to think with intellectual courage, preserving rigor while refusing to treat external epistemologies as the only standard of value.',
    },
    {
      title: 'Global Engagement',
      summary: 'African-centered scholarship is advanced through partnerships, dialogue, and collaboration across borders.',
      focusAreas: [
        'International academic partnerships and exchange',
        'Cross-border research collaboration and innovation networks',
        'Global relevance without losing African-centered identity',
      ],
      details: 'The University engages the world from a position of rootedness, contributing original African perspectives to international conversations on knowledge, identity, and development.',
    },
  ];

  readonly historyParagraphs: readonly string[] = [
    'Sankofa Alkebulan University was established as an intellectual and academic initiative grounded in the conviction that Africa\'s future must be built upon a conscious recovery of its intellectual, spiritual, and cultural heritage.',
    'Its origins lie in a broader movement seeking to reclaim African knowledge traditions that were marginalized during the colonial and post-colonial eras, especially in institutions that prioritized external epistemologies over indigenous philosophies and sciences.',
    'From its early conceptual stages, the University envisioned itself not simply as a traditional educational establishment, but as a center for intellectual restoration where history, philosophy, theology, political studies, cultural analysis, and indigenous knowledge could flourish together.',
    'Over time, that vision expanded into a broader platform for scholarly publication, independent research, public intellectual dialogue, and initiatives that strengthen African intellectual sovereignty.',
    'Today, Sankofa Alkebulan University continues to develop as a scholarly platform committed to advancing African scholarship, strengthening collaboration, and contributing to global conversations on knowledge, identity, and cultural renewal.',
  ];

  readonly historyHighlights: readonly string[] = [
    'Recovery of neglected African intellectual traditions',
    'Creation of a scholarly platform for interdisciplinary inquiry',
    'Growth into publication, dialogue, and research leadership',
    'Commitment to African intellectual sovereignty and renewal',
  ];

  readonly governanceBodies: readonly GovernanceBody[] = [
    {
      id: 'founder',
      title: 'Founder',
      description: 'The Founder is the principal custodian of the University\'s philosophical vision and institutional mission.',
      responsibilities: [
        'Provides intellectual direction and strategic guidance',
        'Safeguards fidelity to the principles of Sankofa',
        'Preserves the founding ethos and long-term purpose of the institution',
      ],
    },
    {
      id: 'board',
      title: 'Board of Governance',
      description: 'The Board of Governance is the highest supervisory authority of the University and protects institutional credibility and stability.',
      responsibilities: [
        'Approves major institutional policies',
        'Oversees financial stewardship and sustainability',
        'Ensures compliance with legal and ethical standards',
      ],
    },
    {
      id: 'advisory',
      title: 'Advisory Council',
      description: 'The Advisory Council provides independent advice on academic development, partnerships, and strategic intellectual initiatives.',
      responsibilities: [
        'Guides research direction and academic development',
        'Strengthens international academic collaboration',
        'Supports institutional partnerships and long-range planning',
      ],
    },
    {
      id: 'council',
      title: 'University Council',
      description: 'The University Council serves as the central governing body for institutional administration and policy implementation.',
      responsibilities: [
        'Coordinates operational planning and oversight',
        'Implements the strategic direction established by the Board',
        'Ensures the institution functions in line with Charter and Statutes',
      ],
    },
    {
      id: 'senate',
      title: 'Academic Senate',
      description: 'The Academic Senate is the highest authority on academic matters and safeguards scholarly standards.',
      responsibilities: [
        'Approves academic programs and curricula',
        'Maintains research quality assurance and integrity',
        'Protects academic freedom across teaching and scholarship',
      ],
    },
    {
      id: 'management',
      title: 'Executive Directors',
      description: 'Executive Directors translate University policies into operational programs across administration, finance, technology, and external relations.',
      responsibilities: [
        'Manage day-to-day institutional operations',
        'Lead major functional domains and implementation',
        'Report performance to the University Council and Board',
      ],
    },
  ];

  readonly leadershipGroups: readonly LeadershipGroup[] = [
    {
      title: 'Board of Governance',
      people: ['Prof. Mubiru Kisekwa - Board Member', 'Prof. Mutabazi Assani Mugisha - Board Member'],
    },
    {
      title: 'Advisory Council',
      people: ['Prof. Leslee - Advisory Council Member', 'Prof. Joseph - Advisory Council Member'],
    },
    {
      title: 'Founder & Chancellor',
      people: ['Emmanuel Mihiingo Kaija - Founder and Chancellor'],
    },
    {
      title: 'Academic Senate',
      people: [
        'Prof. Joseph - Senate Member',
        'Prof. Leslee - Senate Member',
        'Prof. Mutabazi Assani Mugisha - Senate Member',
      ],
    },
    {
      title: 'Executive Directors / Management',
      people: [
        'Gumarutahigwa-Bongobingiman Ruhinda - External Relations and Consultancy',
        'Maguru Zagyenda - Information Technology',
        'Michael Masabe - Finance',
        'Dickens Ogira - Operations, Administration, and Human Resources',
      ],
    },
  ];

  readonly charterHighlights: readonly string[] = [
    'Motto: Knowledge Reclaimed, Wisdom Renewed.',
    'The Charter is the supreme governing instrument of the University.',
    'It establishes mission, governance, legal authority, academic frameworks, ethical standards, and institutional ceremonies.',
    'Its provisions align Sankofa with international standards of higher education while centering African thought and identity.',
  ];

  readonly charterArticles: readonly ContentGroup[] = [
    {
      title: 'Establishment and Legal Identity',
      items: [
        'Constitutes Sankofa Alkebulan University as an independent, degree-granting institution with full legal personality.',
        'Authorizes undergraduate, graduate, and doctoral awards in line with recognized standards.',
        'Requires compliance with national laws, regulations, and official institutional branding.',
      ],
    },
    {
      title: 'Motto, Vision, and Mission',
      items: [
        'Affirms the University motto: Knowledge Reclaimed, Wisdom Renewed.',
        'Commits the institution to scholarship, intellectual leadership, and revitalization of African knowledge traditions.',
        'Frames research, innovation, ethical leadership, and sustainable development as core mission priorities.',
      ],
    },
    {
      title: 'Foundational Principles',
      items: [
        'Protects academic freedom and intellectual integrity.',
        'Prioritizes African intellectual renewal and ethical leadership.',
        'Advances inclusivity, equity, sustainability, and global engagement.',
      ],
    },
    {
      title: 'Governance and Academic Authority',
      items: [
        'Defines the authority of the Founder, Board, Advisory Council, University Council, Academic Senate, and Executive Administration.',
        'Establishes faculties, schools, departments, research centers, and academic offices under clear governance structures.',
        'Requires accountability, transparency, and ethical oversight across all bodies.',
      ],
    },
    {
      title: 'Students, Research, and Institutional Traditions',
      items: [
        'Provides for student representation, welfare, counseling, and grievance mechanisms.',
        'Mandates research ethics, integrity, and compliance with international standards.',
        'Recognizes convocation, academic regalia, and African cultural elements as part of institutional identity.',
      ],
    },
    {
      title: 'Authority, Recognition, and Enforcement',
      items: [
        'States that the Charter prevails over all subordinate statutes and policies.',
        'Sets procedures for amendments while protecting the founding mission and principles.',
        'Confirms legal recognition, official certification, and consistent University branding.',
      ],
    },
  ];

  readonly lawCouncilResponsibilities: readonly string[] = [
    'Legal oversight of statutes, policies, and governance frameworks to ensure compliance.',
    'Contractual review for partnerships, memoranda of understanding, and legal agreements.',
    'Risk management to identify and mitigate legal and regulatory risks.',
    'Policy guidance for intellectual property, ethical standards, and internal regulations.',
    'Strategic legal counsel to the Chancellor, Council, and Board for institutional growth and protection.',
  ];

  readonly statuteGroups: readonly ContentGroup[] = [
    {
      title: 'Governance Structure',
      items: [
        'Board of Directors provides overall strategic direction and oversight.',
        'Chancellor offers ceremonial leadership and high-level strategic guidance.',
        'University Council, Academic Senate, and Law Council coordinate policy, academic governance, and legal compliance.',
      ],
    },
    {
      title: 'Management Bodies',
      items: [
        'Executive Directors lead Finance, Operations and HR, Information Technology, and External Relations and Consultancy.',
        'Academic Offices implement academic programs, student services, and faculty support.',
        'Administrative Units ensure policy enforcement, day-to-day operations, and institutional compliance.',
      ],
    },
    {
      title: 'Decision-Making Principles',
      items: [
        'Transparency through open and clear decision-making processes.',
        'Accountability for the actions and performance of each office and officer.',
        'Integrity and collaboration across governance bodies and management units.',
      ],
    },
    {
      title: 'Reporting and Oversight',
      items: [
        'All governance and management bodies report through the Chancellor and Board.',
        'Regular audits, performance reviews, and compliance checks are mandatory.',
        'Oversight frameworks ensure alignment with mission, statutes, and policy commitments.',
      ],
    },
  ];

  readonly policyGroups: readonly ContentGroup[] = [
    {
      title: 'Academic Policies',
      items: [
        'Curriculum design and accreditation benchmarked against international standards.',
        'Assessment, grading, plagiarism control, and appeals processes rooted in academic integrity.',
        'Research, innovation, and intellectual property guided by UNESCO, OECD, and peer review norms.',
      ],
    },
    {
      title: 'Student Policies',
      items: [
        'Transparent, merit-based admissions and enrollment processes.',
        'Student conduct policies centered on ethics, intercultural competence, and global citizenship.',
        'Welfare, counseling, housing, scholarships, and career guidance aligned with strong student support practice.',
      ],
    },
    {
      title: 'Governance and Executive Management',
      items: [
        'Board and Advisory Council oversight for ethical, strategic, and financial integrity.',
        'Founder, Council, Senate, and Executive Directors operating within clear accountability structures.',
        'Global compliance, anti-corruption standards, and multi-year strategic planning embedded in operations.',
      ],
    },
    {
      title: 'Finance and Procurement',
      items: [
        'Financial practice aligned with IFAC and international reporting expectations.',
        'Transparent procurement and competitive bidding processes.',
        'Audit readiness, risk management, and accountability across all financial workflows.',
      ],
    },
    {
      title: 'Technology, Data, and Sustainability',
      items: [
        'ICT policies aligned with ISO 27001 cybersecurity expectations and data protection safeguards.',
        'Digital learning systems managed to recognized e-learning standards.',
        'Health, safety, and sustainability policies aligned with WHO, OSHA, and UN SDG frameworks.',
      ],
    },
    {
      title: 'Collaboration and Continuous Improvement',
      items: [
        'MOUs, joint degrees, and visiting scholar programs guided by international legal frameworks.',
        'Cross-border collaboration prioritized with African and global institutions.',
        'Annual policy reviews and ISO 9001:2015 quality audits keep standards current and measurable.',
      ],
    },
  ];

  readonly jobGroups: readonly ContentGroup[] = [
    {
      title: 'Academic Opportunities',
      items: [
        'Professors and lecturers across faculties and departments',
        'Research fellows and associates',
        'Curriculum designers, academic coordinators, teaching assistants, and laboratory instructors',
      ],
    },
    {
      title: 'Executive Leadership Roles',
      items: [
        'Executive Directors for Finance, Operations and HR, Information Technology, and External Relations and Consultancy',
        'Directors of Academic Affairs, Research, and Innovation',
        'Legal and compliance officers, strategy leaders, and development and fundraising officers',
      ],
    },
    {
      title: 'Administrative and Support Roles',
      items: [
        'Administrative officers, office managers, and student services coordinators',
        'Human resources, procurement, logistics, and communications professionals',
        'IT administrators, e-learning specialists, facilities teams, and safety officers',
      ],
    },
    {
      title: 'Emerging and Specialized Roles',
      items: [
        'Innovation and entrepreneurship officers',
        'International programs and partnerships coordinators',
        'Alumni relations, sustainability, and knowledge management experts',
      ],
    },
    {
      title: 'Internships and Graduate Programs',
      items: [
        'Teaching and research internships',
        'Administrative, operations, and digital learning internships',
        'Leadership and professional development pathways for emerging scholars',
      ],
    },
  ];

  readonly applicationRequirements: readonly string[] = [
    'Detailed CV',
    'Statement of purpose',
    'Professional references',
    'Application through the official University recruitment portal as roles are published',
  ];

  readonly employmentBenefits: readonly string[] = [
    'Competitive compensation aligned with international benchmarks',
    'Professional development, research funding, and global collaboration opportunities',
    'A diverse, inclusive, and equitable work environment',
    'Leadership experience in a foundational and transformative African institution',
  ];

  readonly activePhilosophyIndex = signal(0);

  setPhilosophy(index: number): void {
    this.activePhilosophyIndex.set(index);
  }
}
