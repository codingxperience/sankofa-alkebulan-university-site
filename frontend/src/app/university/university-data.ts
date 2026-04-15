export interface HeroBanner {
  readonly title: string;
  readonly subtitle: string;
  readonly ctaLabel: string;
  readonly ctaPath: string;
}

export interface HighlightStat {
  readonly label: string;
  readonly value: string;
}

export interface PortalModule {
  readonly heading: string;
  readonly items: readonly string[];
}

export interface PortalPage {
  readonly slug: string;
  readonly path: string;
  readonly navLabel: string;
  readonly title: string;
  readonly description: string;
  readonly modules: readonly PortalModule[];
  readonly highlights: readonly HighlightStat[];
}

export const UNIVERSITY_HERO_BANNERS: readonly HeroBanner[] = [
  {
    title: 'Admissions 2026 Intake Is Open',
    subtitle: 'Domestic and international applicants can begin AI-guided applications today.',
    ctaLabel: 'Start Application',
    ctaPath: '/admissions',
  },
  {
    title: 'Research Highlight: Pan-African Innovation Labs',
    subtitle: '18 institutes advancing health, governance, AI, climate, and community solutions.',
    ctaLabel: 'Explore Research',
    ctaPath: '/research-innovation',
  },
  {
    title: 'Global Conferences and Hybrid Learning',
    subtitle: 'Join virtual and on-campus events designed for continental and global scholars.',
    ctaLabel: 'View Events',
    ctaPath: '/events-conferences',
  },
  {
    title: 'Strategic Partnerships Across Africa and Beyond',
    subtitle: 'Expanding university alliances for mobility, funding, and impact.',
    ctaLabel: 'See Partnerships',
    ctaPath: '/partnerships-global',
  },
];

export const FACULTIES_AND_SCHOOLS: readonly string[] = [
  'Schools',
  'School of Business, Economics, and Entrepreneurship',
  'Graduate School',
  'School of Education',
  'School of Technology, Computing & Engineering',
  'Law School',
  'Institutes',
  'Institute of Public Health & Health Sciences',
  'Institute of African Culture, Science and Technology (IACST)',
  'College of African Civilizational Studies',
  'College of Theology and Religious Studies',
  'College of Humanities and Cultural Studies',
  'College of Leadership and Governance',
  'College of Science, Technology, and Innovation',
  'School of Global Education and International Relations',
  'College of Health Sciences and Biomedical Studies',
  'School of Environmental and Sustainability Studies',
  'School of Agriculture and Food Security',
  'School of Engineering and Applied Technologies',
  'College of Social Sciences and Public Policy',
  'School of Creative Arts, Music, and Media',
  'School of Mathematics, Data Science, and AI',
  'School of Psychology, Behavioral, and Cognitive Sciences',
  'School of Tourism, Hospitality, and Cultural Heritage',
  'School of Space, Astronomy, and Earth Sciences',
];

export const RESEARCH_INSTITUTES: readonly string[] = [
  'Institute for Pan-African Studies',
  'Center for Indigenous Knowledge Systems',
  'African Theology and Spiritual Traditions Institute',
  'African Governance and Policy Institute',
  'Center for Science, Technology and Innovation Policy',
  'Center for Social Justice and Human Rights',
  'Pan-African Health and Biomedical Research Institute',
  'Institute for Climate, Environment and Sustainability',
  'Digital Humanities and Knowledge Management Center',
  'Center for Artificial Intelligence and Robotics',
  'Center for Renewable Energy and Smart Infrastructure',
  'Institute for Water, Agriculture and Food Security Research',
  'Center for Global Education and International Development',
  'Institute for Space, Astronomy and Earth Observation',
  'Center for Behavioral and Cognitive Sciences Research',
  'Institute for Cultural Heritage, Arts and Media Studies',
  'Center for Entrepreneurship, Innovation and Economic Development',
  'Institute for Policy, Peace, and Conflict Resolution',
];

export const UNIVERSITY_PORTAL_PAGES: readonly PortalPage[] = [
  {
    slug: 'about',
    path: 'about',
    navLabel: 'About',
    title: 'About Sankofa Alkebulan University',
    description:
      'Our transition to university status builds on legacy, mission, Pan-African philosophy, and measurable institutional impact.',
    modules: [
      {
        heading: 'Overview and Philosophy',
        items: [
          'University overview, history, and legacy',
          'Mission, vision, Pan-African philosophy, and Sankofa principles',
          "Founder welcome message and strategic goals",
        ],
      },
      {
        heading: 'Institutional Story',
        items: [
          'Timeline of milestones, achievements, and awards',
          'Strategic partners and endorsements',
          'Campus map with virtual reality tour',
        ],
      },
      {
        heading: 'Evidence of Excellence',
        items: [
          'University facts and infographics',
          'Testimonials and alumni stories',
          'Global rankings and accreditation showcases',
        ],
      },
    ],
    highlights: [
      { label: 'Legacy Track', value: 'Institute to University' },
      { label: 'Continental Reach', value: 'Pan-African Network' },
      { label: 'Global Positioning', value: 'QS/THE/ARWU Ready' },
    ],
  },
  {
    slug: 'governance-compliance',
    path: 'governance-compliance',
    navLabel: 'Governance',
    title: 'Governance and Compliance',
    description:
      'Transparent governance, ethical oversight, and digital compliance systems for a trusted institution.',
    modules: [
      {
        heading: 'Governance Bodies',
        items: [
          'Board of Trustees, University Council, Academic Senate',
          'Research Ethics Board and oversight committees',
          'Executive leadership offices and registrar secretariat',
        ],
      },
      {
        heading: 'Policy and Quality',
        items: [
          'Charter, constitution, strategic plan, annual reports',
          'National, AU, and international quality assurance',
          'Legal notices and reports archive',
        ],
      },
      {
        heading: 'Digital Accountability',
        items: [
          'Board minutes and policy dashboards',
          'Institutional ethics and whistleblower portal',
          'AI governance analytics for compliance tracking',
        ],
      },
    ],
    highlights: [
      { label: 'Compliance Model', value: 'Policy + AI Insights' },
      { label: 'Transparency', value: 'Public Dashboards' },
      { label: 'Ethics', value: 'Whistleblower Enabled' },
    ],
  },
  {
    slug: 'admissions',
    path: 'admissions',
    navLabel: 'Admissions',
    title: 'Admissions',
    description:
      'A complete admissions pipeline for domestic and international learners with AI-enabled support.',
    modules: [
      {
        heading: 'Application Journey',
        items: [
          'Online application portal for domestic and international applicants',
          'Application requirements, eligibility, and document uploads',
          'Status tracking with automated notifications',
        ],
      },
      {
        heading: 'Affordability',
        items: [
          'Tuition, scholarships, bursaries, and financial aid',
          'Global scholarship and mobility integrations',
          'Accessibility features for disabled applicants',
        ],
      },
      {
        heading: 'Guidance and Support',
        items: [
          'AI-powered predictive admissions and personalized guidance',
          'Virtual open days, webinars, and chatbot Q and A',
          'Admissions FAQ and live chat support',
        ],
      },
    ],
    highlights: [
      { label: 'Admissions Support', value: 'AI + Live Advising' },
      { label: 'Application Modes', value: 'Domestic + International' },
      { label: 'Funding Access', value: 'Scholarships and Aid' },
    ],
  },
  {
    slug: 'faculties-schools',
    path: 'faculties-schools',
    navLabel: 'Faculties',
    title: 'Faculties and Schools',
    description:
      'Eighteen colleges and schools organized for multidisciplinary scholarship and transformative practice.',
    modules: [
      {
        heading: 'Academic Structure',
        items: FACULTIES_AND_SCHOOLS,
      },
      {
        heading: 'For Every College and School',
        items: [
          'Department pages and program offerings',
          'Faculty profiles, research portfolios, and publications',
          'Course syllabi, learning outcomes, and credits',
          'AI-powered personalized learning paths',
          'Student and alumni success stories',
          'Industry partnerships, incubators, and innovation hubs',
        ],
      },
    ],
    highlights: [
      { label: 'Colleges and Schools', value: '18' },
      { label: 'Learning Design', value: 'Outcome-Based' },
      { label: 'Career Ecosystem', value: 'Industry Integrated' },
    ],
  },
  {
    slug: 'programs',
    path: 'programs',
    navLabel: 'Programs',
    title: 'Programs',
    description:
      'From certificates to doctorates, each program includes outcomes, credit design, mentorship, and progression pathways.',
    modules: [
      {
        heading: 'Program Levels',
        items: [
          'Certificates and diplomas',
          'Bachelors, masters, and doctorates',
          'Flexible progression and stackable credentials',
        ],
      },
      {
        heading: 'Academic Detail',
        items: [
          'Detailed modules, outcomes, credits, and duration',
          'Faculty advisors and mentorship integration',
          'Application and enrollment links by program',
        ],
      },
      {
        heading: 'Learner Outcomes',
        items: [
          'Alumni success pathways',
          'AI-enhanced learning path recommendations',
          'Career-aligned specialization tracks',
        ],
      },
    ],
    highlights: [
      { label: 'Credentials', value: 'Certificate to PhD' },
      { label: 'Mentorship', value: 'Advisor-Embedded' },
      { label: 'Personalization', value: 'AI Learning Paths' },
    ],
  },
  {
    slug: 'research-innovation',
    path: 'research-innovation',
    navLabel: 'Research',
    title: 'Research and Innovation Institutes',
    description:
      'Eighteen specialized institutes equipped for interdisciplinary research, open collaboration, and innovation transfer.',
    modules: [
      {
        heading: 'Institutes',
        items: RESEARCH_INSTITUTES,
      },
      {
        heading: 'Research Platform Features',
        items: [
          'AI-assisted analytics and collaboration dashboards',
          'Publications: journals, policy papers, monographs, proceedings',
          'Funding and donor management portal',
          'IP and patent filing workflows',
          'Blockchain-verified academic credentials',
          'Virtual labs and VR simulations',
          'Industry and government partnerships',
        ],
      },
    ],
    highlights: [
      { label: 'Research Institutes', value: '18' },
      { label: 'Collaboration Stack', value: 'AI + VR + Open Science' },
      { label: 'Impact Pathway', value: 'Policy to Commercialization' },
    ],
  },
  {
    slug: 'university-press',
    path: 'university-press',
    navLabel: 'Press',
    title: 'University Press',
    description:
      'A digital-first publishing ecosystem for books, journals, proceedings, and open educational content.',
    modules: [
      {
        heading: 'Publishing Operations',
        items: [
          'Book, journal, and conference proceedings publishing',
          'Editorial peer review and open access repository',
          'ISBN registration and global distribution',
        ],
      },
      {
        heading: 'Submission and Promotion',
        items: [
          'Author and scholar submission portal',
          'Multimedia promotions and publication archives',
          'Open access MOOC and lecture repository',
        ],
      },
    ],
    highlights: [
      { label: 'Publication Types', value: 'Books, Journals, Proceedings' },
      { label: 'Distribution', value: 'Global Digital + ISBN' },
      { label: 'Access Model', value: 'Open Scholarship' },
    ],
  },
  {
    slug: 'library-repository',
    path: 'library-repository',
    navLabel: 'Library',
    title: 'Library and Knowledge Repository',
    description:
      'A modern digital library integrating theses, manuscripts, global databases, and AI-assisted discovery.',
    modules: [
      {
        heading: 'Collections and Access',
        items: [
          'Digital theses, dissertations, and rare manuscripts',
          'Global database integrations: JSTOR, ProQuest, AJOL, DOAJ',
          'Open-source datasets and knowledge sharing',
        ],
      },
      {
        heading: 'Smart Learning Features',
        items: [
          'Integrated citation and bibliography tools',
          'AI-based resource recommendations',
          'VR and AR reading rooms with knowledge graphs',
        ],
      },
    ],
    highlights: [
      { label: 'Research Access', value: 'Global Databases' },
      { label: 'Discovery', value: 'AI Recommendations' },
      { label: 'Immersive Study', value: 'VR and AR Rooms' },
    ],
  },
  {
    slug: 'digital-learning',
    path: 'digital-learning',
    navLabel: 'Virtual Campus',
    title: 'Digital Learning and Virtual Campus',
    description:
      'An integrated digital campus with adaptive learning, analytics, secure assessments, and global classroom exchange.',
    modules: [
      {
        heading: 'Core Digital Systems',
        items: [
          'LMS with adaptive learning algorithms',
          'Virtual classrooms, forums, and collaboration tools',
          'Secure online examinations and proctoring',
          'Student Information System (SIS)',
        ],
      },
      {
        heading: 'Intelligent Learning',
        items: [
          'AI academic advising and mentorship',
          'Analytics for performance, attendance, and engagement',
          'VR and AR campus experiences and gamified learning',
          'Global classroom integration and joint courses',
        ],
      },
    ],
    highlights: [
      { label: 'Delivery Mode', value: 'Hybrid by Design' },
      { label: 'Student Systems', value: 'LMS + SIS + Analytics' },
      { label: 'Global Reach', value: 'International Joint Classrooms' },
    ],
  },
  {
    slug: 'student-life',
    path: 'student-life',
    navLabel: 'Student Life',
    title: 'Student Life and Community',
    description:
      'A student-centered ecosystem supporting belonging, wellbeing, leadership, and career transitions.',
    modules: [
      {
        heading: 'Community Experience',
        items: [
          'Clubs, associations, and societies',
          'Cultural, social, and sporting events',
          'Community engagement and volunteering opportunities',
        ],
      },
      {
        heading: 'Support and Growth',
        items: [
          'AI-enhanced mentorship and career guidance',
          'Internship and job placement portals',
          'Student wellness and mental health services',
          'Accessibility and disability support',
        ],
      },
      {
        heading: 'Lifelong Network',
        items: [
          'Alumni network and global chapters',
          'Leadership pathways and peer mentorship',
          'Graduate transition programs',
        ],
      },
    ],
    highlights: [
      { label: 'Wellbeing', value: 'Holistic Student Support' },
      { label: 'Career Pipeline', value: 'Internship to Placement' },
      { label: 'Community', value: 'Global Alumni Chapters' },
    ],
  },
  {
    slug: 'faculty-staff',
    path: 'faculty-staff',
    navLabel: 'Faculty & Staff',
    title: 'Faculty and Staff',
    description:
      'An integrated staff experience for recruitment, performance, collaboration, and research delivery.',
    modules: [
      {
        heading: 'People Operations',
        items: [
          'Recruitment and onboarding portal',
          'HR management, communications, and performance dashboards',
          'Recognition and rewards tracking',
        ],
      },
      {
        heading: 'Professional Excellence',
        items: [
          'AI workload optimization and scheduling',
          'Professional development programs',
          'Secure staff portal and collaboration tools',
        ],
      },
      {
        heading: 'Research Enablement',
        items: [
          'Research project management tools',
          'Institutional analytics for grant and output tracking',
          'Cross-faculty collaboration channels',
        ],
      },
    ],
    highlights: [
      { label: 'HR Maturity', value: 'Digital and Data-Driven' },
      { label: 'Workload Intelligence', value: 'AI Optimized' },
      { label: 'Research Operations', value: 'Integrated Tooling' },
    ],
  },
  {
    slug: 'events-conferences',
    path: 'events-conferences',
    navLabel: 'Events',
    title: 'Events and Conferences',
    description:
      'A full event lifecycle platform for physical, hybrid, and VR conferences with scholar-focused personalization.',
    modules: [
      {
        heading: 'Event Management',
        items: [
          'University calendar and event system',
          'Online and on-campus conference registration',
          'Speaker profiles and program guides',
        ],
      },
      {
        heading: 'Hybrid Delivery',
        items: [
          'VR and hybrid conference platforms',
          'Archives of past events and media coverage',
          'Digital participation analytics',
        ],
      },
      {
        heading: 'Smart Recommendations',
        items: [
          'AI recommendations for attendees and researchers',
          'Session personalization by interests',
          'Cross-event networking intelligence',
        ],
      },
    ],
    highlights: [
      { label: 'Event Modes', value: 'On-Campus + Online + VR' },
      { label: 'Audience Intelligence', value: 'AI Matching' },
      { label: 'Knowledge Archive', value: 'Continuously Searchable' },
    ],
  },
  {
    slug: 'partnerships-global',
    path: 'partnerships-global',
    navLabel: 'Partnerships',
    title: 'Partnerships and Global Relations',
    description:
      'Strategic alliances with universities, research bodies, diplomatic institutions, and industry partners.',
    modules: [
      {
        heading: 'Academic and Research Partnerships',
        items: [
          'Partner universities and research institutions',
          'Joint research projects and collaboration tools',
          'Faculty and scholar exchange programs',
        ],
      },
      {
        heading: 'Global Opportunity Networks',
        items: [
          'International rankings and benchmarking dashboards',
          'Global internship and study abroad portals',
          'Diplomatic and corporate partnerships',
        ],
      },
      {
        heading: 'Impact Analytics',
        items: [
          'AI analytics for partnership outcomes',
          'Mobility and collaboration tracking',
          'Evidence-based partnership scaling',
        ],
      },
    ],
    highlights: [
      { label: 'Partnership Scope', value: 'Academic + Corporate + Diplomatic' },
      { label: 'Mobility', value: 'Exchange and Study Abroad' },
      { label: 'Impact Tracking', value: 'AI Analytics' },
    ],
  },
  {
    slug: 'media-public-scholarship',
    path: 'media-public-scholarship',
    navLabel: 'Media',
    title: 'Media and Public Scholarship',
    description:
      'A public communication platform that amplifies scholarship through multimedia, campaigns, and measurable engagement.',
    modules: [
      {
        heading: 'Editorial and Media Channels',
        items: [
          'University news, press releases, and editorials',
          'Podcasts, webinars, blogs, and multimedia galleries',
          'Virtual tours and VR lab showcases',
        ],
      },
      {
        heading: 'Digital Performance',
        items: [
          'Social media integration and campaign automation',
          'SEO, analytics, and engagement dashboards',
          'AI-powered content recommendation workflows',
        ],
      },
    ],
    highlights: [
      { label: 'Public Reach', value: 'Multi-Platform Publishing' },
      { label: 'Engagement Stack', value: 'SEO + Analytics + AI' },
      { label: 'Content Formats', value: 'Text, Audio, Video, VR' },
    ],
  },
  {
    slug: 'institutional-development',
    path: 'institutional-development',
    navLabel: 'Development',
    title: 'Institutional Development and Funding',
    description:
      'Financial sustainability, donor engagement, and transparent capital planning for long-term institutional growth.',
    modules: [
      {
        heading: 'Funding Infrastructure',
        items: [
          'Endowment and donation portals',
          'Tuition collection and scholarship management',
          'Infrastructure development and project tracking',
        ],
      },
      {
        heading: 'Transparency and Insight',
        items: [
          'Financial transparency dashboards',
          'Alumni and donor analytics',
          'AI-forecasted funding and sustainability planning',
        ],
      },
    ],
    highlights: [
      { label: 'Funding Channels', value: 'Tuition + Endowment + Donor' },
      { label: 'Governance', value: 'Transparency Dashboards' },
      { label: 'Forecasting', value: 'AI Sustainability Models' },
    ],
  },
  {
    slug: 'community-outreach',
    path: 'community-outreach',
    navLabel: 'Outreach',
    title: 'Community Engagement and Outreach',
    description:
      'University-led social impact through civic education, NGO collaboration, and scalable community partnerships.',
    modules: [
      {
        heading: 'Public Programs',
        items: [
          'Civic education workshops and public lectures',
          'Volunteer programs and skills training',
          'Global social responsibility reporting',
        ],
      },
      {
        heading: 'Partnership Network',
        items: [
          'Social impact projects and NGO collaborations',
          'Local, national, and continental partnerships',
          'Community-led co-creation models',
        ],
      },
      {
        heading: 'Impact Evidence',
        items: [
          'AI impact tracking dashboards',
          'Program outcome and accountability reporting',
          'Longitudinal community benefit assessment',
        ],
      },
    ],
    highlights: [
      { label: 'Impact Approach', value: 'Community Co-Design' },
      { label: 'Partnership Scale', value: 'Local to Continental' },
      { label: 'Measurement', value: 'AI Impact Tracking' },
    ],
  },
  {
    slug: 'ai-advanced-tools',
    path: 'ai-advanced-tools',
    navLabel: 'AI Tools',
    title: 'AI and Advanced Digital Tools',
    description:
      'A university-wide AI stack powering learning, governance, research, and service delivery.',
    modules: [
      {
        heading: 'Learning and Mentorship',
        items: [
          'Adaptive AI learning and mentorship',
          'Predictive analytics for enrollment and performance',
          'Smart chatbots for student and faculty support',
        ],
      },
      {
        heading: 'Research and Knowledge',
        items: [
          'AI-powered library and resource recommendations',
          'Research trend analytics and horizon scanning',
          'Gamified VR and AR learning experiences',
        ],
      },
      {
        heading: 'Operations and Planning',
        items: [
          'AI dashboards for governance and resource planning',
          'Sustainability intelligence and forecasting',
          'Decision support for institutional leadership',
        ],
      },
    ],
    highlights: [
      { label: 'AI Footprint', value: 'Campus-Wide' },
      { label: 'Decision Support', value: 'Predictive Dashboards' },
      { label: 'Student Support', value: 'Always-On Assistants' },
    ],
  },
  {
    slug: 'sustainability',
    path: 'sustainability',
    navLabel: 'Sustainability',
    title: 'Sustainability and Smart Campus',
    description:
      'A sustainability-first campus strategy integrating smart infrastructure, renewable systems, and behavior change.',
    modules: [
      {
        heading: 'Smart Infrastructure',
        items: [
          'IoT-enabled smart classrooms and labs',
          'Renewable energy and eco-friendly campus development',
          'Interactive sustainability dashboards',
        ],
      },
      {
        heading: 'Environmental Stewardship',
        items: [
          'Environmental footprint monitoring and reports',
          'Recycling, waste management, and green programs',
          'Campus-wide sustainability literacy initiatives',
        ],
      },
    ],
    highlights: [
      { label: 'Campus Model', value: 'Smart and Green' },
      { label: 'Energy Pathway', value: 'Renewables Integrated' },
      { label: 'Monitoring', value: 'Real-Time Sustainability Data' },
    ],
  },
  {
    slug: 'emergency-safety',
    path: 'emergency-safety',
    navLabel: 'Safety',
    title: 'Emergency, Safety and Crisis Management',
    description:
      'Institutional resilience through proactive alerts, safety protocols, and AI-assisted risk prediction.',
    modules: [
      {
        heading: 'Preparedness and Response',
        items: [
          'Alerts and notifications via SMS, email, and app push',
          'Health and safety portals with crisis protocols',
          'Disaster recovery and continuity plans',
        ],
      },
      {
        heading: 'Student and Staff Protection',
        items: [
          'Counseling and support services',
          'Digital safety compliance and accessibility',
          'Cross-campus response coordination',
        ],
      },
      {
        heading: 'Predictive Intelligence',
        items: [
          'AI risk analysis and predictive alerts',
          'Incident trend monitoring dashboards',
          'Scenario planning support tools',
        ],
      },
    ],
    highlights: [
      { label: 'Alert Channels', value: 'SMS + Email + App Push' },
      { label: 'Response Model', value: 'Protocol-Driven' },
      { label: 'Risk Insight', value: 'Predictive AI' },
    ],
  },
  {
    slug: 'contact',
    path: 'contact',
    navLabel: 'Contact',
    title: 'Contact and Administrative Access',
    description:
      'Centralized communication channels for inquiries, departmental access, and support.',
    modules: [
      {
        heading: 'Administrative Access',
        items: [
          'Office directory and departmental contacts',
          'Inquiry forms and live chat channels',
          'AI-powered FAQ assistance',
        ],
      },
      {
        heading: 'Primary Channels',
        items: [
          'Email: sankofalkebulanuniversity@outlook.com',
          'Phone directory and future campus locations',
          'Admissions and registrar escalation paths',
        ],
      },
    ],
    highlights: [
      { label: 'Primary Email', value: 'sankofalkebulanuniversity@outlook.com' },
      { label: 'Support Access', value: 'Live Chat + FAQ AI' },
      { label: 'Response Network', value: 'Department Routing' },
    ],
  },
];

export const PRIMARY_NAV_ITEMS: readonly PortalPage[] = [
  UNIVERSITY_PORTAL_PAGES[0],
  UNIVERSITY_PORTAL_PAGES[2],
  UNIVERSITY_PORTAL_PAGES[3],
  UNIVERSITY_PORTAL_PAGES[4],
  UNIVERSITY_PORTAL_PAGES[5],
];

export const MEGA_MENU_ITEMS: readonly PortalPage[] = UNIVERSITY_PORTAL_PAGES;

