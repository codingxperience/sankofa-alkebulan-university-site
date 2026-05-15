import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RESEARCH_INSTITUTES, UNIVERSITY_PORTAL_PAGES } from '../university/university-data';
import { ACADEMIC_ARCHITECTURE_COLLEGES, ACADEMIC_ARCHITECTURE_TOTALS } from '../university/academic-architecture';
import { DEPARTMENT_PAGES } from '../university/department-pages';
import {
  STUDENT_LIFE_DECLARATIONS,
  STUDENT_LIFE_SYSTEMS,
  StudentLifeSystem,
} from '../university/student-life-systems';
import { InquiriesService } from '../core/inquiries.service';
import { firstValueFrom } from 'rxjs';

interface AcademicPathway {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly iconClass: string;
  readonly path: string;
}

interface FeaturedSchool {
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly tag: string;
}

interface AcademicCluster {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly imagePosition: string;
  readonly path: string;
}

interface ResearchCatalogRecord {
  readonly year: string;
  readonly title: string;
  readonly nature: string;
  readonly field: string;
}

interface ResearchCatalog {
  readonly label: string;
  readonly summary: string;
  readonly records: readonly ResearchCatalogRecord[];
}

interface ResearchSignal {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly path: string;
}

interface ResearchStep {
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

interface ApplicationMode {
  readonly label: string;
  readonly studyLevel: string;
}

interface NewsEventCard {
  readonly month: string;
  readonly day: string;
  readonly category: string;
  readonly title: string;
  readonly summary: string;
  readonly location: string;
  readonly mode: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly imagePosition?: string;
  readonly path: string;
}

interface NewsStory {
  readonly category: string;
  readonly date: string;
  readonly title: string;
  readonly summary: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly imagePosition?: string;
  readonly path: string;
}

interface EventChannel {
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly iconClass: string;
  readonly path: string;
}

interface ServicePathway {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly iconClass: string;
  readonly path: string;
  readonly features: readonly string[];
}

interface ServiceSignal {
  readonly value: string;
  readonly label: string;
}

interface ContactChannel {
  readonly label: string;
  readonly value: string;
  readonly description: string;
  readonly href: string;
  readonly iconClass: string;
}

interface ContactOffice {
  readonly title: string;
  readonly description: string;
  readonly path: string;
}

interface ContactInfoBlock {
  readonly label: string;
  readonly value: string;
  readonly description: string;
  readonly iconClass: string;
  readonly href?: string;
  readonly lines?: readonly string[];
}

interface ContactLocationCard {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly meta: string;
  readonly actionLabel: string;
  readonly path: string;
}

interface ContactFaq {
  readonly question: string;
  readonly answer: string;
}

interface StudentLifeCommitment {
  readonly label: string;
  readonly category: string;
  readonly title: string;
  readonly text: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly imagePosition?: string;
  readonly actionLabel: string;
  readonly path: string;
}

interface StudentVoice {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly imagePosition?: string;
}

interface StudentLifeCalendarItem {
  readonly day: string;
  readonly month: string;
  readonly title: string;
  readonly description: string;
  readonly meta: string;
  readonly action: string;
}

interface AcademicCollegeCard {
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly schools: number;
  readonly path: string;
}

interface AcademicFocusQuestion {
  readonly label: string;
  readonly title: string;
  readonly text: string;
}

interface AcademicInstituteCard {
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

interface AcademicQualityPoint {
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-university-section-page',
  imports: [RouterLink, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './university-section-page.component.html',
  styleUrls: [
    './university-section-page.component.scss',
    './university-section-page.student-life.scss',
    './university-section-page.reference.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversitySectionPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly inquiriesService = inject(InquiriesService);

  readonly universityEmail = 'SanAlkeU@outlook.com';

  readonly page = computed(() => {
    const slug = this.route.snapshot.data['slug'];
    const sectionSlug = typeof slug === 'string' ? slug : '';

    return UNIVERSITY_PORTAL_PAGES.find((page) => page.slug === sectionSlug) ?? null;
  });

  readonly isAdmissionsPage = computed(() => this.page()?.slug === 'admissions');
  readonly isServicesPage = computed(() => this.page()?.slug === 'services');
  readonly isContactPage = computed(() => this.page()?.slug === 'contact');
  readonly isFacultiesPage = computed(() => this.page()?.slug === 'faculties-schools');
  readonly isResearchPage = computed(() => this.page()?.slug === 'research-innovation');
  readonly isEventsPage = computed(() => this.page()?.slug === 'events-conferences');
  readonly isStudentLifePage = computed(() => this.page()?.slug === 'student-life');

  readonly studentLifeSystems = STUDENT_LIFE_SYSTEMS;
  readonly studentLifeDeclarations = STUDENT_LIFE_DECLARATIONS;
  readonly activeStudentLifeSystemId = signal<StudentLifeSystem['id']>('cultural');
  readonly activeStudentLifeSystem = computed(
    () =>
      this.studentLifeSystems.find((system) => system.id === this.activeStudentLifeSystemId()) ??
      this.studentLifeSystems[0],
  );
  readonly studentLifeTotals = computed(() =>
    this.studentLifeSystems.map((system) => ({
      label: system.label,
      groups: system.groups.length,
      items: system.groups.reduce((total, group) => total + group.items.length, 0),
    })),
  );

  readonly studentLifeCommitments: readonly StudentLifeCommitment[] = [
    {
      label: '01',
      category: 'Residence',
      title: 'A room of your own, on a campus that holds you.',
      text: 'Four residence colleges with single and shared rooms, common kitchens, study lofts, and dedicated wardens for first-year support.',
      image: '/assets/contact/contact-students-study-group.jpg',
      imageAlt: 'Students studying together on campus',
      imagePosition: '50% 42%',
      actionLabel: 'Housing and residence colleges',
      path: '/services',
    },
    {
      label: '02',
      category: 'Wellbeing and counsel',
      title: 'Quiet, confidential support built in.',
      text: 'A wellbeing centre staffed by counsellors, chaplaincy, and a small mental-health team keeps care present before crisis.',
      image: '/assets/design/photo-students.jpg',
      imageAlt: 'Students walking together in a university setting',
      imagePosition: '48% 38%',
      actionLabel: 'Wellbeing services',
      path: '/services',
    },
    {
      label: '03',
      category: 'Societies and debate',
      title: 'Forty-plus student societies, run by students.',
      text: 'Debate, language, faith, music, journalism, model-AU, and a continental cultural network are funded publicly with real budgets.',
      image: '/assets/academics/world-heritage-civilization.jpg',
      imageAlt: 'African cultural gathering and public learning moment',
      imagePosition: '50% 48%',
      actionLabel: 'Browse societies',
      path: '/student-life',
    },
    {
      label: '04',
      category: 'Athletics and movement',
      title: 'Intramural sport and competitive teams.',
      text: 'Football, rugby sevens, basketball, athletics, swimming, and fitness clubs keep campus energetic and disciplined.',
      image: '/assets/design/hero-campus.jpg',
      imageAlt: 'Sankofa campus exterior',
      imagePosition: '50% 48%',
      actionLabel: 'Athletics programme',
      path: '/student-life',
    },
    {
      label: '05',
      category: 'Faith and reflection',
      title: 'An interfaith chaplaincy, serious and unhurried.',
      text: 'Christian, Muslim, traditional African, and humanist chaplains support reflection, dialogue, and spiritual practice.',
      image: '/assets/design/hero-research.jpg',
      imageAlt: 'Research and reflection space with a scientist in a laboratory',
      imagePosition: '48% 42%',
      actionLabel: 'Faith life on campus',
      path: '/services',
    },
    {
      label: '06',
      category: 'Leadership and service',
      title: 'The students assembly, and the public work of the university.',
      text: 'Student governance, civic projects, leadership clinics, and service placements make learning accountable to communities.',
      image: '/assets/design/hero-admissions.jpg',
      imageAlt: 'Student holding books in a campus garden',
      imagePosition: '58% 36%',
      actionLabel: 'Leadership and service',
      path: '/student-life',
    },
  ];

  readonly studentVoices: readonly StudentVoice[] = [
    {
      quote:
        'I came to Sankofa to write about how my grandmother understood medicine. Three years in, that question has become a real research programme and a community practice.',
      name: 'Diana Kaija',
      role: 'Indigenous Knowledge Systems',
      image: '/assets/team/diana-kaija.jpeg',
      imageAlt: 'Diana Kaija',
      imagePosition: '54% 32%',
    },
    {
      quote:
        'The Pan-African scholars network was the first place I met students from Ghana, Senegal, and Ethiopia who think the way I do about African economies.',
      name: 'Chinaza Ekeoma',
      role: 'Civilizational Studies',
      image: '/assets/team/chinaza-ekeoma.jpeg',
      imageAlt: 'Chinaza Ekeoma',
      imagePosition: '50% 24%',
    },
    {
      quote:
        'I was nervous about leaving Kigali. The residence wardens met me at the airport. Two terms later, I am running the debate society and writing for the student archive.',
      name: 'Winnie Mukashema',
      role: 'Public Health',
      image: '/assets/team/mukashema-winnie.jpeg',
      imageAlt: 'Winnie Mukashema',
      imagePosition: '50% 24%',
    },
  ];

  readonly studentLifeCalendar: readonly StudentLifeCalendarItem[] = [
    {
      day: '14',
      month: 'Mar',
      title: 'Annual Lecture - Restoration as a research method',
      description: 'Prof. Rukundo, public talk in the John K. Sentongo Hall. Free, livestreamed, recorded.',
      meta: '18:00 / Hall',
      action: 'RSVP',
    },
    {
      day: '17',
      month: 'Mar',
      title: 'Pan-African scholars reading group',
      description: 'Open seminar on Ngugi wa Thiongo and decolonising the African mind.',
      meta: '17:30 / Seminar room',
      action: 'Add to calendar',
    },
    {
      day: '22',
      month: 'Mar',
      title: 'Health and wellbeing fair',
      description: 'Drop-in clinics, mental-health screenings, peer-support sign-ups, and a free strength class.',
      meta: '09:00 - 16:00 / Quad',
      action: 'Details',
    },
    {
      day: '29',
      month: 'Mar',
      title: 'Inter-college debate finals',
      description: 'Motion: This house believes restoration is a stronger frame than reform.',
      meta: '19:00 / Senate Hall',
      action: 'Tickets',
    },
    {
      day: '02',
      month: 'Apr',
      title: 'Founders Day: Service of restoration',
      description: 'A public service of music, prayer, and reading. Interfaith chaplaincy, all students and families welcome.',
      meta: '11:00 / Chapel of the Three Rivers',
      action: 'Details',
    },
  ];

  setStudentLifeSystem(systemId: StudentLifeSystem['id']): void {
    this.activeStudentLifeSystemId.set(systemId);
  }

  readonly academicPathways: readonly AcademicPathway[] = [
    {
      eyebrow: 'Start',
      title: 'Programs',
      description: 'Certificates, diplomas, degrees, masters, and doctoral routes.',
      iconClass: 'pi pi-book',
      path: '/programs',
    },
    {
      eyebrow: 'Build',
      title: 'Schools',
      description: 'Focused academic homes with distinct disciplines and identities.',
      iconClass: 'pi pi-sitemap',
      path: '/faculties-schools',
    },
    {
      eyebrow: 'Advance',
      title: 'Research',
      description: 'Applied inquiry across AI, health, governance, climate, and culture.',
      iconClass: 'pi pi-globe',
      path: '/research-innovation',
    },
  ];

  readonly serviceSignals: readonly ServiceSignal[] = [
    { value: '01', label: 'Choose the right pathway' },
    { value: '02', label: 'Reach the correct office' },
    { value: '03', label: 'Move from inquiry to action' },
  ];

  readonly servicePathways: readonly ServicePathway[] = [
    {
      eyebrow: 'Study',
      title: 'Admissions and Programme Guidance',
      description: 'Clear support for applicants choosing a level, programme, intake, and funding route.',
      iconClass: 'pi pi-send',
      path: '/admissions',
      features: ['Domestic and international admissions', 'Programme choice support', 'Scholarships and document readiness'],
    },
    {
      eyebrow: 'Learn',
      title: 'Academic and Digital Learning Services',
      description: 'Academic navigation across colleges, schools, library access, and virtual learning systems.',
      iconClass: 'pi pi-book',
      path: '/faculties-schools',
      features: ['College and school directory', 'Library and repository access', 'Virtual campus support'],
    },
    {
      eyebrow: 'Belong',
      title: 'Student Life and Applied Learning',
      description: 'Clubs, cultural societies, professional societies, wellness, and leadership formation.',
      iconClass: 'pi pi-users',
      path: '/student-life',
      features: ['Cultural and heritage societies', 'Applied clubs', 'Professional societies'],
    },
    {
      eyebrow: 'Build',
      title: 'Research, Partnerships, and Public Scholarship',
      description: 'Support for research collaboration, events, publications, partnerships, and public impact.',
      iconClass: 'pi pi-globe',
      path: '/research-innovation',
      features: ['Research institutes', 'Events and conferences', 'Partnership pathways'],
    },
  ];

  readonly contactChannels: readonly ContactChannel[] = [
    {
      label: 'Email',
      value: this.universityEmail,
      description: 'Best for formal inquiries, documents, admissions questions, and administrative routing.',
      href: `mailto:${this.universityEmail}`,
      iconClass: 'pi pi-envelope',
    },
    {
      label: 'WhatsApp Live Chat',
      value: 'Sankofa community support',
      description: 'Fastest path for lightweight questions, applicant guidance, and quick follow-up.',
      href: 'https://chat.whatsapp.com/Dv2lTXXzhfMDf6sClAxpEP',
      iconClass: 'pi pi-whatsapp',
    },
    {
      label: 'Founder / Chancellor',
      value: '0765871126 / 0706938536',
      description: 'Leadership contact for founding, institutional, and high-priority university matters.',
      href: 'tel:0765871126',
      iconClass: 'pi pi-phone',
    },
  ];

  readonly contactOffices: readonly ContactOffice[] = [
    {
      title: 'Admissions Office',
      description: 'Applications, entry requirements, study levels, scholarships, and document readiness.',
      path: '/admissions',
    },
    {
      title: 'Academic Pathways',
      description: 'Programmes, colleges, schools, research alignment, and learning routes.',
      path: '/faculties-schools',
    },
    {
      title: 'Research and Partnerships',
      description: 'Research institutes, public scholarship, conferences, and institutional collaboration.',
      path: '/research-innovation',
    },
    {
      title: 'Student Systems',
      description: 'Student life, clubs, cultural societies, professional societies, and support services.',
      path: '/student-life',
    },
  ];

  readonly contactInfoBlocks: readonly ContactInfoBlock[] = [
    {
      label: 'Phone',
      value: 'Founder / Chancellor Office',
      description: 'For founding, institutional, and urgent leadership inquiries.',
      href: 'tel:0765871126',
      iconClass: 'pi pi-phone',
      lines: ['0765871126', '0706938536'],
    },
    {
      label: 'Email',
      value: this.universityEmail,
      description: 'Best for admissions documents, formal letters, partnership notes, and records.',
      href: `mailto:${this.universityEmail}`,
      iconClass: 'pi pi-envelope',
    },
    {
      label: 'WhatsApp',
      value: 'Live community support',
      description: 'Use for quick guidance, applicant questions, and follow-up conversations.',
      href: 'https://chat.whatsapp.com/Dv2lTXXzhfMDf6sClAxpEP',
      iconClass: 'pi pi-whatsapp',
    },
    {
      label: 'Access',
      value: 'Digital contact center',
      description: 'Administrative access is currently routed through digital channels while future campus locations are developed.',
      iconClass: 'pi pi-map-marker',
      lines: ['Pan-African virtual office', 'Future campus locations under development'],
    },
  ];

  readonly contactLocationCards: readonly ContactLocationCard[] = [
    {
      eyebrow: 'Primary access',
      title: 'Digital Contact Center',
      description: 'One structured channel for admissions, administration, partnerships, and student support routing.',
      meta: 'Email, WhatsApp, and inquiry form',
      actionLabel: 'Send an inquiry',
      path: '/contact',
    },
    {
      eyebrow: 'Campus planning',
      title: 'Future Campus Locations',
      description: 'Sankofa is building toward physical, hybrid, and partner-based learning locations across Pan-African networks.',
      meta: 'Uganda and continental partner hubs',
      actionLabel: 'Explore partnerships',
      path: '/partnerships-global',
    },
  ];

  readonly contactFaqs: readonly ContactFaq[] = [
    {
      question: 'What is Sankofa Alkebulan University?',
      answer:
        'Sankofa Alkebulan University is a Pan-African university initiative centered on African knowledge systems, research, ethical leadership, digital learning, and civilisational renewal.',
    },
    {
      question: 'Which email should I use for official inquiries?',
      answer: `Use ${this.universityEmail} for admissions, documents, partnership letters, media requests, and administrative correspondence.`,
    },
    {
      question: 'How do prospective students apply?',
      answer:
        'Open Admissions, choose postgraduate, undergraduate, or certificate application, complete the form, and include your programme interest, intake, country, and contact details.',
    },
    {
      question: 'Can international applicants apply?',
      answer:
        'Yes. International applicants can use the same online pathway and should provide their country, previous qualifications, programme choice, and available academic documents.',
    },
    {
      question: 'Where is the University located?',
      answer:
        'Sankofa is currently presented as a digital-first Pan-African university model while future campus locations and partner hubs are developed. Contact administration for current location updates.',
    },
    {
      question: 'Does the University have a charter or accreditation status?',
      answer:
        'The Governance and Compliance section is the reference point for charter, policy, quality assurance, and accreditation updates. For current official status, contact administration directly.',
    },
    {
      question: 'Can I submit documents online?',
      answer:
        'Yes. Applicants can begin through the admissions form and use email follow-up for transcripts, identification, proposal documents, and other materials requested by admissions.',
    },
    {
      question: 'How do I contact the Founder / Chancellor office?',
      answer:
        'Use 0765871126 or 0706938536 for founder/chancellor matters. Routine admissions and document questions should still be sent by email for proper records.',
    },
  ];

  readonly contactDepartmentOptions: readonly string[] = [
    'Admissions',
    'Academic Programmes',
    'Research and Partnerships',
    'Student Life',
    'Governance and Administration',
    'Media and Public Scholarship',
    'General Inquiry',
  ];

  readonly academicArchitecture = ACADEMIC_ARCHITECTURE_COLLEGES;
  readonly academicArchitectureTotals = ACADEMIC_ARCHITECTURE_TOTALS;

  readonly featuredSchools: readonly FeaturedSchool[] = DEPARTMENT_PAGES.slice(0, 6).map(
    (school, index) => ({
      title: school.title,
      slug: school.slug,
      description: this.summarizeAcademicSchool(school.overview),
      tag: ['Heritage', 'Theology', 'Culture', 'Governance', 'Innovation', 'Global'][index] ?? 'School',
    }),
  );

  readonly academicClusters: readonly AcademicCluster[] = [
    {
      title: 'Heritage and Civilization',
      description: 'African knowledge systems, theology, humanities, culture, and public memory.',
      image: '/assets/academics/world-heritage-civilization.jpg',
      imagePosition: '52% center',
      path: '/faculties-schools/college-of-african-civilizational-studies',
    },
    {
      title: 'Governance and Justice',
      description: 'Leadership, law, human rights, policy, peace, and continental institutions.',
      image: '/assets/academics/world-governance-justice.jpg',
      imagePosition: '48% center',
      path: '/faculties-schools/school-of-law-and-human-rights',
    },
    {
      title: 'Science and Intelligence',
      description: 'Engineering, data science, AI, space, mathematics, and applied technologies.',
      image: '/assets/academics/world-science-intelligence.jpg',
      imagePosition: '50% center',
      path: '/faculties-schools/school-of-mathematics-data-science-and-ai',
    },
    {
      title: 'Health and Earth Futures',
      description: 'Biomedical studies, public health, agriculture, climate, and sustainability.',
      image: '/assets/academics/world-health-earth.jpg',
      imagePosition: '48% center',
      path: '/faculties-schools/college-of-health-sciences-and-biomedical-studies',
    },
  ];

  readonly academicFocusQuestions: readonly AcademicFocusQuestion[] = [
    {
      label: '01',
      title: 'Which traditions explain African futures?',
      text: 'Civilisation, memory, language, public thought, theology, and decolonial scholarship.',
    },
    {
      label: '02',
      title: 'How does knowledge become public capacity?',
      text: 'Research, policy, archive work, publishing, and community-facing scholarship.',
    },
    {
      label: '03',
      title: 'Where can culture become method?',
      text: 'Heritage systems, oral traditions, philosophy, creative practice, and African languages.',
    },
  ];

  readonly academicFocusProgrammes = [
    'MA Pan-African Studies',
    'BA Indigenous Knowledge Systems',
    'MA African Political Thought',
    'BA African Languages',
  ] as const;

  readonly academicCollegeCards: readonly AcademicCollegeCard[] = [
    {
      number: '01',
      title: 'College of African Civilizational Studies',
      description: 'Civilisation, memory, language, philosophy, theology, culture, and African knowledge systems.',
      schools: 7,
      path: '/faculties-schools',
    },
    {
      number: '02',
      title: 'College of Science, Technology & Innovation',
      description: 'Computing, AI, engineering, data, robotics, space, mathematics, and digital systems.',
      schools: 8,
      path: '/faculties-schools',
    },
    {
      number: '03',
      title: 'College of Governance, Law & Public Policy',
      description: 'Law, statecraft, public administration, peace, security, diplomacy, and institutional reform.',
      schools: 6,
      path: '/faculties-schools',
    },
    {
      number: '04',
      title: 'College of Health, Wellbeing & Society',
      description: 'Medicine, public health, psychology, biomedical systems, wellness, and human development.',
      schools: 7,
      path: '/faculties-schools',
    },
    {
      number: '05',
      title: 'College of Business, Enterprise & Economics',
      description: 'Finance, enterprise, accounting, logistics, trade systems, and economic transformation.',
      schools: 5,
      path: '/faculties-schools',
    },
    {
      number: '06',
      title: 'College of Education & Teacher Development',
      description: 'Pedagogy, curriculum, teacher education, educational leadership, and lifelong learning.',
      schools: 4,
      path: '/faculties-schools',
    },
  ];

  readonly academicFieldTags = [
    'Civilisational systems',
    'Heritage and memory',
    'African languages',
    'Philosophy and ethics',
    'Arts and cultural production',
    'AI and data systems',
    'Public health',
    'Governance and justice',
    'Climate futures',
    'Education systems',
  ] as const;

  readonly academicInstituteCards: readonly AcademicInstituteCard[] = [
    {
      label: '01',
      title: 'Institute for Pan-African Civilisational Systems',
      description: 'Long-form scholarship on African thought, identity, history, and public memory.',
    },
    {
      label: '02',
      title: 'Institute for Artificial Intelligence, Data & Digital Systems',
      description: 'Human-centered computation, digital sovereignty, analytics, and responsible AI.',
    },
    {
      label: '03',
      title: 'Institute for Public Health, Epidemiology & Health Security',
      description: 'Applied health systems research, prevention, community resilience, and policy.',
    },
    {
      label: '04',
      title: 'Institute for Climate Change & Sustainability Systems',
      description: 'Climate, ecology, food systems, water security, and environmental transition.',
    },
  ];

  readonly academicQualityPoints: readonly AcademicQualityPoint[] = [
    {
      label: '01',
      title: 'Programme approval',
      description: 'Every programme moves through curriculum review, quality assurance, and Senate approval.',
    },
    {
      label: '02',
      title: 'External examination',
      description: 'Independent review protects academic standards, assessment quality, and credibility.',
    },
    {
      label: '03',
      title: 'Research alignment',
      description: 'Departments connect teaching to institutes, fieldwork, publications, and public scholarship.',
    },
  ];

  readonly activeResearchCatalogIndex = signal(0);
  readonly selectedResearchCatalog = computed(
    () => this.researchCatalogs[this.activeResearchCatalogIndex()] ?? this.researchCatalogs[0],
  );

  readonly researchCatalogs: readonly ResearchCatalog[] = [
    {
      label: 'Research Guidelines',
      summary: 'Core frameworks for ethics, methods, repositories, IP, and public-facing scholarship.',
      records: [
        {
          year: '2026',
          title: 'Research Ethics and Community Consent Guide',
          nature: 'Guideline',
          field: 'Ethics and Fieldwork',
        },
        {
          year: '2026',
          title: 'Pan-African Research Methods Handbook',
          nature: 'Guideline',
          field: 'Indigenous Knowledge Systems',
        },
        {
          year: '2026',
          title: 'Open Data and Knowledge Repository Standards',
          nature: 'Guideline',
          field: 'Digital Scholarship',
        },
        {
          year: '2026',
          title: 'IP, Patent, and Innovation Transfer Framework',
          nature: 'Guideline',
          field: 'Commercialization',
        },
      ],
    },
    {
      label: 'Publications',
      summary: 'Journals, policy briefs, working papers, proceedings, and open scholarship outputs.',
      records: [
        {
          year: '2026',
          title: 'Sankofa Journal of Pan-African Studies',
          nature: 'Journal',
          field: 'African Civilizational Studies',
        },
        {
          year: '2026',
          title: 'Climate, Water, and Food Security Policy Briefs',
          nature: 'Policy brief series',
          field: 'Sustainability',
        },
        {
          year: '2026',
          title: 'AI, Governance, and Public Value Working Papers',
          nature: 'Working paper series',
          field: 'AI and Governance',
        },
        {
          year: '2026',
          title: 'Cultural Heritage and Digital Humanities Review',
          nature: 'Research review',
          field: 'Heritage and Media',
        },
      ],
    },
    {
      label: 'Research Proposals',
      summary: 'Doctoral, masters, and funded interdisciplinary proposals in active development.',
      records: [
        {
          year: '2026',
          title: 'Indigenous Knowledge Systems and Public Health Resilience',
          nature: 'Doctoral proposal',
          field: 'Health and Indigenous Systems',
        },
        {
          year: '2026',
          title: 'AI-Assisted Governance Dashboards for Continental Policy',
          nature: 'Doctoral proposal',
          field: 'AI and Public Policy',
        },
        {
          year: '2026',
          title: 'Climate Intelligence for Water, Agriculture, and Food Security',
          nature: 'Masters proposal',
          field: 'Climate and Food Systems',
        },
        {
          year: '2026',
          title: 'Digital Humanities Archive for African Cultural Memory',
          nature: 'Masters proposal',
          field: 'Digital Humanities',
        },
      ],
    },
    {
      label: 'Institute Directory',
      summary: 'The complete institute register, grouped by research strength and operational focus.',
      records: RESEARCH_INSTITUTES.map((institute, index) => ({
        year: '2026',
        title: institute,
        nature: index % 3 === 0 ? 'Institute' : 'Center',
        field: this.getResearchInstituteField(index),
      })),
    },
  ];

  setResearchCatalog(index: number): void {
    const maxIndex = this.researchCatalogs.length - 1;
    this.activeResearchCatalogIndex.set(Math.min(Math.max(index, 0), maxIndex));
  }

  private getResearchInstituteField(index: number): string {
    const fields = [
      'Pan-African Studies',
      'Indigenous Knowledge',
      'Theology and Spiritual Traditions',
      'Governance and Policy',
      'Science and Innovation Policy',
      'Human Rights',
      'Health and Biomedical Research',
      'Climate and Sustainability',
      'Digital Humanities',
      'AI and Robotics',
      'Renewable Energy',
      'Water and Food Security',
      'Global Education',
      'Space and Earth Observation',
      'Behavioral Sciences',
      'Cultural Heritage',
      'Entrepreneurship',
      'Peace and Conflict Resolution',
    ];

    return fields[index] ?? 'Interdisciplinary Research';
  }

  readonly researchSignals: readonly ResearchSignal[] = [
    {
      eyebrow: 'Public Health',
      title: 'Biomedical discovery for community resilience.',
      description: 'Health research moves from lab insight to field practice and policy guidance.',
      path: '/research-innovation',
    },
    {
      eyebrow: 'AI + Society',
      title: 'Human-centered intelligence for African futures.',
      description: 'AI, robotics, data science, and ethics are framed around public usefulness.',
      path: '/ai-advanced-tools',
    },
    {
      eyebrow: 'Climate + Food',
      title: 'Earth systems research tied to everyday survival.',
      description: 'Water, agriculture, renewable energy, and climate intelligence work together.',
      path: '/sustainability',
    },
  ];

  readonly researchSteps: readonly ResearchStep[] = [
    {
      label: '01',
      title: 'Frame',
      description: 'Define a continental question with community, faculty, and partner input.',
    },
    {
      label: '02',
      title: 'Collaborate',
      description: 'Build interdisciplinary teams across institutes, schools, and partner labs.',
    },
    {
      label: '03',
      title: 'Validate',
      description: 'Move through ethics, funding, fieldwork, peer review, and open evidence.',
    },
    {
      label: '04',
      title: 'Transfer',
      description: 'Publish, patent, teach, advise policy, or launch practical innovation.',
    },
  ];

  readonly newsEventFilters = ['All', 'Admissions', 'Research', 'Conferences', 'Community'] as const;
  readonly activeNewsEventFilter = signal<(typeof this.newsEventFilters)[number]>('All');
  readonly showAllNewsEvents = signal(false);
  readonly visibleNewsEvents = computed(() => {
    const activeFilter = this.activeNewsEventFilter();
    if (activeFilter === 'All') {
      return this.newsEvents;
    }

    return this.newsEvents.filter((event) => event.category === activeFilter);
  });
  readonly displayedNewsEvents = computed(() => {
    const events = this.visibleNewsEvents();
    return this.showAllNewsEvents() ? events : events.slice(0, 2);
  });
  readonly hasHiddenNewsEvents = computed(() => this.visibleNewsEvents().length > 2);

  readonly featuredNewsEvent: NewsEventCard = {
    month: 'May',
    day: '18',
    category: 'Admissions',
    title: 'Virtual Open Day for 2026 Applicants',
    summary:
      'A focused live session for undergraduate, postgraduate, certificate, and international applicants.',
    location: 'Online briefing room',
    mode: 'Live + replay',
    image: 'https://images.pexels.com/photos/36098139/pexels-photo-36098139.jpeg?auto=compress&cs=tinysrgb&w=1800',
    imageAlt: 'African graduates standing together in academic gowns',
    imagePosition: '50% 34%',
    path: '/admissions',
  };

  readonly newsEvents: readonly NewsEventCard[] = [
    this.featuredNewsEvent,
    {
      month: 'Jun',
      day: '04',
      category: 'Research',
      title: 'Pan-African Research Seed Fund Briefing',
      summary: 'Guidance for faculty teams preparing proposals in health, governance, climate, AI, and culture.',
      location: 'Research and Innovation Office',
      mode: 'Hybrid',
      image: 'https://images.pexels.com/photos/6129879/pexels-photo-6129879.jpeg?auto=compress&cs=tinysrgb&w=1200',
      imageAlt: 'Researcher working in a laboratory',
      imagePosition: '48% 42%',
      path: '/research-innovation',
    },
    {
      month: 'Jun',
      day: '21',
      category: 'Conferences',
      title: 'African Knowledge Systems Colloquium',
      summary: 'A public scholarship forum on civilizational studies, indigenous knowledge, and digital archives.',
      location: 'Sankofa virtual auditorium',
      mode: 'Conference',
      image: 'https://images.pexels.com/photos/32702845/pexels-photo-32702845.jpeg?auto=compress&cs=tinysrgb&w=1200',
      imageAlt: 'African scholars in a group discussion',
      imagePosition: '50% 38%',
      path: '/about',
    },
    {
      month: 'Jul',
      day: '09',
      category: 'Community',
      title: 'Youth Leadership and Community Futures Workshop',
      summary: 'A practical workshop connecting students, advisors, and community partners around civic leadership.',
      location: 'Community engagement studio',
      mode: 'Workshop',
      image: 'https://images.pexels.com/photos/32668047/pexels-photo-32668047.jpeg?auto=compress&cs=tinysrgb&w=1200',
      imageAlt: 'African students gathered for a community learning moment',
      imagePosition: '50% 40%',
      path: '/community-outreach',
    },
  ];

  readonly newsStories: readonly NewsStory[] = [
    {
      category: 'Admissions',
      date: 'April 2026',
      title: 'Admissions pathways reorganized for clearer applicant journeys',
      summary: 'Sankofa now separates postgraduate, undergraduate, and certificate application pathways.',
      image: 'https://images.pexels.com/photos/36098139/pexels-photo-36098139.jpeg?auto=compress&cs=tinysrgb&w=1200',
      imageAlt: 'African graduates standing together in academic gowns',
      imagePosition: '50% 34%',
      path: '/admissions',
    },
    {
      category: 'Research',
      date: 'April 2026',
      title: 'Research institutes align around public-impact knowledge production',
      summary: 'The institute register now groups scholarship by research strength and operational focus.',
      image: 'https://images.pexels.com/photos/3825572/pexels-photo-3825572.jpeg?auto=compress&cs=tinysrgb&w=1200',
      imageAlt: 'Researcher using a microscope in a laboratory',
      imagePosition: '48% 42%',
      path: '/research-innovation',
    },
    {
      category: 'Academics',
      date: 'March 2026',
      title: 'Academic worlds introduce a cleaner way to explore schools',
      summary: 'Four academic worlds help applicants browse by ambition rather than bureaucracy.',
      image: 'https://images.pexels.com/photos/6238012/pexels-photo-6238012.jpeg?auto=compress&cs=tinysrgb&w=1200',
      imageAlt: 'Black students smiling together in a learning space',
      imagePosition: '50% 38%',
      path: '/faculties-schools',
    },
  ];

  readonly eventChannels: readonly EventChannel[] = [
    {
      label: 'Public scholarship',
      title: 'Lectures and briefings',
      description: 'Short, high-signal sessions for ideas that should travel beyond campus.',
      iconClass: 'pi pi-megaphone',
      path: '/events-conferences',
    },
    {
      label: 'Academic convening',
      title: 'Conferences and colloquia',
      description: 'Scholar-led gatherings for research, methods, policy, and cultural knowledge.',
      iconClass: 'pi pi-calendar-plus',
      path: '/research-innovation',
    },
    {
      label: 'Applicant moments',
      title: 'Open days and showcases',
      description: 'Admissions sessions, faculty showcases, and guided program discovery.',
      iconClass: 'pi pi-users',
      path: '/admissions',
    },
  ];

  readonly newsroomTopics = [
    'African Knowledge',
    'Admissions',
    'Research',
    'Community',
    'Governance',
    'Innovation',
    'Health',
    'Culture',
  ] as const;

  setNewsEventFilter(filter: (typeof this.newsEventFilters)[number]): void {
    this.activeNewsEventFilter.set(filter);
    this.showAllNewsEvents.set(false);
  }

  toggleNewsEvents(): void {
    this.showAllNewsEvents.set(!this.showAllNewsEvents());
  }

  private readonly departmentSlugByTitle = new Map(
    DEPARTMENT_PAGES.map((page) => [page.title, page.slug]),
  );

  getDepartmentSlug(title: string): string | null {
    return this.departmentSlugByTitle.get(title) ?? null;
  }

  private summarizeAcademicSchool(overview: string): string {
    const sentence = overview.trim().split('. ')[0] ?? overview.trim();
    if (sentence.length <= 118) {
      return sentence.endsWith('.') ? sentence : `${sentence}.`;
    }

    return `${sentence.slice(0, 115).trim()}...`;
  }

  readonly admissionsLevels = [
    'Certificate or Diploma',
    'Bachelor Degree',
    'Master Degree',
    'Doctorate',
  ] as const;

  readonly birthDays = Array.from({ length: 31 }, (_, index) => String(index + 1));
  readonly birthMonths = Array.from({ length: 12 }, (_, index) => String(index + 1));

  readonly applicationModes: readonly ApplicationMode[] = [
    { label: 'Undergraduate Application', studyLevel: 'Bachelor Degree' },
    { label: 'Postgraduate Application', studyLevel: 'Master Degree' },
    { label: 'Certificate Application', studyLevel: 'Certificate or Diploma' },
  ];

  readonly activeApplicationMode = signal(this.applicationModes[0].label);

  readonly admissionsForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    alternatePhone: [''],
    gender: ['', [Validators.required]],
    dateOfBirthDay: ['', [Validators.required]],
    dateOfBirthMonth: ['', [Validators.required]],
    dateOfBirthYear: ['', [Validators.required]],
    country: ['', [Validators.required, Validators.minLength(2)]],
    nationality: [''],
    studyLevel: [this.applicationModes[0].studyLevel, [Validators.required]],
    preferredSchool: ['', [Validators.required, Validators.minLength(4)]],
    secondChoice: [''],
    thirdChoice: [''],
    intake: ['', [Validators.required]],
    scholarshipType: [''],
    previouslyEnrolled: ['', [Validators.required]],
    studyMode: ['', [Validators.required]],
    disabilitySupport: ['', [Validators.required]],
    nextOfKinName: ['', [Validators.required, Validators.minLength(3)]],
    nextOfKinRelationship: ['', [Validators.required]],
    nextOfKinEmail: [''],
    nextOfKinPhone: ['', [Validators.required, Validators.minLength(7)]],
    previousEducation: ['', [Validators.required, Validators.minLength(3)]],
    classOfDegree: ['', [Validators.required]],
    academicDocumentsNote: [''],
    nationalIdNote: [''],
    creditTransfer: ['', [Validators.required]],
    referralSource: [''],
    confirmationAnswer: ['', [Validators.required, Validators.pattern(/^42$/)]],
    notes: [''],
  });

  readonly contactForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    department: ['', [Validators.required, Validators.minLength(3)]],
    subject: ['', [Validators.required, Validators.minLength(5)]],
    message: ['', [Validators.required, Validators.minLength(20)]],
  });

  readonly admissionsStatus = signal('');
  readonly contactStatus = signal('');
  readonly isSubmittingAdmissions = signal(false);
  readonly isSubmittingContact = signal(false);

  setApplicationMode(mode: ApplicationMode): void {
    this.activeApplicationMode.set(mode.label);
    this.admissionsForm.patchValue({ studyLevel: mode.studyLevel });
  }

  async submitAdmissionsForm(): Promise<void> {
    this.admissionsStatus.set('');

    if (this.admissionsForm.invalid) {
      this.admissionsForm.markAllAsTouched();
      this.admissionsStatus.set('Please complete all required admissions fields.');
      return;
    }

    const payload = this.admissionsForm.getRawValue();
    this.isSubmittingAdmissions.set(true);

    try {
      const response = await firstValueFrom(
        this.inquiriesService.submitAdmissionsInquiry({
          fullName: payload.fullName,
          email: payload.email,
          country: payload.country,
          studyLevel: payload.studyLevel,
          preferredSchool: payload.preferredSchool,
          notes: this.composeAdmissionsNotes(payload),
        }),
      );
      this.admissionsStatus.set(response.message || 'Admissions inquiry submitted successfully.');
      const activeStudyLevel =
        this.applicationModes.find((mode) => mode.label === this.activeApplicationMode())?.studyLevel ??
        this.applicationModes[0].studyLevel;
      this.admissionsForm.reset({
        fullName: '',
        email: '',
        phone: '',
        alternatePhone: '',
        gender: '',
        dateOfBirthDay: '',
        dateOfBirthMonth: '',
        dateOfBirthYear: '',
        country: '',
        nationality: '',
        studyLevel: activeStudyLevel,
        preferredSchool: '',
        secondChoice: '',
        thirdChoice: '',
        intake: '',
        scholarshipType: '',
        previouslyEnrolled: '',
        studyMode: '',
        disabilitySupport: '',
        nextOfKinName: '',
        nextOfKinRelationship: '',
        nextOfKinEmail: '',
        nextOfKinPhone: '',
        previousEducation: '',
        classOfDegree: '',
        academicDocumentsNote: '',
        nationalIdNote: '',
        creditTransfer: '',
        referralSource: '',
        confirmationAnswer: '',
        notes: '',
      });
    } catch (error: unknown) {
      this.admissionsStatus.set(
        this.extractErrorMessage(error) ||
          'Online submission failed. Use the email fallback button below.',
      );
    } finally {
      this.isSubmittingAdmissions.set(false);
    }
  }

  async submitContactForm(): Promise<void> {
    this.contactStatus.set('');

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.contactStatus.set('Please complete all required contact fields.');
      return;
    }

    const payload = this.contactForm.getRawValue();
    this.isSubmittingContact.set(true);

    try {
      const response = await firstValueFrom(
        this.inquiriesService.submitContactInquiry({
          fullName: payload.fullName,
          email: payload.email,
          department: payload.department,
          subject: payload.subject,
          message: payload.message,
        }),
      );
      this.contactStatus.set(response.message || 'Administrative inquiry submitted successfully.');
      this.contactForm.reset({
        fullName: '',
        email: '',
        department: '',
        subject: '',
        message: '',
      });
    } catch (error: unknown) {
      this.contactStatus.set(
        this.extractErrorMessage(error) || 'Online submission failed. Use the email fallback button below.',
      );
    } finally {
      this.isSubmittingContact.set(false);
    }
  }

  useEmailFallbackForAdmissions(): void {
    const payload = this.admissionsForm.getRawValue();
    const body = [
      'Admissions Inquiry',
      '',
      `Name: ${payload.fullName || ''}`,
      `Email: ${payload.email || ''}`,
      `Phone: ${payload.phone || ''}`,
      `Alternative phone: ${payload.alternatePhone || ''}`,
      `Gender: ${payload.gender || ''}`,
      `Date of birth: ${payload.dateOfBirthDay || ''}/${payload.dateOfBirthMonth || ''}/${payload.dateOfBirthYear || ''}`,
      `Country: ${payload.country || ''}`,
      `Nationality: ${payload.nationality || ''}`,
      `Study level: ${payload.studyLevel || ''}`,
      `1st programme choice: ${payload.preferredSchool || ''}`,
      `2nd programme choice: ${payload.secondChoice || ''}`,
      `3rd programme choice: ${payload.thirdChoice || ''}`,
      `Intake: ${payload.intake || ''}`,
      `Scholarship type: ${payload.scholarshipType || ''}`,
      `Previously enrolled: ${payload.previouslyEnrolled || ''}`,
      `Preferred study mode: ${payload.studyMode || ''}`,
      `Disability support: ${payload.disabilitySupport || ''}`,
      `Next of kin name: ${payload.nextOfKinName || ''}`,
      `Next of kin relationship: ${payload.nextOfKinRelationship || ''}`,
      `Next of kin email: ${payload.nextOfKinEmail || ''}`,
      `Next of kin phone: ${payload.nextOfKinPhone || ''}`,
      `Previous education: ${payload.previousEducation || ''}`,
      `Class of degree/diploma: ${payload.classOfDegree || ''}`,
      `Academic documents: ${payload.academicDocumentsNote || ''}`,
      `National ID or passport: ${payload.nationalIdNote || ''}`,
      `Credit transfer: ${payload.creditTransfer || ''}`,
      `Referral source: ${payload.referralSource || ''}`,
      `Notes: ${payload.notes || 'None'}`,
    ].join('\n');

    this.dispatchEmail(
      'Admissions Inquiry - Sankofa Alkebulan University',
      body,
      'Admissions inquiry prepared in your email client.',
    );
  }

  useEmailFallbackForContact(): void {
    const payload = this.contactForm.getRawValue();
    const body = [
      'Administrative Inquiry',
      '',
      `Name: ${payload.fullName || ''}`,
      `Email: ${payload.email || ''}`,
      `Department: ${payload.department || ''}`,
      `Subject: ${payload.subject || ''}`,
      '',
      payload.message || '',
    ].join('\n');

    this.dispatchEmail(
      'Administrative Inquiry - Sankofa Alkebulan University',
      body,
      'Inquiry prepared in your email client.',
    );
  }

  private dispatchEmail(subject: string, body: string, successMessage: string): void {
    if (typeof window === 'undefined') {
      if (subject.startsWith('Admissions')) {
        this.admissionsStatus.set('Submission is unavailable during server rendering.');
        return;
      }

      this.contactStatus.set('Submission is unavailable during server rendering.');
      return;
    }

    const mailtoLink =
      `mailto:${this.universityEmail}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    if (subject.startsWith('Admissions')) {
      this.admissionsStatus.set(successMessage);
      return;
    }

    this.contactStatus.set(successMessage);
  }

  private composeAdmissionsNotes(payload: {
    phone: string;
    alternatePhone: string;
    gender: string;
    dateOfBirthDay: string;
    dateOfBirthMonth: string;
    dateOfBirthYear: string;
    nationality: string;
    intake: string;
    scholarshipType: string;
    previouslyEnrolled: string;
    studyMode: string;
    disabilitySupport: string;
    nextOfKinName: string;
    nextOfKinRelationship: string;
    nextOfKinEmail: string;
    nextOfKinPhone: string;
    previousEducation: string;
    secondChoice: string;
    thirdChoice: string;
    classOfDegree: string;
    academicDocumentsNote: string;
    nationalIdNote: string;
    creditTransfer: string;
    referralSource: string;
    notes: string;
  }): string | undefined {
    const rows = [
      ['Application mode', this.activeApplicationMode()],
      ['Phone', payload.phone],
      ['Alternative phone', payload.alternatePhone],
      ['Gender', payload.gender],
      ['Date of birth', `${payload.dateOfBirthDay}/${payload.dateOfBirthMonth}/${payload.dateOfBirthYear}`],
      ['Nationality', payload.nationality],
      ['Intake', payload.intake],
      ['Scholarship type', payload.scholarshipType],
      ['Previously enrolled', payload.previouslyEnrolled],
      ['Preferred study mode', payload.studyMode],
      ['Disability support', payload.disabilitySupport],
      ['Next of kin name', payload.nextOfKinName],
      ['Next of kin relationship', payload.nextOfKinRelationship],
      ['Next of kin email', payload.nextOfKinEmail],
      ['Next of kin phone', payload.nextOfKinPhone],
      ['2nd programme choice', payload.secondChoice],
      ['3rd programme choice', payload.thirdChoice],
      ['Previous education', payload.previousEducation],
      ['Class of degree/diploma', payload.classOfDegree],
      ['Academic documents', payload.academicDocumentsNote],
      ['National ID or passport', payload.nationalIdNote],
      ['Credit transfer', payload.creditTransfer],
      ['Referral source', payload.referralSource],
      ['Notes', payload.notes],
    ]
      .filter(([, value]) => !!value)
      .map(([label, value]) => `${label}: ${value}`);

    return rows.length ? rows.join('\n') : undefined;
  }

  private extractErrorMessage(error: unknown): string | null {
    if (typeof error === 'object' && error && 'error' in error) {
      const errorData = (error as { error?: unknown }).error;
      if (
        typeof errorData === 'object' &&
        errorData &&
        'message' in errorData &&
        typeof (errorData as { message?: unknown }).message === 'string'
      ) {
        return (errorData as { message: string }).message;
      }
    }

    if (typeof error === 'object' && error && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return null;
  }
}
