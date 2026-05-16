import { ACADEMIC_RESEARCH_INSTITUTES, ACADEMIC_RESEARCH_INSTITUTES_BY_COLLEGE_ID, ACADEMIC_SCHOOL_STRUCTURE_BY_COLLEGE_ID, type AcademicArchitectureSchool } from './academic-departments';

export interface AcademicArchitectureCollegeBase {
  readonly id: number;
  readonly name: string;
  readonly schools: readonly string[];
  readonly programmes: readonly string[];
  readonly researchAlignment: string;
  readonly centresOfExcellence?: readonly string[];
  readonly laboratories?: readonly string[];
  readonly observatories?: readonly string[];
  readonly clinics?: readonly string[];
  readonly archives?: readonly string[];
  readonly missions?: readonly string[];
  readonly specializedUnits?: readonly string[];
}

const ACADEMIC_ARCHITECTURE_COLLEGE_BASE: readonly AcademicArchitectureCollegeBase[] = [
  { id: 1, name: 'College of Mathematical Sciences', schools: ['School of Pure Mathematics', 'School of Applied Mathematics', 'School of Mathematical Modelling & Simulation', 'School of Computational Mathematics'], programmes: ['BSc Pure Mathematics', 'BSc Applied Mathematics', 'BSc Mathematical Modelling', 'MSc Mathematical Sciences', 'PhD Mathematical Sciences'], researchAlignment: 'Center for Artificial Intelligence and Robotics' },
  { id: 2, name: 'College of Physical Sciences', schools: ['School of Physics', 'School of Chemistry', 'School of Materials Physics', 'School of Theoretical & Experimental Sciences'], programmes: ['BSc Physics', 'BSc Chemistry', 'BSc Materials Physics', 'MSc Physical Sciences', 'PhD Physical Sciences'], researchAlignment: 'Center for Science, Technology and Innovation Policy' },
  { id: 3, name: 'College of Life Sciences & Biotechnology', schools: ['School of Biological Sciences', 'School of Biotechnology', 'School of Microbial Sciences', 'School of Genomics & Systems Biology'], programmes: ['BSc Biology', 'BSc Biotechnology', 'BSc Microbiology', 'BSc Genetics & Genomics', 'MSc Life Sciences', 'PhD Biological Systems'], researchAlignment: 'Pan-African Health and Biomedical Research Institute' },
  { id: 4, name: 'College of Earth Systems & Geosciences', schools: ['School of Earth Systems Science', 'School of Geology', 'School of Geophysics', 'School of Atmospheric & Climate Systems'], programmes: ['BSc Earth Systems Science', 'BSc Geology', 'BSc Geophysics', 'MSc Earth Systems', 'PhD Earth Systems Science'], researchAlignment: 'Institute for Space, Astronomy and Earth Observation' },
  { id: 5, name: 'College of Materials Science & Advanced Manufacturing', schools: ['School of Materials Science', 'School of Metallurgical Engineering', 'School of Advanced Manufacturing Systems', 'School of Industrial Materials & Processing'], programmes: ['BSc Materials Science', 'BSc Metallurgical Engineering', 'BSc Advanced Manufacturing Systems', 'MSc Materials Engineering', 'PhD Materials Science'], researchAlignment: 'Center for Renewable Energy and Smart Infrastructure' },
  { id: 6, name: 'College of African Agriculture & Food Systems', schools: ['School of Crop Sciences', 'School of Animal & Livestock Systems', 'School of Agroecology & Climate Systems', 'School of Food Systems & Sovereignty'], programmes: ['Diploma in Agricultural Production', 'BSc Agronomy & Food Systems', 'BSc Agroecology & Climate-Smart Agriculture', 'BSc Animal Science', 'MSc Agricultural Systems', 'PhD Food Sovereignty Systems'], researchAlignment: 'Institute for Water, Agriculture and Food Security Research' },
  { id: 7, name: 'College of Agribusiness & Food Value Chains', schools: ['School of Agribusiness Management', 'School of Agricultural Economics', 'School of Food Value Chains', 'School of Agro-Industrial Systems'], programmes: ['Diploma in Agribusiness', 'BSc Agribusiness Management', 'BSc Food Value Chain Systems', 'MSc Agro-Industrial Systems', 'PhD Agricultural Value Chains'], researchAlignment: 'Center for Entrepreneurship, Innovation and Economic Development' },
  { id: 8, name: 'College of Food Science & Nutrition Security', schools: ['School of Food Science & Technology', 'School of Nutrition & Dietetics', 'School of Food Processing & Safety', 'School of Nutrition Security Systems'], programmes: ['Diploma in Food Processing', 'BSc Food Science & Technology', 'BSc Nutrition & Dietetics', 'MSc Food Systems', 'PhD Food Science'], researchAlignment: 'Institute for Water, Agriculture and Food Security Research' },
  { id: 9, name: 'College of Industrial Hemp & Bio-Economy Systems', schools: ['School of Industrial Hemp Production', 'School of Hemp Biotechnology', 'School of Hemp Industrial Engineering', 'School of Bio-Economy Systems'], programmes: ['Diploma in Industrial Hemp Systems', 'BSc Industrial Hemp Systems', 'BSc Hemp Biotechnology', 'BSc Hemp Industrial Engineering & Materials', 'MSc Bio-Economy Systems', 'PhD Hemp Systems'], researchAlignment: 'Institute for Climate, Environment and Sustainability' },
  { id: 10, name: 'College of Health Sciences & Medicine', schools: ['School of Medicine', 'School of Nursing & Midwifery', 'School of Public Health', 'School of Clinical Sciences', 'School of Diagnostic & Imaging Sciences'], programmes: ['Diploma in Clinical Medicine', 'MBChB Medicine', 'BSc Nursing & Midwifery', 'BSc Public Health', 'BSc Clinical Medicine', 'BSc Radiography', 'MSc Health Systems', 'PhD Medical Sciences'], researchAlignment: 'Pan-African Health and Biomedical Research Institute' },
  { id: 11, name: 'College of Pharmaceutical & Clinical Sciences', schools: ['School of Pharmacy', 'School of Pharmaceutical Sciences', 'School of Pharmacology', 'School of Drug Development & Therapeutics'], programmes: ['Diploma in Pharmacy', 'BPharm Bachelor of Pharmacy', 'BSc Pharmaceutical Sciences', 'MSc Pharmacology', 'PhD Drug Development'], researchAlignment: 'Pan-African Health and Biomedical Research Institute' },
  { id: 12, name: 'College of Biomedical & Laboratory Sciences', schools: ['School of Biomedical Science', 'School of Medical Laboratory Science', 'School of Clinical Laboratory Systems', 'School of Biomedical Research'], programmes: ['Diploma in Laboratory Technology', 'BSc Biomedical Science', 'BSc Medical Laboratory Science', 'MSc Biomedical Systems', 'PhD Biomedical Research'], researchAlignment: 'Pan-African Health and Biomedical Research Institute' },
  { id: 13, name: 'College of Public Health Security & Epidemiology', schools: ['School of Epidemiology', 'School of Health Security', 'School of Disease Surveillance Systems', 'School of Global Health Systems'], programmes: ['Diploma in Public Health', 'BSc Epidemiology', 'BSc Health Security', 'MSc Epidemic Systems', 'PhD Global Health Security'], researchAlignment: 'Pan-African Health and Biomedical Research Institute' },
  { id: 14, name: 'College of Engineering & Infrastructure Systems', schools: ['School of Civil & Structural Engineering', 'School of Mechanical Engineering', 'School of Electrical & Electronic Engineering', 'School of Mechatronics & Integrated Systems'], programmes: ['Diploma in Engineering', 'BSc Civil Engineering', 'BSc Mechanical Engineering', 'BSc Electrical Engineering', 'BSc Mechatronics Engineering', 'MSc Engineering Systems', 'PhD Infrastructure Systems'], researchAlignment: 'Center for Renewable Energy and Smart Infrastructure' },
  { id: 15, name: 'College of Energy & Resource Systems', schools: ['School of Renewable Energy Engineering', 'School of Petroleum Engineering', 'School of Mining Engineering', 'School of Resource Systems & Policy'], programmes: ['Diploma in Energy Systems', 'BSc Renewable Energy Engineering', 'BSc Petroleum Engineering', 'BSc Mining Engineering', 'MSc Energy Systems', 'PhD Resource Systems'], researchAlignment: 'Center for Renewable Energy and Smart Infrastructure' },
  { id: 16, name: 'College of Water, Hydrology & Sanitation', schools: ['School of Hydrology', 'School of Water Resources Engineering', 'School of Sanitation & Public Health Engineering', 'School of Water Systems Management'], programmes: ['Diploma in Water Systems', 'BSc Hydrology', 'BSc Water Resources Engineering', 'MSc Water Systems', 'PhD Hydrological Systems'], researchAlignment: 'Institute for Water, Agriculture and Food Security Research' },
  { id: 17, name: 'College of Computing, AI & Digital Systems', schools: ['School of Computer Science', 'School of Software Engineering', 'School of Artificial Intelligence', 'School of Cybersecurity & Digital Forensics', 'School of Information Systems'], programmes: ['Diploma in Information Technology', 'BSc Computer Science', 'BSc Software Engineering', 'BSc Information Technology', 'BSc Artificial Intelligence', 'BSc Cybersecurity', 'MSc Digital Systems', 'PhD Computational Systems'], researchAlignment: 'Center for Artificial Intelligence and Robotics' },
  { id: 18, name: 'College of Robotics & Cyber-Physical Systems', schools: ['School of Robotics Engineering', 'School of Automation Systems', 'School of Embedded Systems', 'School of Intelligent Systems'], programmes: ['BSc Robotics Engineering', 'BSc Automation Systems', 'MSc Industry 4.0 Systems', 'PhD Intelligent Systems'], researchAlignment: 'Center for Artificial Intelligence and Robotics' },
  { id: 19, name: 'College of Digital Infrastructure & Telecommunications', schools: ['School of Telecommunications Engineering', 'School of Network Systems', 'School of Digital Infrastructure Systems', 'School of Communication Systems'], programmes: ['Diploma in Telecommunications', 'BSc Telecommunications Engineering', 'BSc Network Systems', 'MSc Digital Infrastructure', 'PhD Communication Systems'], researchAlignment: 'Digital Humanities and Knowledge Management Center' },
  { id: 20, name: 'College of Data Science & Quantitative Systems', schools: ['School of Statistics', 'School of Data Science', 'School of Actuarial Science', 'School of Quantitative Modelling'], programmes: ['BSc Statistics', 'BSc Data Science', 'BSc Actuarial Science', 'MSc Data Systems', 'PhD Quantitative Systems'], researchAlignment: 'Center for Artificial Intelligence and Robotics' },
  { id: 21, name: 'College of Finance, Banking & Digital Economy', schools: ['School of Finance', 'School of Banking Systems', 'School of Financial Technology (FinTech)', 'School of Digital Economy Systems'], programmes: ['Diploma in Banking', 'BSc Finance', 'BSc Banking Systems', 'MSc Financial Systems', 'PhD Financial Economics'], researchAlignment: 'Center for Entrepreneurship, Innovation and Economic Development' },
  { id: 22, name: 'College of Business & Management Systems', schools: ['School of Business Administration', 'School of Management Studies', 'School of Accounting', 'School of Organizational Systems'], programmes: ['Diploma in Business Administration', 'BBA Business Administration', 'BSc Management', 'BSc Accounting', 'MSc Business Systems', 'PhD Management Studies'], researchAlignment: 'Center for Entrepreneurship, Innovation and Economic Development' },
  { id: 23, name: 'College of Entrepreneurship & Startup Systems', schools: ['School of Entrepreneurship', 'School of Innovation Systems', 'School of Startup Development', 'School of Venture Systems'], programmes: ['BSc Entrepreneurship', 'BSc Innovation Systems', 'MSc Startup Systems', 'PhD Entrepreneurial Systems'], researchAlignment: 'Center for Entrepreneurship, Innovation and Economic Development' },
  { id: 24, name: 'College of Trade, Logistics & Supply Chains', schools: ['School of Logistics', 'School of Supply Chain Systems', 'School of International Trade', 'School of Trade Systems'], programmes: ['Diploma in Logistics', 'BSc Logistics', 'BSc Supply Chain Systems', 'BSc International Trade', 'MSc Trade Systems', 'PhD Logistics Systems'], researchAlignment: 'Center for Entrepreneurship, Innovation and Economic Development' },
  { id: 25, name: 'College of Law & Justice Systems', schools: ['School of Law', 'School of Legal Practice', 'School of Justice Systems', 'School of Correctional Systems'], programmes: ['Diploma in Legal Practice', 'LLB Law', 'MSc Legal Systems', 'PhD Law & Justice'], researchAlignment: 'Center for Social Justice and Human Rights' },
  { id: 26, name: 'College of Digital Law & Regulation', schools: ['School of Cyber Law', 'School of Technology Law', 'School of Digital Regulation', 'School of Digital Governance'], programmes: ['BSc Cyber Law', 'MSc Technology Law', 'PhD Digital Governance Law'], researchAlignment: 'Center for Social Justice and Human Rights' },
  { id: 27, name: 'College of Governance & Public Administration', schools: ['School of Public Administration', 'School of Public Policy', 'School of Governance Systems', 'School of Institutional Reform'], programmes: ['Diploma in Public Administration', 'BSc Public Administration', 'MSc Governance Systems', 'PhD Public Policy'], researchAlignment: 'African Governance and Policy Institute' },
  { id: 28, name: 'College of Diplomacy & International Relations', schools: ['School of International Relations', 'School of Diplomacy', 'School of Global Governance', 'School of Foreign Policy Systems'], programmes: ['BSc International Relations', 'MSc Diplomacy', 'PhD Global Relations'], researchAlignment: 'Center for Global Education and International Development' },
  { id: 29, name: 'College of Security, Peace & Strategic Studies', schools: ['School of Security Studies', 'School of Peace & Conflict Studies', 'School of Strategic Studies', 'School of Defence & Intelligence Systems'], programmes: ['BSc Security Studies', 'BSc Peace & Conflict Studies', 'MSc Security Systems', 'PhD Strategic Studies'], researchAlignment: 'Institute for Policy, Peace, and Conflict Resolution' },
  { id: 30, name: 'College of Education & Pedagogy', schools: ['School of Teacher Education', 'School of Curriculum & Instruction', 'School of Educational Leadership', 'School of Education Policy'], programmes: ['Diploma in Education', 'BEd Primary Education', 'BEd Secondary Education', 'BEd Early Childhood Education', 'BEd Curriculum & Pedagogy', 'MSc Education Systems', 'PhD Education Policy'], researchAlignment: 'Center for Global Education and International Development' },
  { id: 31, name: 'College of Humanities & Civilisation Studies', schools: ['School of History', 'School of Philosophy', 'School of Civilisation Studies', 'School of Cultural Systems'], programmes: ['BA History', 'BA Philosophy', 'MSc Humanities', 'PhD Civilisation Studies'], researchAlignment: 'Institute for Pan-African Studies' },
  { id: 32, name: 'College of Indigenous Knowledge Systems', schools: ['School of Indigenous Knowledge Systems', 'School of African Epistemology', 'School of Cultural Heritage Systems', 'School of Decolonial Studies'], programmes: ['BA Indigenous Knowledge Systems', 'MSc Indigenous Systems', 'PhD Epistemology Systems'], researchAlignment: 'Center for Indigenous Knowledge Systems' },
  { id: 33, name: 'College of Religion, Spirituality & Ethics', schools: ['School of Religion', 'School of Spiritual Systems', 'School of Ethics', 'School of Theology & Society'], programmes: ['BA Religion & Spiritual Systems', 'BA Ethics', 'MSc Ethics & Society', 'PhD Religion & Civilisation'], researchAlignment: 'African Theology and Spiritual Traditions Institute' },
  { id: 34, name: 'College of Languages & Translation Studies', schools: ['School of Linguistics', 'School of African Languages', 'School of Translation', 'School of Interpretation Studies'], programmes: ['BA Linguistics', 'BA African Languages', 'BA Translation Studies', 'MSc Language Systems', 'PhD Linguistic Systems'], researchAlignment: 'Digital Humanities and Knowledge Management Center' },
  { id: 35, name: 'College of Arts & Creative Industries', schools: ['School of Fine Arts', 'School of Music', 'School of Film & Media Arts', 'School of Creative Industries'], programmes: ['BA Fine Arts', 'BA Music', 'BA Film & Media', 'MSc Creative Industries', 'PhD Cultural Systems'], researchAlignment: 'Institute for Cultural Heritage, Arts and Media Studies' },
  { id: 36, name: 'College of Media & Communication Systems', schools: ['School of Journalism', 'School of Media Studies', 'School of Strategic Communication', 'School of Digital Media Systems'], programmes: ['BA Journalism', 'BA Media Studies', 'MSc Communication Systems', 'PhD Media Systems'], researchAlignment: 'Institute for Cultural Heritage, Arts and Media Studies' },
  { id: 37, name: 'College of Architecture & Built Environment', schools: ['School of Architecture', 'School of Quantity Surveying', 'School of Construction Management', 'School of Built Environment Systems'], programmes: ['BSc Architecture', 'BSc Quantity Surveying', 'BSc Construction Management', 'MSc Built Environment', 'PhD Urban Systems'], researchAlignment: 'Center for Renewable Energy and Smart Infrastructure' },
  { id: 38, name: 'College of Urban Futures & Smart Cities', schools: ['School of Urban Planning', 'School of Smart Cities Systems', 'School of Urban Innovation', 'School of Urban Governance'], programmes: ['BSc Urban Planning', 'BSc Smart Cities', 'MSc Urban Futures', 'PhD Urban Systems'], researchAlignment: 'Center for Renewable Energy and Smart Infrastructure' },
  { id: 39, name: 'College of Environmental Science & Ecology', schools: ['School of Environmental Science', 'School of Ecology', 'School of Environmental Management', 'School of Ecosystem Systems'], programmes: ['BSc Environmental Science', 'MSc Environmental Systems', 'PhD Environmental Science'], researchAlignment: 'Institute for Climate, Environment and Sustainability' },
  { id: 40, name: 'College of Climate Change & Sustainability', schools: ['School of Climate Science', 'School of Sustainability Systems', 'School of Climate Policy', 'School of Climate Governance'], programmes: ['BSc Climate Science', 'MSc Climate Systems', 'PhD Climate Governance'], researchAlignment: 'Institute for Climate, Environment and Sustainability' },
  { id: 41, name: 'College of Climate Economy & Carbon Systems', schools: ['School of Climate Economics', 'School of Environmental Finance', 'School of Carbon Markets', 'School of Green Economy Systems'], programmes: ['BSc Climate Economics', 'BSc Environmental Finance', 'MSc Green Economy Systems', 'PhD Climate Finance'], researchAlignment: 'Institute for Climate, Environment and Sustainability' },
  { id: 42, name: 'College of Transport & Mobility Systems', schools: ['School of Transport Engineering', 'School of Mobility Systems', 'School of Transport Planning', 'School of Transport Policy'], programmes: ['BSc Transport Engineering', 'MSc Transport Systems', 'PhD Transport Engineering'], researchAlignment: 'Center for Renewable Energy and Smart Infrastructure' },
  { id: 43, name: 'College of Maritime & Blue Economy', schools: ['School of Maritime Studies', 'School of Blue Economy Systems', 'School of Ocean Systems', 'School of Marine Resource Management'], programmes: ['BSc Maritime Studies', 'MSc Blue Economy Systems', 'PhD Ocean Systems'], researchAlignment: 'Institute for Water, Agriculture and Food Security Research' },
  { id: 44, name: 'College of Tourism, Hospitality & Cultural Economy', schools: ['School of Tourism Management', 'School of Hospitality Systems', 'School of Cultural Economy', 'School of Destination Management'], programmes: ['BSc Tourism Management', 'MSc Tourism Systems', 'PhD Tourism Development'], researchAlignment: 'Institute for Cultural Heritage, Arts and Media Studies' },
  { id: 45, name: 'College of Sports Science & Human Performance', schools: ['School of Sports Science', 'School of Human Performance', 'School of Exercise Physiology', 'School of Sports Management'], programmes: ['BSc Sports Science', 'MSc Sports Systems', 'PhD Performance Science'], researchAlignment: 'Center for Behavioral and Cognitive Sciences Research' },
  { id: 46, name: 'College of Psychology & Human Development', schools: ['School of Psychology', 'School of Counselling Psychology', 'School of Human Development', 'School of Behavioural Systems'], programmes: ['BSc Psychology', 'BSc Counselling Psychology', 'MSc Psychosocial Systems', 'PhD Behavioural Systems'], researchAlignment: 'Center for Behavioral and Cognitive Sciences Research' },
  { id: 47, name: 'College of Leadership & Human Capital Development', schools: ['School of Leadership Studies', 'School of Human Capital Systems', 'School of Organizational Leadership', 'School of Institutional Development'], programmes: ['BSc Leadership Studies', 'MSc Leadership Systems', 'PhD Institutional Leadership'], researchAlignment: 'African Governance and Policy Institute' },
  { id: 48, name: 'College of Space, Aerospace & Satellite Systems', schools: ['School of Aerospace Engineering', 'School of Space Systems', 'School of Satellite Systems', 'School of Remote Sensing Systems'], programmes: ['BSc Aerospace Engineering', 'MSc Space Systems', 'PhD Space Technology'], researchAlignment: 'Institute for Space, Astronomy and Earth Observation' },
  { id: 49, name: 'College of Futures, Foresight & Strategic Transformation', schools: ['School of Futures Studies', 'School of Strategic Foresight', 'School of Transformation Systems', 'School of Civilisational Futures'], programmes: ['BSc Futures Studies', 'MSc Futures Systems', 'PhD Civilisational Futures'], researchAlignment: 'Institute for Policy, Peace, and Conflict Resolution' },
  {
    id: 50,
    name: 'College of Divine Wisdom',
    schools: [
      'School of African Spirituality and Indigenous Wisdom Systems',
      'School of Comparative Theology and Sacred Civilisations',
      'School of Consciousness, Metaphysics and Human Potential',
      'School of Ethics, Moral Leadership and Civilisational Governance',
      'School of Sacred Arts, Symbolism and Spiritual Expression',
      'School of Peace, Healing and Transformative Studies',
      'School of Sacred Ecology and Planetary Harmony',
      'School of Mysticism, Meditation and Contemplative Sciences',
      'School of Spiritual Psychology and Human Development',
      'School of Prophetic Studies and Future Civilisations',
    ],
    programmes: [
      'Certificate in African Spirituality',
      'Certificate in Ubuntu and Human Unity',
      'Certificate in Meditation and Consciousness',
      'Certificate in Ethical Leadership',
      'Certificate in Sacred Ecology',
      'Certificate in Interfaith Dialogue',
      'Certificate in Spiritual Counselling',
      'Certificate in Peace and Reconciliation',
      'Certificate in Sacred Symbolism',
      'Certificate in Indigenous Wisdom Systems',
      'Diploma in Divine Wisdom Studies',
      'Diploma in African Sacred Knowledge Systems',
      'Diploma in Ethical Governance',
      'Diploma in Consciousness and Human Development',
      'Diploma in Sacred Arts and Symbolism',
      'Diploma in Peacebuilding and Spiritual Leadership',
      'Diploma in Spiritual Psychology',
      'Diploma in Indigenous Cosmology',
      'Bachelor of Divine Wisdom Studies',
      'Bachelor of African Spirituality and Indigenous Wisdom',
      'Bachelor of Comparative Theology',
      'Bachelor of Consciousness Studies',
      'Bachelor of Ethical Leadership and Governance',
      'Bachelor of Spiritual Psychology',
      'Bachelor of Sacred Arts and Symbolism',
      'Bachelor of Peace and Human Transformation',
      'Bachelor of Sacred Ecology and Sustainability',
      'Bachelor of Mysticism and Contemplative Sciences',
      'Bachelor of Civilisational Ethics and Human Futures',
      'Master of Divine Wisdom and Consciousness',
      'Master of African Sacred Knowledge Systems',
      'Master of Comparative Sacred Traditions',
      'Master of Ethics and Moral Governance',
      'Master of Consciousness and Human Potential',
      'Master of Sacred Ecology and Planetary Ethics',
      'Master of Spiritual Psychology',
      'Master of Peace and Transformative Leadership',
      'Master of Mysticism and Meditation Sciences',
      'Master of Civilisational Futures and Spiritual Governance',
      'PhD in Divine Wisdom Studies',
      'PhD in African Spiritual Civilisations',
      'PhD in Comparative Theology and Civilisational Ethics',
      'PhD in Consciousness and Metaphysical Systems',
      'PhD in Moral Leadership and Governance',
      'PhD in Sacred Ecology and Planetary Consciousness',
      'PhD in Spiritual Psychology and Human Transformation',
      'PhD in Mysticism and Contemplative Sciences',
      'PhD in Peace, Ethics and Civilisational Renewal',
      'PhD in Prophetic Futures and Human Civilisations',
    ],
    researchAlignment: 'Institute for African Sacred Civilisations',
    centresOfExcellence: [
      'Centre for Ubuntu and Human Unity Studies',
      'Centre for Interfaith Diplomacy and Peacebuilding',
      'Centre for Ancient African Wisdom Recovery',
      'Centre for Ethical Leadership and Moral Statecraft',
      'Centre for Meditation and Consciousness Excellence',
      'Centre for Sacred Music and Healing Frequencies',
      'Centre for Indigenous Ecological Harmony',
      'Centre for Spiritual Counselling and Human Restoration',
      'Centre for Civilisational Ethics and Human Futures',
      'Centre for Sacred Architecture and Symbolic Design',
    ],
    laboratories: [
      'Consciousness Research Laboratory',
      'Sacred Sound and Frequency Laboratory',
      'Meditation and Neuro-Cognition Laboratory',
      'Spiritual Psychology Research Laboratory',
      'Human Consciousness Simulation Laboratory',
      'Sacred Ecology Systems Laboratory',
      'Ritual and Symbolic Systems Laboratory',
      'Psycho-Spiritual Behaviour Laboratory',
    ],
    observatories: [
      'Observatory for Civilisational Ethics and Human Futures',
      'Pan-African Spiritual Trends Observatory',
      'Observatory for Moral Governance and Leadership Integrity',
      'Global Consciousness and Human Behaviour Observatory',
      'Observatory for Peace and Social Harmony',
      'Indigenous Knowledge Systems Observatory',
    ],
    clinics: [
      'Spiritual Counselling Clinic',
      'Ethical Leadership Practice Clinic',
      'Community Peace and Reconciliation Clinic',
      'Psycho-Spiritual Wellness Clinic',
      'Human Transformation and Healing Clinic',
      'Meditation and Inner Wellness Clinic',
    ],
    archives: [
      'African Sacred Manuscripts Archive',
      'Pan-African Oral Traditions Archive',
      'Indigenous Wisdom Digital Archive',
      'Sacred Symbols and Ritual Systems Archive',
      'African Spiritual Heritage Preservation Archive',
      'Global Civilisational Wisdom Archive',
    ],
    missions: [
      'Pan-African Human Unity Mission',
      'Sacred Ecology Restoration Mission',
      'Ethical Leadership Transformation Mission',
      'Indigenous Wisdom Recovery Mission',
      'Community Peacebuilding and Reconciliation Mission',
      'Spiritual Literacy and Human Development Mission',
      'Continental Moral Regeneration Mission',
    ],
    specializedUnits: [
      'Sacred Knowledge Digital Repository',
      'Civilisational Futures Simulation Unit',
      'Pan-African Wisdom Translation Unit',
      'Divine Consciousness Innovation Hub',
      'Indigenous Sacred Languages Preservation Unit',
      'Spiritual Diplomacy and Global Harmony Unit',
      'Human Transformation Systems Unit',
      'Sacred Civilisation Documentation Unit',
      'Wisdom and Ethical AI Integration Unit',
      'Continental Spiritual Heritage Mapping Unit',
    ],
  },
] as const;

export interface AcademicArchitectureCollege extends AcademicArchitectureCollegeBase {
  readonly schoolStructure: readonly AcademicArchitectureSchool[];
  readonly researchInstitute: string;
}

export const ACADEMIC_ARCHITECTURE_COLLEGES: readonly AcademicArchitectureCollege[] =
  ACADEMIC_ARCHITECTURE_COLLEGE_BASE.map((college) => {
    const researchInstitute = ACADEMIC_RESEARCH_INSTITUTES_BY_COLLEGE_ID[college.id] ?? college.researchAlignment;

    return {
      ...college,
      schoolStructure:
        ACADEMIC_SCHOOL_STRUCTURE_BY_COLLEGE_ID[college.id] ??
        college.schools.map((school) => ({ name: school, departments: [] })),
      researchInstitute,
      researchAlignment: researchInstitute,
    };
  });

export const ACADEMIC_ARCHITECTURE_TOTALS = {
  colleges: ACADEMIC_ARCHITECTURE_COLLEGES.length,
  schools: ACADEMIC_ARCHITECTURE_COLLEGES.reduce((total, college) => total + college.schoolStructure.length, 0),
  departments: ACADEMIC_ARCHITECTURE_COLLEGES.reduce(
    (total, college) =>
      total + college.schoolStructure.reduce((schoolTotal, school) => schoolTotal + school.departments.length, 0),
    0,
  ),
  programmes: ACADEMIC_ARCHITECTURE_COLLEGES.reduce((total, college) => total + college.programmes.length, 0),
  researchInstitutes: ACADEMIC_RESEARCH_INSTITUTES.length,
} as const;
