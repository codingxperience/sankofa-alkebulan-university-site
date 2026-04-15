export interface ProgramOutline {
  readonly title: string;
  readonly items: readonly string[];
}

export interface ProgramDetail {
  readonly title: string;
  readonly award: string;
  readonly overview: string;
  readonly objectives?: readonly string[];
  readonly outcomes?: readonly string[];
  readonly moreInfo?: string;
  readonly admissions: readonly string[];
  readonly duration: string;
  readonly tuition: readonly string[];
  readonly outline: readonly ProgramOutline[];
}

export interface FeaturedDepartment {
  readonly name: string;
  readonly programs: readonly ProgramDetail[];
}

export interface DepartmentPage {
  readonly slug: string;
  readonly title: string;
  readonly overview: string;
  readonly departments: readonly string[];
  readonly featuredDepartment: FeaturedDepartment;
}

export interface DepartmentRouteAlias {
  readonly label: string;
  readonly path: string;
}

export const DEPARTMENT_ROUTE_ALIASES: Readonly<Record<string, DepartmentRouteAlias>> = {
  'school-of-business-economics-and-entrepreneurship': {
    label: 'Business School',
    path: '/home/Business School',
  },
  'graduate-school': {
    label: 'Graduate School',
    path: '/home/Graduate School',
  },
  'school-of-education': {
    label: 'School of Education',
    path: '/home/School of Education',
  },
  'school-of-engineering-and-applied-technologies': {
    label: 'School of Technology, Computing & Engineering',
    path: '/home/School of Technology, Computing & Engineering',
  },
  'school-of-law-and-human-rights': {
    label: 'Law School',
    path: '/home/Law School',
  },
  'institute-of-public-health-and-health-sciences': {
    label: 'Institute of Public Health & Health Sciences',
    path: '/home/Institute of Public Health & Health Sciences',
  },
  'institute-of-african-culture-science-and-technology-iacst': {
    label: 'Institute of African Culture, Science and Technology (IACST)',
    path: '/home/Institute of African Culture, Science and Technology (IACST)',
  },
};

export const getDepartmentPagePath = (page: Pick<DepartmentPage, 'slug' | 'title'>): string =>
  DEPARTMENT_ROUTE_ALIASES[page.slug]?.path ?? `/faculties-schools/${page.slug}`;

export const getDepartmentPageLabel = (page: Pick<DepartmentPage, 'slug' | 'title'>): string =>
  DEPARTMENT_ROUTE_ALIASES[page.slug]?.label ?? page.title;

export const DEPARTMENT_PAGES: readonly DepartmentPage[] = [
  {
    slug: 'college-of-african-civilizational-studies',
    title: 'College of African Civilizational Studies',
    overview:
      "The College of African Civilizational Studies examines Africa's historical, philosophical, intellectual, and cultural development from antiquity to the contemporary era. The college focuses on recovering African knowledge systems, civilizational heritage, and intellectual traditions that shaped global history.",
    departments: [
      'Department of African History and Civilizations',
      'Department of Pan-African Studies',
      'Department of Cultural Heritage and Archaeology',
      'Department of Indigenous Knowledge Systems',
    ],
    featuredDepartment: {
      name: 'Department of African History and Civilizations',
      programs: [
        {
          title: 'Bachelor of African Civilizational Studies',
          award: 'BACS',
          overview:
            'Interdisciplinary training that explores the political, economic, cultural, and intellectual development of African societies across historical periods. Students study ancient civilizations, pre-colonial governance systems, colonial transformations, and contemporary identities while advancing Pan-African perspectives on knowledge production.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Recognized diploma in history, humanities, or cultural studies',
            'Mature entry candidates aged 25 years and above who pass the university entrance examination',
            'International qualifications equivalent to advanced secondary education',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,200,000 per year',
            'Regional students: USD 1,300 per year',
            'International students: USD 2,200 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to African Civilizations',
                'African Oral Traditions and Historiography',
                'Academic Writing and Research Skills',
                'African Cultural Philosophy',
                'Ancient African Kingdoms and Empires',
                'Introduction to Archaeology',
                'African Political Thought',
                'Research Methods in History',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Pre-Colonial African Governance Systems',
                'African Diaspora Studies',
                'African Economic Systems',
                'Historical Methods and Sources',
                'Colonialism and African Resistance',
                'African Intellectual History',
                'African Religious Traditions',
                'Field Research Methods',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'African Nationalist Movements',
                'Postcolonial African States',
                'Cultural Heritage Preservation',
                'African Cultural Institutions',
                'African Global Relations',
                'Pan-African Political Movements',
                'Cultural Diplomacy',
                'Research Proposal Development',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Advanced African Historiography',
                'Heritage Policy and Cultural Law',
                'Museum and Archive Studies',
                'Professional Internship',
                'Undergraduate Thesis',
                'Public History and Knowledge Dissemination',
                'Pan-African Leadership Seminar',
              ],
            },
          ],
        },
        {
          title: 'Diploma in African Heritage Studies',
          award: 'Diploma',
          overview:
            'Prepares graduates to work in museums, archives, and heritage conservation organizations with skills in cultural documentation, heritage management, and preservation of historical sites.',
          admissions: [
            'Uganda Certificate of Education or equivalent secondary education',
            'Mature entry candidates with relevant experience may apply',
          ],
          duration: '2 years',
          tuition: ['UGX 2,100,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to African Heritage',
                'Cultural Documentation Methods',
                'Museum Studies',
                'Community Heritage Preservation',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Archival Management',
                'Heritage Tourism',
                'Digital Heritage Preservation',
                'Field Practicum',
              ],
            },
          ],
        },
        {
          title: 'Certificate in African Cultural Studies',
          award: 'Certificate',
          overview:
            'Introduces African cultural traditions, oral history, and civilizational heritage for community educators, cultural workers, and learners seeking foundational cultural knowledge.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Foundations of African Culture',
                'African Oral Traditions',
                'Introduction to Pan-Africanism',
                'African Cultural Institutions',
                'Heritage Documentation',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'college-of-theology-and-religious-studies',
    title: 'College of Theology and Religious Studies',
    overview:
      'Dedicated to the rigorous academic study of religion, theology, and spirituality within African and global contexts. The college emphasizes African Christian theology, African traditional religions, interfaith dialogue, and the role of religion in social transformation.',
    departments: [
      'Department of Biblical Studies',
      'Department of African Theology and Religious Traditions',
      'Department of Comparative Religion and Interfaith Studies',
      'Department of Practical Theology and Ministry',
    ],
    featuredDepartment: {
      name: 'Department of Biblical Studies',
      programs: [
        {
          title: 'Bachelor of Theology',
          award: 'BTh',
          overview:
            'Provides a comprehensive academic foundation in biblical studies, historical theology, and Christian doctrine with rigorous textual analysis of sacred scriptures and African contextual theology.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Recognized diploma in theology, religious studies, or humanities',
            'Mature entry applicants aged 25 years or above who pass university entrance examinations',
            'International qualifications equivalent to advanced secondary education',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,000,000 per year',
            'Regional students: USD 1,200 per year',
            'International students: USD 2,000 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to the Old Testament',
                'Foundations of Christian Theology',
                'Academic Writing and Research Methods',
                'Introduction to African Religious Traditions',
                'Introduction to the New Testament',
                'Church History I',
                'Biblical Interpretation Methods',
                'Religious Ethics',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Biblical Greek I',
                'Old Testament Theology',
                'Church History II',
                'Philosophy of Religion',
                'Biblical Greek II',
                'New Testament Theology',
                'Christian Doctrine',
                'African Christianity',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Biblical Hermeneutics',
                'Comparative Religion',
                'Christian Ethics and Social Justice',
                'Pastoral Counseling',
                'African Contextual Theology',
                'Missiology',
                'Interfaith Dialogue',
                'Research Methods in Theology',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Advanced Biblical Studies',
                'Religion and Society in Africa',
                'Leadership in Ministry',
                'Field Internship',
                'Undergraduate Dissertation',
                'Practical Ministry Seminar',
                'Theology and Public Life',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Christian Ministry',
          award: 'Diploma',
          overview:
            'Equips students with practical pastoral skills and foundational theological knowledge for leadership in churches, faith-based organizations, and community ministries.',
          admissions: [
            'Uganda Certificate of Education or equivalent secondary education',
            'Mature applicants with ministry experience may apply',
          ],
          duration: '2 years',
          tuition: ['UGX 2,000,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Biblical Foundations',
                'Introduction to Christian Doctrine',
                'Christian Leadership',
                'Homiletics and Preaching',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Pastoral Care and Counseling',
                'Church Administration',
                'Evangelism and Mission',
                'Community Ministry Practicum',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Biblical Studies',
          award: 'Certificate',
          overview:
            'Introductory understanding of biblical literature, Christian teachings, and theological reflection for personal enrichment or ministry preparation.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,100,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Introduction to the Bible',
                'Foundations of Christian Faith',
                'Christian Ethics',
                'Spiritual Formation',
                'Introduction to Theology',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'college-of-humanities-and-cultural-studies',
    title: 'College of Humanities and Cultural Studies',
    overview:
      'Provides interdisciplinary education in philosophy, languages, literature, and historical cultural analysis. The college emphasizes African thought, linguistic diversity, literary expression, and cultural heritage.',
    departments: [
      'Department of Philosophy and Ethics',
      'Department of Languages and Linguistics',
      'Department of Literature and Cultural Studies',
      'Department of Historical and Cultural Analysis',
    ],
    featuredDepartment: {
      name: 'Department of Philosophy and Ethics',
      programs: [
        {
          title: 'Bachelor of Philosophy and Ethics',
          award: 'BPE',
          overview:
            'Develops analytical and critical reasoning through classical and African philosophical traditions, examining knowledge, morality, justice, and human existence with applied ethics.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Recognized diploma in humanities, philosophy, or related disciplines',
            'Mature entry candidates aged 25 years or above who pass the university entrance examination',
            'International qualifications equivalent to advanced secondary education',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,000,000 per year',
            'Regional students: USD 1,200 per year',
            'International students: USD 2,000 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Philosophy',
                'African Philosophy',
                'Critical Thinking and Logic',
                'Academic Writing',
                'Ethics and Moral Philosophy',
                'History of Western Philosophy',
                'Philosophy of Culture',
                'Research Methods',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Political Philosophy',
                'Philosophy of Religion',
                'African Ethical Systems',
                'Philosophy of Knowledge',
                'Philosophy of Science',
                'Philosophy of Law',
                'Environmental Ethics',
                'Philosophical Text Analysis',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Modern Philosophy',
                'African Intellectual Traditions',
                'Human Rights and Ethics',
                'Social Philosophy',
                'Philosophy of Technology',
                'Global Ethics',
                'Bioethics',
                'Research Proposal Development',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Advanced Ethical Theory',
                'Public Philosophy',
                'Leadership and Ethical Governance',
                'Professional Internship',
                'Undergraduate Dissertation',
                'Philosophy and Contemporary Society',
                'Capstone Seminar',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Cultural and Language Studies',
          award: 'Diploma',
          overview:
            'Focuses on linguistic diversity, cultural communication, and literary traditions with practical skills for translation and community engagement.',
          admissions: [
            'Uganda Certificate of Education or equivalent secondary education',
            'Mature entry applicants with relevant experience may apply',
          ],
          duration: '2 years',
          tuition: ['UGX 2,000,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Linguistics',
                'African Languages and Communication',
                'Cultural Anthropology',
                'Language and Society',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Translation Studies',
                'Intercultural Communication',
                'African Literature',
                'Community Language Projects',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Cultural Heritage and Communication',
          award: 'Certificate',
          overview:
            'Introduces preservation of cultural knowledge, oral traditions, and linguistic heritage with foundational skills for community engagement.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,100,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Introduction to Cultural Heritage',
                'Oral Traditions and Storytelling',
                'Communication in Multicultural Societies',
                'African Cultural Expressions',
                'Community Cultural Documentation',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'college-of-leadership-and-governance',
    title: 'College of Leadership and Governance',
    overview:
      'Prepares leaders, policymakers, and administrators through governance studies, public policy, diplomacy, and ethical decision-making with a strong Pan-African perspective.',
    departments: [
      'Department of Public Administration and Management',
      'Department of Political Science and International Relations',
      'Department of Governance, Policy, and Ethics',
      'Department of Leadership Studies',
    ],
    featuredDepartment: {
      name: 'Department of Public Administration and Management',
      programs: [
        {
          title: 'Bachelor of Public Administration',
          award: 'BPA',
          overview:
            'Combines administrative theory, organizational management, strategic planning, and governance ethics to prepare graduates for public sector leadership.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Diploma in public administration, management, or related fields',
            'Mature entry applicants aged 25+ with relevant experience',
            'International equivalent secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,400,000 per year',
            'Regional students: USD 1,400 per year',
            'International students: USD 2,500 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Public Administration',
                'Organizational Behavior',
                'Academic Writing and Research',
                'Foundations of Governance',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Public Policy Analysis',
                'Administrative Law',
                'Human Resource Management',
                'Public Sector Financial Management',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Strategic Management',
                'E-Governance and Digital Administration',
                'Leadership and Ethics in Public Service',
                'Project Management',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Policy Implementation and Evaluation',
                'International Public Administration',
                'Research Project',
                'Professional Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Public Administration',
          award: 'Diploma',
          overview:
            'Trains students in administrative procedures, policy analysis, and organizational management for government, NGO, and civic roles.',
          admissions: [
            'Uganda Certificate of Education or equivalent',
            'Relevant work experience preferred but not required',
          ],
          duration: '2 years',
          tuition: ['UGX 2,100,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Foundations of Public Administration',
                'Introduction to Governance',
                'Office Management',
                'Communication Skills',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Policy Development',
                'Public Finance Management',
                'Administrative Ethics',
                'Field Practicum',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Leadership and Governance',
          award: 'Certificate',
          overview:
            'Provides foundational knowledge in leadership principles, decision-making, and governance ethics for community leaders and civil servants.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,100,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Leadership Principles',
                'Governance and Ethics',
                'Public Policy Basics',
                'Community Leadership Projects',
                'Decision-Making and Problem-Solving',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'college-of-science-technology-and-innovation',
    title: 'College of Science, Technology, and Innovation',
    overview:
      'Focuses on interdisciplinary scientific inquiry, applied research, and technological development with emphasis on African solutions to local and global challenges.',
    departments: [
      'Department of Physics, Chemistry, and Materials Science',
      'Department of Biology and Life Sciences',
      'Department of Computer Science and Information Technology',
      'Department of Innovation and Technology Management',
    ],
    featuredDepartment: {
      name: 'Department of Computer Science and Information Technology',
      programs: [
        {
          title: 'Bachelor of Science in Computer Science',
          award: 'BSc CS',
          overview:
            'Develops expertise in software development, data analysis, artificial intelligence, cybersecurity, and digital systems through practical projects and internships.',
          admissions: [
            'Uganda Advanced Certificate of Education with Mathematics and Physics/Computer Science',
            'Diploma in computing or related field',
            'Mature entry candidates aged 25+ with relevant experience',
            'International qualifications equivalent to advanced secondary education',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,500,000 per year',
            'Regional students: USD 1,400 per year',
            'International students: USD 2,500 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Computer Science',
                'Programming Fundamentals',
                'Discrete Mathematics',
                'Digital Logic',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Data Structures and Algorithms',
                'Database Systems',
                'Computer Architecture',
                'Statistics and Probability for Computing',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Software Engineering',
                'Operating Systems',
                'Artificial Intelligence Foundations',
                'Web and Mobile Application Development',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Machine Learning and Data Analytics',
                'Cybersecurity and Network Management',
                'Capstone Project',
                'Industry Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Information Technology',
          award: 'Diploma',
          overview:
            'Provides technical training in computing, networking, software applications, and system administration for IT support and software roles.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,200,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Computing',
                'Programming Basics',
                'Networking Fundamentals',
                'Database Basics',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'System Administration',
                'Software Development',
                'Web Design',
                'IT Project Practicum',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Computing and Digital Skills',
          award: 'Certificate',
          overview:
            'A one-year foundational program for learners seeking basic computing and digital literacy skills.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Introduction to Computers',
                'Office Productivity Tools',
                'Basic Programming',
                'Internet and Digital Communication',
                'Digital Safety and Ethics',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-global-education-and-international-relations',
    title: 'School of Global Education and International Relations',
    overview:
      'Prepares students for careers in diplomacy, international organizations, global policy, and cross-cultural education with strong Pan-African and global citizenship perspectives.',
    departments: [
      'Department of International Relations and Diplomacy',
      'Department of Global Education and Comparative Studies',
      'Department of International Law and Human Rights',
      'Department of Development Studies',
    ],
    featuredDepartment: {
      name: 'Department of International Relations and Diplomacy',
      programs: [
        {
          title: 'Bachelor of International Relations',
          award: 'BIR',
          overview:
            'Builds knowledge of global political systems, diplomacy, international security, and foreign policy with practical skills in negotiation and conflict resolution.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Diploma in political science, social sciences, or related field',
            'Mature applicants aged 25+ with relevant experience',
            'Equivalent international secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,400,000 per year',
            'Regional students: USD 1,400 per year',
            'International students: USD 2,500 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to International Relations',
                'World History and Civilizations',
                'Global Politics Foundations',
                'Academic Writing and Research',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'International Organizations and Law',
                'Comparative Politics',
                'International Economics',
                'Diplomatic Communication',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Conflict Analysis and Peacebuilding',
                'Global Security Studies',
                'Development Policy and Governance',
                'Field Research Methods',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'International Negotiation and Diplomacy',
                'Global Leadership and Ethics',
                'Capstone Research Project',
                'Internship at International Organization',
              ],
            },
          ],
        },
        {
          title: 'Diploma in International Relations',
          award: 'Diploma',
          overview:
            'Equips students with practical knowledge in diplomacy, cross-cultural communication, and international affairs.',
          admissions: ['Uganda Certificate of Education or equivalent'],
          duration: '2 years',
          tuition: ['UGX 2,200,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Foundations of International Relations',
                'Global History and Culture',
                'Communication and Diplomacy Skills',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Introduction to International Law',
                'Global Policy Studies',
                'Internship or Practical Assignment',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Global Studies',
          award: 'Certificate',
          overview:
            'Provides foundational understanding of international systems, global cultures, and contemporary world issues.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Global Politics and Society',
                'Introduction to International Law',
                'World Cultures and Global Citizenship',
                'Intercultural Communication',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-business-economics-and-entrepreneurship',
    title: 'School of Business, Economics, and Entrepreneurship',
    overview:
      'Equips students with analytical tools and entrepreneurial skills for ethical business practice, financial literacy, economic development, and innovation-driven enterprise.',
    departments: [
      'Department of Business Administration',
      'Department of Economics and Policy Analysis',
      'Department of Entrepreneurship and Innovation',
      'Department of Finance and Accounting',
    ],
    featuredDepartment: {
      name: 'Department of Business Administration',
      programs: [
        {
          title: 'Bachelor of Business Administration',
          award: 'BBA',
          overview:
            'Provides comprehensive knowledge in management, marketing, operations, human resources, and strategic planning with practical applications and internships.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Diploma in business, management, or related field',
            'Mature applicants aged 25+ with relevant work experience',
            'International qualifications equivalent to advanced secondary education',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,400,000 per year',
            'Regional students: USD 1,400 per year',
            'International students: USD 2,500 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Principles of Management',
                'Introduction to Economics',
                'Accounting Fundamentals',
                'Business Communication',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Marketing Management',
                'Organizational Behavior',
                'Business Law and Ethics',
                'Quantitative Methods for Business',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Financial Management',
                'Operations and Supply Chain Management',
                'Entrepreneurship and Innovation',
                'Strategic Management',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'International Business',
                'Business Analytics and Data-Driven Decisions',
                'Capstone Business Project',
                'Internship or Industrial Placement',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Business and Entrepreneurship',
          award: 'Diploma',
          overview:
            'Prepares students for practical business management and entrepreneurial skills with emphasis on startup planning and small enterprise management.',
          admissions: ['Uganda Certificate of Education or equivalent'],
          duration: '2 years',
          tuition: ['UGX 2,200,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Foundations of Business',
                'Principles of Entrepreneurship',
                'Financial Management',
                'Business Communication',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Marketing and Sales',
                'Small Business Operations',
                'Business Planning and Strategy',
                'Entrepreneurial Project or Internship',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Business and Economics',
          award: 'Certificate',
          overview:
            'Provides foundational understanding of economics, business principles, and financial literacy for new entrants to the business world.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Introduction to Economics',
                'Principles of Business',
                'Accounting Basics',
                'Entrepreneurship Fundamentals',
                'Practical Business Projects',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-law-and-human-rights',
    title: 'School of Law and Human Rights',
    overview:
      'Provides rigorous legal education with a strong focus on human rights, social justice, and ethical legal practice within African and international legal systems.',
    departments: [
      'Department of Public and Constitutional Law',
      'Department of International and Human Rights Law',
      'Department of Criminal and Procedural Law',
      'Department of Legal Practice and Advocacy',
    ],
    featuredDepartment: {
      name: 'Department of International and Human Rights Law',
      programs: [
        {
          title: 'Bachelor of Laws',
          award: 'LLB',
          overview:
            'Comprehensive understanding of national, regional, and international legal systems with emphasis on human rights, governance, and legal ethics.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Diploma in law or related field for advanced entry',
            'Mature applicants aged 25+ who pass the university entrance examination',
            'International secondary education qualifications equivalent to A-levels',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,800,000 per year',
            'Regional students: USD 1,500 per year',
            'International students: USD 2,700 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Law',
                'Constitutional Law I',
                'Legal Methods and Research',
                'African Legal Traditions',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Contract Law',
                'Criminal Law',
                'Torts and Civil Liability',
                'Administrative Law',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'International Human Rights Law',
                'Public International Law',
                'Property Law',
                'Legal Ethics and Professional Responsibility',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Comparative Constitutional Law',
                'Advanced Human Rights Advocacy',
                'Legal Drafting and Moot Court',
                'Internship or Clerkship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Legal Studies',
          award: 'Diploma',
          overview:
            'Practical training in fundamental legal principles, civil procedure, and human rights awareness for entry-level legal roles.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,400,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Foundations of Law',
                'Introduction to Human Rights',
                'Legal Writing and Research',
                'Administrative Law',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Civil and Criminal Procedure',
                'Constitutional Awareness',
                'Legal Practice Skills',
                'Practical Internship',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Human Rights and Legal Studies',
          award: 'Certificate',
          overview:
            'Foundational knowledge of legal systems, human rights principles, and advocacy skills for students and community leaders.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Introduction to Law',
                'Fundamentals of Human Rights',
                'Community Legal Education',
                'Advocacy and Conflict Resolution',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'college-of-health-sciences-and-biomedical-studies',
    title: 'College of Health Sciences and Biomedical Studies',
    overview:
      'Provides comprehensive education and training in medicine, public health, nursing, and biomedical research with focus on evidence-based healthcare and community health development.',
    departments: [
      'Department of Medicine and Clinical Sciences',
      'Department of Nursing and Midwifery',
      'Department of Public Health and Epidemiology',
      'Department of Biomedical and Laboratory Sciences',
    ],
    featuredDepartment: {
      name: 'Department of Medicine and Clinical Sciences',
      programs: [
        {
          title: 'Bachelor of Medicine and Surgery',
          award: 'MBChB',
          overview:
            'Rigorous training in medical sciences, clinical skills, and patient care with hands-on clinical rotations and research exposure.',
          admissions: [
            'Uganda Advanced Certificate of Education with principal passes in Biology, Chemistry, and Physics/Mathematics',
            'Diploma in health sciences for advanced entry',
            'Mature applicants aged 25+ with relevant qualifications',
            'Equivalent international secondary education',
          ],
          duration: '5 years (10 semesters)',
          tuition: [
            'Domestic students: UGX 6,500,000 per year',
            'Regional students: USD 2,500 per year',
            'International students: USD 4,000 per year',
          ],
          outline: [
            {
              title: 'Years 1-2 (Pre-Clinical)',
              items: [
                'Anatomy and Physiology',
                'Biochemistry and Molecular Biology',
                'Introduction to Clinical Medicine',
                'Medical Ethics and Professionalism',
              ],
            },
            {
              title: 'Years 3-4 (Clinical Sciences)',
              items: [
                'Pathology and Microbiology',
                'Pharmacology',
                'Internal Medicine',
                'Surgery and Trauma',
                'Pediatrics and Obstetrics',
              ],
            },
            {
              title: 'Year 5 (Clinical Rotations and Internship)',
              items: [
                'Community Medicine',
                'Specialized Clinical Rotations',
                'Research in Clinical Practice',
                'Professional Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Nursing Science',
          award: 'Diploma',
          overview:
            'Prepares students to provide professional nursing care, promote health, and implement community health initiatives.',
          admissions: ['Uganda Certificate of Education with passes in Biology and Chemistry'],
          duration: '3 years',
          tuition: ['UGX 3,200,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Anatomy and Physiology',
                'Fundamentals of Nursing',
                'Health Promotion and Education',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Medical-Surgical Nursing',
                'Community and Public Health Nursing',
                'Pharmacology for Nurses',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Mental Health Nursing',
                'Maternal and Child Health',
                'Clinical Practicum and Internship',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Public Health',
          award: 'Certificate',
          overview:
            'Introduces basic public health principles, epidemiology, health promotion, and disease prevention.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,500,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Introduction to Public Health',
                'Epidemiology and Biostatistics',
                'Health Education and Promotion',
                'Community Health Projects',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-environmental-and-sustainability-studies',
    title: 'School of Environmental and Sustainability Studies',
    overview:
      'Addresses environmental challenges, climate change, sustainable development, and natural resource management through interdisciplinary science, policy, and community engagement.',
    departments: [
      'Department of Environmental Science and Management',
      'Department of Climate Change and Sustainability Policy',
      'Department of Renewable Energy and Smart Infrastructure',
      'Department of Natural Resource and Ecosystem Management',
    ],
    featuredDepartment: {
      name: 'Department of Environmental Science and Management',
      programs: [
        {
          title: 'Bachelor of Environmental Science',
          award: 'BEnvSc',
          overview:
            'Equips students with scientific and practical knowledge for analyzing, managing, and mitigating environmental problems and sustainable development practices.',
          admissions: [
            'Uganda Advanced Certificate of Education with passes in Biology and Chemistry',
            'Diploma in environmental studies or related field for advanced entry',
            'Mature applicants aged 25+ with relevant experience',
            'International equivalent secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,500,000 per year',
            'Regional students: USD 1,400 per year',
            'International students: USD 2,500 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Environmental Science',
                'Ecology and Biodiversity',
                'Environmental Chemistry',
                'Research Methods',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Environmental Policy and Legislation',
                'Environmental Impact Assessment',
                'Waste Management and Pollution Control',
                'GIS and Remote Sensing',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Climate Change Science',
                'Sustainable Resource Management',
                'Renewable Energy Systems',
                'Environmental Economics',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Environmental Project Design and Management',
                'Field Research and Internship',
                'Capstone Environmental Study',
                'Sustainability Reporting and Policy Analysis',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Environmental Management',
          award: 'Diploma',
          overview:
            'Provides practical skills in environmental monitoring, conservation, and sustainable practices for government and NGO roles.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,200,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Fundamentals of Environmental Science',
                'Natural Resource Management',
                'Environmental Laws and Policies',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Sustainability Practices',
                'Community Environmental Projects',
                'Field Practicum and Reporting',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Sustainability and Environmental Awareness',
          award: 'Certificate',
          overview:
            'Introduces basic concepts of environmental protection, sustainable practices, and climate awareness for community leaders and NGO workers.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Introduction to Environmental Studies',
                'Climate Change Awareness',
                'Sustainable Development Practices',
                'Community Engagement and Green Initiatives',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-agriculture-and-food-security',
    title: 'School of Agriculture and Food Security',
    overview:
      'Prepares students to enhance agricultural productivity, ensure food security, and promote sustainable agribusiness with hands-on research and field practice.',
    departments: [
      'Department of Crop and Soil Sciences',
      'Department of Livestock and Animal Production',
      'Department of Agribusiness and Food Systems',
      'Department of Agricultural Technology and Innovation',
    ],
    featuredDepartment: {
      name: 'Department of Agribusiness and Food Systems',
      programs: [
        {
          title: 'Bachelor of Science in Agribusiness',
          award: 'BSc Agribusiness',
          overview:
            'Combines agricultural science with business and management principles to manage farms, agribusiness enterprises, and supply chains.',
          admissions: [
            'Uganda Advanced Certificate of Education with passes in Biology and Agriculture/Mathematics',
            'Diploma in agriculture, business, or related field for advanced entry',
            'Mature applicants aged 25+ with relevant experience',
            'International equivalent secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,400,000 per year',
            'Regional students: USD 1,400 per year',
            'International students: USD 2,500 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Agriculture and Food Systems',
                'Principles of Economics',
                'Crop Science Fundamentals',
                'Agricultural Communication Skills',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Soil Science and Fertility Management',
                'Agricultural Marketing',
                'Livestock Management Basics',
                'Research Methods in Agriculture',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Supply Chain Management in Agriculture',
                'Agribusiness Finance',
                'Sustainable Farming Practices',
                'Field Practicum',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Agri-entrepreneurship and Innovation',
                'Food Policy and Security',
                'Capstone Agribusiness Project',
                'Internship or Industrial Placement',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Agriculture and Food Systems',
          award: 'Diploma',
          overview:
            'Provides practical skills in crop production, livestock management, and agribusiness operations for farming and food enterprises.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,200,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Agriculture',
                'Crop Production and Management',
                'Livestock Production Basics',
                'Agricultural Communication',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Farm Management and Agribusiness',
                'Sustainable Practices',
                'Field Practicum and Project',
                'Agricultural Marketing',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Agriculture and Food Security',
          award: 'Certificate',
          overview:
            'Introduces basic agricultural techniques, food security principles, and sustainable farming methods for community leaders and assistants.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Fundamentals of Crop Production',
                'Livestock and Poultry Basics',
                'Soil and Water Management',
                'Food Security Awareness',
                'Community Agricultural Projects',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-engineering-and-applied-technologies',
    title: 'School of Engineering and Applied Technologies',
    overview:
      'Provides comprehensive education in engineering disciplines, applied technology, and innovation-driven problem solving with hands-on laboratory and industrial experience.',
    departments: [
      'Department of Civil and Structural Engineering',
      'Department of Mechanical and Industrial Engineering',
      'Department of Electrical and Electronics Engineering',
      'Department of Applied Technology and Innovation',
    ],
    featuredDepartment: {
      name: 'Department of Civil and Structural Engineering',
      programs: [
        {
          title: 'Bachelor of Engineering in Civil Engineering',
          award: 'BEng Civil',
          overview:
            'Trains students to design, construct, and manage infrastructure projects with emphasis on sustainable construction and African infrastructure needs.',
          admissions: [
            'Uganda Advanced Certificate of Education with principal passes in Mathematics, Physics, and Chemistry',
            'Diploma in civil or structural engineering for advanced entry',
            'Mature applicants aged 25+ with relevant experience',
            'Equivalent international secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 4,000,000 per year',
            'Regional students: USD 1,600 per year',
            'International students: USD 2,800 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Engineering Mathematics',
                'Physics for Engineers',
                'Introduction to Civil Engineering',
                'Technical Drawing and CAD',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Structural Analysis',
                'Surveying and Geomatics',
                'Fluid Mechanics',
                'Materials Science',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Construction Management',
                'Hydraulics and Water Engineering',
                'Environmental Engineering',
                'Applied Structural Design',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Bridge and Building Design',
                'Project Management and Safety',
                'Capstone Civil Engineering Project',
                'Industrial Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Civil Engineering',
          award: 'Diploma',
          overview:
            'Practical training in construction techniques, project management, and structural design for junior engineering roles.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,400,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Engineering Fundamentals',
                'Construction Materials',
                'Surveying Techniques',
                'Technical Drawing',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Structural Design Basics',
                'Project Planning and Management',
                'Field Practicum',
                'Safety and Ethics in Engineering',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Engineering Technology',
          award: 'Certificate',
          overview:
            'Foundational knowledge in engineering principles, technical problem-solving, and applied workshop practice.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Introduction to Engineering',
                'Technical Drawing and CAD',
                'Basic Materials Science',
                'Applied Workshop Practice',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'college-of-social-sciences-and-public-policy',
    title: 'College of Social Sciences and Public Policy',
    overview:
      'Focuses on understanding societal structures, governance, policy-making, and social development with strong research and field study components.',
    departments: [
      'Department of Political Science and Governance',
      'Department of Sociology and Anthropology',
      'Department of Public Policy and Administration',
      'Department of Social Research and Development Studies',
    ],
    featuredDepartment: {
      name: 'Department of Public Policy and Administration',
      programs: [
        {
          title: 'Bachelor of Public Policy and Administration',
          award: 'BPPA',
          overview:
            'Equips students with knowledge and skills to design, implement, and evaluate public policies with emphasis on ethical decision-making and Pan-African perspectives.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Diploma in social sciences, public administration, or related field for advanced entry',
            'Mature applicants aged 25+ with relevant experience',
            'Equivalent international secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,400,000 per year',
            'Regional students: USD 1,400 per year',
            'International students: USD 2,500 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Public Policy',
                'Foundations of Governance',
                'Research Methods in Social Sciences',
                'Ethics and Social Responsibility',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Policy Analysis and Evaluation',
                'Public Finance and Budgeting',
                'Comparative Governance Systems',
                'Quantitative and Qualitative Research Methods',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Social Policy and Development',
                'Leadership and Strategic Management',
                'Policy Communication and Advocacy',
                'Field Research or Internship',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Policy Implementation and Monitoring',
                'Global Public Policy Perspectives',
                'Capstone Policy Project',
                'Professional Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Public Policy',
          award: 'Diploma',
          overview:
            'Trains students in policy development, governance, and administrative skills for mid-level roles in government and social organizations.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,200,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Governance and Policy',
                'Research and Analytical Skills',
                'Administrative Processes',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Policy Formulation and Evaluation',
                'Community Engagement Projects',
                'Practical Internship',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Social Policy and Governance',
          award: 'Certificate',
          overview:
            'Introduces foundational concepts in social sciences, governance, and public policy for community leaders and NGO staff.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Foundations of Governance',
                'Introduction to Public Policy',
                'Social Research Basics',
                'Community Policy Projects',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-creative-arts-music-and-media',
    title: 'School of Creative Arts, Music, and Media',
    overview:
      'Cultivates artistic talent, cultural expression, and media innovation with focus on African cultural heritage and contemporary creative industries.',
    departments: [
      'Department of Visual Arts and Design',
      'Department of Music and Performing Arts',
      'Department of Film, Media, and Digital Production',
      'Department of Cultural Heritage and Creative Innovation',
    ],
    featuredDepartment: {
      name: 'Department of Film, Media, and Digital Production',
      programs: [
        {
          title: 'Bachelor of Arts in Media and Communication',
          award: 'BA Media and Communication',
          overview:
            'Develops skills in journalism, film production, digital media, broadcasting, and storytelling with strong media ethics and production techniques.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Diploma in media, communication, or related field for advanced entry',
            'Mature applicants aged 25+ with relevant experience',
            'International equivalent secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,200,000 per year',
            'Regional students: USD 1,300 per year',
            'International students: USD 2,400 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Media Studies',
                'Visual Communication Fundamentals',
                'Digital Literacy and Multimedia',
                'African Culture and Communication',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Journalism and Reporting',
                'Audio and Video Production',
                'Media Ethics and Law',
                'Creative Writing and Storytelling',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Film Production and Directing',
                'Broadcasting Techniques',
                'Digital Media Design',
                'Internship or Practical Production',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Advanced Media Projects',
                'Documentary and Feature Film Production',
                'Capstone Media Project',
                'Industry Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Media Production',
          award: 'Diploma',
          overview:
            'Provides practical skills in journalism, broadcasting, and digital media creation for entry-level media roles.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,000,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Media and Communication',
                'Audio-Visual Production Basics',
                'Journalism Fundamentals',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Digital Media Editing',
                'Film and Documentary Techniques',
                'Internship or Media Practicum',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Creative Media',
          award: 'Certificate',
          overview:
            'Introduces media production, storytelling, and digital content creation for community media workers and aspiring content creators.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Media Basics and Communication',
                'Digital Storytelling',
                'Photography and Video Production',
                'Community Media Project',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-mathematics-data-science-and-ai',
    title: 'School of Mathematics, Data Science, and AI',
    overview:
      'Equips students with quantitative, analytical, and computational skills for careers in science, technology, finance, and artificial intelligence.',
    departments: [
      'Department of Pure and Applied Mathematics',
      'Department of Statistics and Data Analytics',
      'Department of Artificial Intelligence and Machine Learning',
      'Department of Computational Science and Modeling',
    ],
    featuredDepartment: {
      name: 'Department of Artificial Intelligence and Machine Learning',
      programs: [
        {
          title: 'Bachelor of Science in Artificial Intelligence',
          award: 'BSc AI',
          overview:
            'Trains students in machine learning, neural networks, natural language processing, and robotics with practical applications across industries.',
          admissions: [
            'Uganda Advanced Certificate of Education with passes in Mathematics and Physics/Computer Science',
            'Diploma in computer science, mathematics, or related field for advanced entry',
            'Mature applicants aged 25+ with relevant qualifications',
            'International equivalent secondary education',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,800,000 per year',
            'Regional students: USD 1,500 per year',
            'International students: USD 2,700 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Computer Science',
                'Calculus and Linear Algebra',
                'Programming Fundamentals (Python, Java)',
                'Introduction to AI and Ethics',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Data Structures and Algorithms',
                'Probability and Statistics for AI',
                'Machine Learning I',
                'Database Systems',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Deep Learning and Neural Networks',
                'Natural Language Processing',
                'Computer Vision',
                'AI Ethics and Policy',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'AI Project Design and Implementation',
                'Robotics and Intelligent Systems',
                'Capstone AI Project',
                'Industrial Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Data Science and AI',
          award: 'Diploma',
          overview:
            'Provides practical skills in data analysis, statistical modeling, and basic AI applications for industry and research roles.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,400,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Data Science',
                'Programming for Data Analytics',
                'Statistics and Probability',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Machine Learning Basics',
                'Data Visualization and Reporting',
                'Data Science Internship or Project',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Mathematics and Data Analytics',
          award: 'Certificate',
          overview:
            'Introduces fundamental mathematics, statistics, and basic data analysis techniques for students and professionals.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Foundations of Mathematics',
                'Introduction to Statistics',
                'Basic Data Analysis Techniques',
                'Applied Projects in Data Analytics',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-psychology-behavioral-and-cognitive-sciences',
    title: 'School of Psychology, Behavioral, and Cognitive Sciences',
    overview:
      'Focuses on understanding human behavior, mental processes, and cognitive development with applied research and therapeutic practice.',
    departments: [
      'Department of Clinical and Counseling Psychology',
      'Department of Cognitive and Behavioral Sciences',
      'Department of Organizational and Industrial Psychology',
      'Department of Neuroscience and Mental Health Research',
    ],
    featuredDepartment: {
      name: 'Department of Clinical and Counseling Psychology',
      programs: [
        {
          title: 'Bachelor of Science in Psychology',
          award: 'BSc Psychology',
          overview:
            'Provides comprehensive training in human behavior, mental health, and therapeutic interventions with practical exposure in clinics and community programs.',
          admissions: [
            'Uganda Advanced Certificate of Education with passes in Biology and any social science',
            'Diploma in psychology, social work, or related field for advanced entry',
            'Mature applicants aged 25+ with relevant experience',
            'Equivalent international secondary education',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,200,000 per year',
            'Regional students: USD 1,300 per year',
            'International students: USD 2,400 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Psychology',
                'Developmental and Social Psychology',
                'Research Methods I',
                'Biopsychology',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Cognitive Psychology',
                'Abnormal Psychology',
                'Statistics for Behavioral Sciences',
                'Counseling Fundamentals',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Clinical Assessment and Intervention',
                'Behavioral Therapy Techniques',
                'Organizational Psychology Basics',
                'Field Practicum or Internship',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Advanced Cognitive Psychology',
                'Mental Health Policy and Ethics',
                'Capstone Research Project',
                'Clinical Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Counseling and Behavioral Studies',
          award: 'Diploma',
          overview:
            'Provides practical training in counseling, behavioral assessment, and basic psychological interventions for entry-level roles.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,000,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Counseling',
                'Human Development and Behavior',
                'Basic Psychological Assessment',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Behavioral Intervention Techniques',
                'Community Mental Health Projects',
                'Practicum or Internship',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Psychology and Mental Health',
          award: 'Certificate',
          overview:
            'Introduces basic concepts of psychology, mental health awareness, and behavioral strategies for community workers and educators.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Foundations of Psychology',
                'Introduction to Mental Health',
                'Behavioral Observation and Reporting',
                'Community Mental Health Awareness',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-tourism-hospitality-and-cultural-heritage',
    title: 'School of Tourism, Hospitality, and Cultural Heritage',
    overview:
      'Trains students in tourism management, hospitality services, cultural preservation, and heritage development with experiential learning and industry internships.',
    departments: [
      'Department of Tourism and Travel Management',
      'Department of Hospitality and Hotel Administration',
      'Department of Cultural Heritage and Museum Studies',
      'Department of Event Management and Cultural Innovation',
    ],
    featuredDepartment: {
      name: 'Department of Tourism and Travel Management',
      programs: [
        {
          title: 'Bachelor of Science in Tourism and Hospitality Management',
          award: 'BSc Tourism and Hospitality',
          overview:
            'Equips students with management skills, cultural understanding, and operational knowledge to run tourism and hospitality enterprises.',
          admissions: [
            'Uganda Advanced Certificate of Education with passes in any two subjects',
            'Diploma in tourism, hospitality, or related field for advanced entry',
            'Mature applicants aged 25+ with relevant work experience',
            'International equivalent secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,000,000 per year',
            'Regional students: USD 1,200 per year',
            'International students: USD 2,200 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Tourism',
                'Principles of Hospitality Management',
                'African Cultural Studies',
                'Business Communication',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Tourism Marketing and Promotion',
                'Event Planning and Management',
                'Customer Service and Guest Relations',
                'Sustainable Tourism Practices',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Hospitality Operations and Management',
                'Tour Planning and Travel Agency Management',
                'Heritage Site Management',
                'Field Practicum or Internship',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Tourism Policy and Development',
                'Entrepreneurship in Hospitality',
                'Capstone Tourism Project',
                'Industrial Internship',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Tourism and Hospitality',
          award: 'Diploma',
          overview:
            'Provides practical skills in tourism operations, hotel management, and event planning for employment in hospitality industries.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,000,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Tourism and Hospitality',
                'Customer Service and Guest Relations',
                'Event Management Basics',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Hotel Operations and Management',
                'Tour Planning and Marketing',
                'Field Practicum or Internship',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Cultural Heritage and Tourism',
          award: 'Certificate',
          overview:
            'Introduces heritage preservation, tourism awareness, and basic hospitality skills for cultural site attendants and community guides.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Foundations of Cultural Heritage',
                'Introduction to Tourism',
                'Hospitality and Customer Care Basics',
                'Community Heritage Projects',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-space-astronomy-and-earth-sciences',
    title: 'School of Space, Astronomy, and Earth Sciences',
    overview:
      'Provides advanced education and research opportunities in astronomy, space exploration, geosciences, and planetary studies with hands-on observatory and field experience.',
    departments: [
      'Department of Astronomy and Astrophysics',
      'Department of Earth and Planetary Sciences',
      'Department of Space Engineering and Satellite Technology',
      'Department of Environmental and Earth Systems Analysis',
    ],
    featuredDepartment: {
      name: 'Department of Astronomy and Astrophysics',
      programs: [
        {
          title: 'Bachelor of Science in Astronomy and Astrophysics',
          award: 'BSc Astronomy and Astrophysics',
          overview:
            'Trains students to study celestial objects and astrophysical processes using observational techniques, data modeling, and research methodology.',
          admissions: [
            'Uganda Advanced Certificate of Education with passes in Physics and Mathematics',
            'Diploma in physical sciences, engineering, or related field for advanced entry',
            'Mature applicants aged 25+ with relevant experience',
            'International equivalent secondary qualifications',
          ],
          duration: '4 years (8 semesters)',
          tuition: [
            'Domestic students: UGX 3,800,000 per year',
            'Regional students: USD 1,500 per year',
            'International students: USD 2,700 per year',
          ],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Astronomy',
                'Mathematics for Physical Sciences',
                'Physics I and II',
                'Computational Methods',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Observational Techniques and Instrumentation',
                'Astrophysics I: Stars and Galaxies',
                'Planetary Science',
                'Data Analysis and Simulation',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Cosmology and Space Phenomena',
                'Astrophysics II: Stellar and Galactic Evolution',
                'Satellite and Telescope Technology',
                'Research Methods in Astronomy',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Advanced Astrophysics',
                'Capstone Research Project',
                'Internship in Observatories or Space Agencies',
                'Scientific Communication and Outreach',
              ],
            },
          ],
        },
        {
          title: 'Diploma in Space and Earth Sciences',
          award: 'Diploma',
          overview:
            'Provides practical knowledge in astronomy, geosciences, and observational methods for support roles in observatories and research labs.',
          admissions: ['Uganda Certificate of Education or equivalent secondary education'],
          duration: '2 years',
          tuition: ['UGX 2,400,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Introduction to Astronomy',
                'Earth Science Fundamentals',
                'Physics and Mathematics for Observations',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Observational Methods and Data Analysis',
                'Field and Laboratory Practicum',
                'Project Work',
              ],
            },
          ],
        },
        {
          title: 'Certificate in Astronomy and Earth Science',
          award: 'Certificate',
          overview:
            'Foundational knowledge in astronomy, space awareness, and earth sciences for community educators and school instructors.',
          admissions: ['Completion of secondary education'],
          duration: '1 year',
          tuition: ['UGX 1,200,000'],
          outline: [
            {
              title: 'Core Courses',
              items: [
                'Basics of Astronomy and Space Science',
                'Introduction to Earth Systems',
                'Observational Techniques and Projects',
                'Community Outreach in Space and Earth Sciences',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'graduate-school',
    title: 'Graduate School',
    overview:
      'Graduate School offers master’s and doctoral training anchored in interdisciplinary research and Pan-African leadership. Designed for professionals and scholars moving to advanced research and innovation.',
    departments: [
      'Department of Postgraduate Studies',
      'Department of Research Methods and Policy',
      'Department of Graduate Professional Practice',
    ],
    featuredDepartment: {
      name: 'Graduate School',
      programs: [
        {
          title: 'Master of Arts in Development Studies',
          award: 'MA',
          overview:
            'Focuses on development policy, social change, and evidence-based program design for public and non-profit sectors.',
          admissions: [
            'Bachelor degree with a minimum 2.7 GPA',
            'Academic references and personal statement',
            'Proof of English proficiency for international applicants',
          ],
          duration: '2 years',
          tuition: ['UGX 4,000,000 per year', 'International: USD 2,000 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Research Methods for Development',
                'Policy Analysis and Program Design',
                'Governance and Public Management',
                'Field Research Seminar',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Advanced Development Theory',
                'Strategic Leadership',
                'Capstone Research Project',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'school-of-education',
    title: 'School of Education',
    overview:
      'School of Education prepares teacher-leaders, curriculum specialists, and education researchers with classroom practice, pedagogy, and inclusive learning design.',
    departments: [
      'Department of Curriculum and Instruction',
      'Department of Educational Leadership',
      'Department of Early Childhood and Special Needs Education',
    ],
    featuredDepartment: {
      name: 'Department of Curriculum and Instruction',
      programs: [
        {
          title: 'Bachelor of Education',
          award: 'BEd',
          overview:
            'A comprehensive teacher education program equipping graduates for secondary school teaching, curriculum development, and assessment literacy.',
          admissions: [
            'Uganda Advanced Certificate of Education with at least two principal passes',
            'Mature entry with relevant teaching experience',
            'International equivalent education qualification',
          ],
          duration: '4 years',
          tuition: ['UGX 3,000,000 per year', 'International: USD 1,800 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Foundations of Education',
                'Child Development and Learning',
                'Communication Skills for Teachers',
                'Education and Society',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Curriculum Design and Assessment',
                'Classroom Management',
                'Instructional Technology',
                'School Practicum I',
              ],
            },
            {
              title: 'Year 3',
              items: [
                'Educational Research Methods',
                'Inclusive Education',
                'School Leadership',
                'School Practicum II',
              ],
            },
            {
              title: 'Year 4',
              items: [
                'Educational Policy and Planning',
                'Professional Portfolio',
                'Teaching Internship',
                'Capstone Project',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'institute-of-public-health-and-health-sciences',
    title: 'Institute of Public Health & Health Sciences',
    overview:
      'Institute of Public Health and Health Sciences develops public health leaders, epidemiologists, and community health practitioners through applied research and practice.',
    departments: [
      'Department of Public Health',
      'Department of Epidemiology and Biostatistics',
      'Department of Health Systems and Policy',
    ],
    featuredDepartment: {
      name: 'Department of Public Health',
      programs: [
        {
          title: 'Master of Public Health',
          award: 'MPH',
          overview:
            'A professional program strengthening capacity in disease control, health systems management, and community-based public health interventions.',
          admissions: [
            'Bachelor degree in health sciences or related field',
            'Official transcripts and professional references',
            'Personal statement of public health goals',
          ],
          duration: '2 years',
          tuition: ['UGX 4,500,000 per year', 'International: USD 2,500 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'Foundations of Public Health',
                'Epidemiology',
                'Biostatistics',
                'Health Promotion and Behaviour Change',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Health Systems Strengthening',
                'Research Methods and Ethics',
                'Field Practicum',
                'Capstone Applied Project',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    slug: 'institute-of-african-culture-science-and-technology-iacst',
    title: 'Institute of African Culture, Science and Technology (IACST)',
    overview:
      'IACST bridges African traditional knowledge, science, and technology with applied research for cultural innovation and sustainable development.',
    departments: [
      'Department of Indigenous Knowledge Systems',
      'Department of Science, Technology, and Society',
      'Department of Cultural Innovation',
    ],
    featuredDepartment: {
      name: 'Department of Cultural Innovation',
      programs: [
        {
          title: 'Master of Science in African Cultural Innovation',
          award: 'MSc',
          overview:
            'Focuses on applied cultural sciences, innovation policy, and community-centered technology solutions derived from African knowledge systems.',
          admissions: [
            'Bachelor degree in social sciences, natural sciences, or engineering',
            'Statement of purpose and research interest',
            'Two academic/ professional references',
          ],
          duration: '2 years',
          tuition: ['UGX 4,200,000 per year', 'International: USD 2,300 per year'],
          outline: [
            {
              title: 'Year 1',
              items: [
                'African Science and Technology Systems',
                'Indigenous Knowledge and Innovation',
                'Sustainable Community Technologies',
                'Research Methods in Cultural Innovation',
              ],
            },
            {
              title: 'Year 2',
              items: [
                'Innovation Policy and Governance',
                'Applied Cultural Technology Lab',
                'Industrial Partnership Project',
                'Thesis or Capstone Project',
              ],
            },
          ],
        },
      ],
    },
  },
];
