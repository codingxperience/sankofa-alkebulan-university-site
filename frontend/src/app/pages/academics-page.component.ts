import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../directives/reveal.directive';

@Component({
  selector: 'app-academics-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './academics-page.component.html',
  styleUrl: './academics-page.component.scss',
})
export class AcademicsPageComponent {
  readonly heroChips = [
    { icon: 'fa-graduation-cap', label: 'Undergraduate' },
    { icon: 'fa-user-graduate', label: 'Postgraduate' },
    { icon: 'fa-flask', label: 'Doctoral' },
    { icon: 'fa-laptop', label: 'Online' },
  ];

  readonly quickProgrammes = [
    { b: 'BA — African Civilizational Studies', s: '4 years — UG — September 2026', route: null },
    { b: 'MA — Pan-African Studies', s: '2 years — PG — September 2026', route: '/programmes/ma-pan-african-studies' },
    { b: 'PhD — Indigenous Knowledge Systems', s: '4 years — Funded — September 2026', route: null },
    { b: 'BSc — Computing & Data for Africa', s: '4 years — UG — September 2026', route: null },
  ];

  readonly anchorQuestions = [
    'What does it mean to do African philosophy today?',
    'How do we read pre-colonial governance systems?',
    'What is the future of African languages in scholarship?',
    'How is heritage curated, contested, and renewed?',
    'What can ancient civilizations teach modern policy?',
    'How do we publish African thought, in African hands?',
  ];

  readonly featureProgrammes = [
    { b: 'BA — African Civilizational Studies', s: '4 yrs — UG', route: null },
    { b: 'MA — Pan-African Studies', s: '2 yrs — PG', route: '/programmes/ma-pan-african-studies' },
    { b: 'MA — African Political Thought', s: '2 yrs — PG', route: null },
    { b: 'PhD — Indigenous Knowledge Systems', s: '4 yrs — Funded', route: null },
    { b: 'Diploma — African Languages', s: '1 yr — Online', route: null },
  ];

  readonly colleges = [
    {
      num: '01',
      feature: true,
      b: 'College of African Civilizational Studies',
      p: 'Civilization, heritage, languages, philosophy, and the visual arts read together as one tradition.',
      icon: 'fa-landmark',
      tags: '5 schools — UG — PG — PhD',
    },
    {
      num: '02',
      feature: false,
      b: 'College of Science, Technology & Innovation',
      p: 'Computing, climate, biotech, and applied engineering for continental priorities.',
      icon: 'fa-microscope',
      tags: '5 schools — UG — PG — PhD',
    },
    {
      num: '03',
      feature: false,
      b: 'College of Governance, Law & Public Policy',
      p: 'Constitutional studies, public administration, and ethics for a continent in transition.',
      icon: 'fa-scale-balanced',
      tags: '3 schools — UG — PG',
    },
    {
      num: '04',
      feature: false,
      b: 'College of Health, Wellbeing & Society',
      p: 'Medicine, public health, and indigenous health systems for African and diasporic communities.',
      icon: 'fa-heart-pulse',
      tags: '4 schools — UG — PG — MD',
    },
    {
      num: '05',
      feature: false,
      b: 'College of Business, Enterprise & Economics',
      p: 'African economies, finance, and entrepreneurship rooted in continental practice.',
      icon: 'fa-chart-line',
      tags: '3 schools — UG — PG — MBA',
    },
    {
      num: '06',
      feature: false,
      b: 'College of Education & Teacher Development',
      p: 'Pedagogy, curriculum design, and educational leadership across formal and informal systems.',
      icon: 'fa-people-roof',
      tags: '2 schools — UG — PG',
    },
  ];

  readonly pathways = [
    {
      icon: 'fa-graduation-cap',
      b: 'Undergraduate',
      p: "Three- and four-year bachelor's degrees across all six colleges. Open to school leavers and mature candidates.",
      meta: ['Duration — 3–4 years', 'Modality — On-campus, hybrid', 'Domestic — UGX 3.2 M / yr', 'International — USD 2,200 / yr'],
      cta: 'Explore undergraduate programmes',
    },
    {
      icon: 'fa-user-graduate',
      b: 'Postgraduate',
      p: "One- to two-year MA, MSc, and professional master's degrees and postgraduate diplomas.",
      meta: ['Duration — 1–2 years', 'Modality — On-campus, hybrid', 'Domestic — UGX 4.8 M / yr', 'International — USD 3,200 / yr'],
      cta: 'Explore postgraduate programmes',
    },
    {
      icon: 'fa-flask',
      b: 'Doctoral',
      p: 'Funded PhD positions across institutes and schools. Cohort-based with continental supervision teams.',
      meta: ['Duration — 3–4 years', 'Modality — On-campus, residencies', 'Funding — Full stipend + tuition', 'Next intake — September 2026'],
      cta: 'Explore doctoral programmes',
    },
    {
      icon: 'fa-laptop',
      b: 'Online & short courses',
      p: 'Stackable digital learning across African languages, computing for Africa, public policy, and creative practice.',
      meta: ['Duration — 4 weeks — 1 year', 'Modality — Fully online', 'Tuition — USD 80 — 480 per course', 'Aid — Need-based available'],
      cta: 'Explore online learning',
    },
  ];

  readonly categories = [
    { icon: 'fa-landmark', label: 'Civilizational studies', selected: true },
    { icon: 'fa-microscope', label: 'Science & innovation', selected: false },
    { icon: 'fa-scale-balanced', label: 'Governance & law', selected: false },
    { icon: 'fa-heart-pulse', label: 'Health & society', selected: false },
    { icon: 'fa-chart-line', label: 'Economics & enterprise', selected: false },
    { icon: 'fa-leaf', label: 'Agriculture & climate', selected: false },
    { icon: 'fa-book-open', label: 'Humanities', selected: false },
    { icon: 'fa-laptop-code', label: 'Computing & data', selected: false },
    { icon: 'fa-people-roof', label: 'Education', selected: false },
    { icon: 'fa-globe-africa', label: 'Pan-African studies', selected: false },
    { icon: 'fa-palette', label: 'Creative arts', selected: false },
  ];

  readonly institutes = [
    {
      icon: 'fa-globe-africa',
      h: 'Institute of Pan-African Studies',
      p: 'Diaspora studies, continental political thought, and public-scholarship publishing.',
      meta: '12 active projects — 4 fellows',
    },
    {
      icon: 'fa-seedling',
      h: 'Institute of Indigenous Knowledge Systems',
      p: 'Methods, ethics, and stewardship of African indigenous knowledge in research practice.',
      meta: '8 active projects — 6 fellows',
    },
    {
      icon: 'fa-temperature-low',
      h: 'Institute of Climate & African Futures',
      p: "Climate science, adaptation policy, and just transitions across the continent's regions.",
      meta: '7 active projects — 5 fellows',
    },
    {
      icon: 'fa-microchip',
      h: 'Institute for AI in Africa',
      p: 'African-language NLP, public-sector AI ethics, and applied data work for civic institutions.',
      meta: '9 active projects — 7 fellows',
    },
  ];

  readonly standards = [
    'Outcome-based curriculum frameworks across all programmes',
    'External examiners drawn from continental and global universities',
    'Public regulations on appeals, plagiarism, and academic integrity',
    'Annual quality-assurance audits, published in full',
  ];
}
