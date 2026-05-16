import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../directives/reveal.directive';
import { ACADEMIC_ARCHITECTURE_COLLEGES, ACADEMIC_ARCHITECTURE_TOTALS } from '../university/academic-architecture';
import { ACADEMIC_RESEARCH_INSTITUTES } from '../university/academic-departments';

@Component({
  selector: 'app-academics-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './academics-page.component.html',
  styleUrl: './academics-page.component.scss',
})
export class AcademicsPageComponent {
  readonly totals = ACADEMIC_ARCHITECTURE_TOTALS;
  readonly featuredCollege = ACADEMIC_ARCHITECTURE_COLLEGES.find((college) => college.id === 50) ?? ACADEMIC_ARCHITECTURE_COLLEGES[0];

  readonly heroChips = [
    { icon: 'fa-building-columns', label: 'Colleges', route: '/academics/colleges' },
    { icon: 'fa-sitemap', label: 'Schools', route: '/academics/schools' },
    { icon: 'fa-layer-group', label: 'Departments', route: '/academics/departments' },
    { icon: 'fa-flask', label: 'Research institutes', route: '/academics/research-institutes' },
  ];

  readonly academicNav = [
    { icon: 'fa-building-columns', label: 'Colleges', route: '/academics/colleges' },
    { icon: 'fa-sitemap', label: 'Schools', route: '/academics/schools' },
    { icon: 'fa-layer-group', label: 'Departments', route: '/academics/departments' },
    { icon: 'fa-flask', label: 'Research', route: '/academics/research-institutes' },
  ];

  readonly quickProgrammes = [
    { b: 'Bachelor of Divine Wisdom Studies', s: 'Undergraduate - College of Divine Wisdom', route: '/programmes/bachelor-of-divine-wisdom-studies' },
    { b: 'MA - Pan-African Studies', s: 'Postgraduate - September 2026', route: '/programmes/ma-pan-african-studies' },
    { b: 'PhD - Indigenous Knowledge Systems', s: 'Doctoral - Epistemic systems', route: '/programmes/phd-indigenous-knowledge-systems' },
    { b: 'BSc - Artificial Intelligence', s: 'Undergraduate - Computing & digital systems', route: '/programmes/bsc-artificial-intelligence' },
  ];

  readonly anchorQuestions = [
    'How do colleges organise serious African and global knowledge without flattening it?',
    'Where do schools, departments, programmes, and institutes meet in the academic journey?',
    'How does a student move from field of interest to recognised professional identity?',
    'Which research institute carries each programme into public scholarship and innovation?',
    'How do indigenous, scientific, technological, civic, and sacred knowledge systems coexist?',
    'What is the clearest route from admission to study, research, publication, and service?',
  ];

  readonly featureProgrammes = this.featuredCollege.programmes.slice(0, 7).map((programme) => ({
    b: programme,
    s: this.programmePathway(programme),
    route: ['/programmes', this.slugify(programme)],
  }));

  readonly architectureLanes = [
    {
      num: '01',
      feature: true,
      b: 'Colleges',
      p: 'The highest academic homes. Each college gathers schools, programmes, research alignment, and professional direction.',
      icon: 'fa-building-columns',
      tags: `${this.totals.colleges} colleges`,
      route: '/academics/colleges',
    },
    {
      num: '02',
      feature: false,
      b: 'Schools',
      p: 'The method layer. Schools group related disciplines and show how broad fields become teachable academic systems.',
      icon: 'fa-sitemap',
      tags: `${this.totals.schools} schools`,
      route: '/academics/schools',
    },
    {
      num: '03',
      feature: false,
      b: 'Departments',
      p: 'The delivery layer. Departments hold curriculum ownership, teaching focus, and research responsibilities.',
      icon: 'fa-layer-group',
      tags: `${this.totals.departments} departments`,
      route: '/academics/departments',
    },
    {
      num: '04',
      feature: false,
      b: 'Programmes',
      p: 'The award layer. Certificates, diplomas, bachelor degrees, master degrees, and doctoral pathways are kept separate from the overview.',
      icon: 'fa-graduation-cap',
      tags: `${this.totals.programmes} programmes`,
      route: '/programmes',
    },
    {
      num: '05',
      feature: false,
      b: 'Research Institutes',
      p: 'The advanced knowledge layer. Institutes carry cross-disciplinary research, policy work, publishing, and innovation.',
      icon: 'fa-flask',
      tags: `${ACADEMIC_RESEARCH_INSTITUTES.length} institutes`,
      route: '/academics/research-institutes',
    },
    {
      num: '06',
      feature: false,
      b: 'College of Divine Wisdom',
      p: 'A complete sacred knowledge, consciousness, ethics, and civilisational transformation architecture.',
      icon: 'fa-dove',
      tags: `${this.featuredCollege.schools.length} schools - ${this.featuredCollege.programmes.length} programmes`,
      route: ['/academics/colleges', this.slugify(this.featuredCollege.name)],
    },
  ];

  readonly pathways = [
    {
      icon: 'fa-graduation-cap',
      b: 'Undergraduate',
      p: "Bachelor's degrees and undergraduate diplomas organised through colleges and schools, with professional and research continuity.",
      meta: ['Certificates, diplomas, and bachelor degrees', 'College-led admissions pathways', 'Programme detail pages stay separate', 'September 2026 intake'],
      cta: 'Explore undergraduate programmes',
      route: '/home/bachelors',
    },
    {
      icon: 'fa-user-graduate',
      b: 'Postgraduate',
      p: "Master's degrees, postgraduate diplomas, and advanced professional pathways connected to institutes and external practice.",
      meta: ['Masters and postgraduate diplomas', 'Research and professional tracks', 'Supervision alignment by school', 'Hybrid and on-campus options'],
      cta: 'Explore postgraduate programmes',
      route: '/home/masters',
    },
    {
      icon: 'fa-flask',
      b: 'Doctoral',
      p: 'Doctoral study anchored in departments and research institutes, with a clearer route into publication and public scholarship.',
      meta: ['PhD pathways across the colleges', 'Institute-linked research culture', 'Supervision governance', 'Thesis and dissertation standards'],
      cta: 'Explore doctoral programmes',
      route: '/home/phd',
    },
    {
      icon: 'fa-laptop',
      b: 'Online & short courses',
      p: 'Short, stackable digital routes for learners who need focused study before entering a longer award pathway.',
      meta: ['Certificate-ready learning blocks', 'Professional skills and academic bridges', 'Digital learning support', 'Future LMS alignment'],
      cta: 'Explore online learning',
      route: '/digital-campus',
    },
  ];

  readonly categories = [
    { icon: 'fa-landmark', label: 'Civilisational systems', selected: true },
    { icon: 'fa-microscope', label: 'Science & innovation', selected: false },
    { icon: 'fa-scale-balanced', label: 'Governance & law', selected: false },
    { icon: 'fa-heart-pulse', label: 'Health & society', selected: false },
    { icon: 'fa-chart-line', label: 'Economics & enterprise', selected: false },
    { icon: 'fa-leaf', label: 'Agriculture & climate', selected: false },
    { icon: 'fa-book-open', label: 'Humanities', selected: false },
    { icon: 'fa-laptop-code', label: 'Computing & data', selected: false },
    { icon: 'fa-people-roof', label: 'Education', selected: false },
    { icon: 'fa-globe-africa', label: 'Pan-African systems', selected: false },
    { icon: 'fa-dove', label: 'Divine wisdom', selected: false },
  ];

  readonly institutes = ACADEMIC_RESEARCH_INSTITUTES.slice(0, 4).map((name, index) => ({
    icon: ['fa-globe-africa', 'fa-building-shield', 'fa-scale-balanced', 'fa-shield-halved'][index] ?? 'fa-flask',
    h: name,
    p: this.instituteSummary(name),
    meta: 'Cross-college research architecture',
  }));

  readonly standards = [
    'Colleges, schools, departments, programmes, and institutes are separated for clean navigation.',
    'The full academic architecture remains available through dedicated pages instead of being compressed into one page.',
    'Programme detail pages remain focused on admissions, curriculum, outcomes, and funding.',
    'Research institutes stay visible as the bridge between teaching, policy, publication, and innovation.',
  ];

  programmePathway(programme: string): string {
    if (programme.startsWith('PhD')) return 'Doctoral pathway';
    if (programme.startsWith('Master') || programme.startsWith('MSc') || programme.startsWith('MA')) return 'Postgraduate pathway';
    if (programme.startsWith('Diploma')) return 'Diploma pathway';
    if (programme.startsWith('Certificate')) return 'Certificate pathway';
    return 'Undergraduate pathway';
  }

  slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private instituteSummary(name: string): string {
    if (name.includes('Pan-African')) return 'Civilisational thought, public scholarship, continental identity, and historical continuity.';
    if (name.includes('Governance')) return 'Statecraft, institutional reform, policy systems, and public administration.';
    if (name.includes('Law')) return 'Justice systems, constitutional development, regulation, and legal transformation.';
    if (name.includes('Security')) return 'Peacebuilding, strategic studies, human security, and continental stability.';
    return 'A cross-disciplinary research unit aligned to colleges, departments, and public impact.';
  }
}
