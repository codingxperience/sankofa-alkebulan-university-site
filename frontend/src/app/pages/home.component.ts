import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../directives/reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly indexItems = [
    { label: 'Undergraduate admissions — September 2026', meta: 'OPEN — 6 WEEKS' },
    { label: 'Postgraduate — Pan-African Studies (full aid)', meta: 'OPEN' },
    { label: 'Doctoral cohort — Indigenous Knowledge Systems', meta: '4 SEATS' },
    { label: 'Annual Lecture — Prof. R. Ruhinda', meta: '14 MAR' },
    { label: 'Faculty research call — continental impact', meta: 'UGX 220 M' },
  ];

  readonly tiles = [
    {
      icon: 'fa-graduation-cap',
      title: 'Begin a degree',
      body: 'Undergraduate admissions for September 2026.',
      route: '/admissions',
      warm: false,
    },
    {
      icon: 'fa-flag',
      title: 'For institutions',
      body: 'Partnership tracks for governments, NGOs, and industry.',
      route: null,
      warm: true,
    },
    {
      icon: 'fa-microscope',
      title: 'Research at SAU',
      body: 'Funded doctoral seats and continental institutes.',
      route: null,
      warm: false,
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

  readonly points = [
    {
      n: '01',
      h: 'Scholarship that takes Africa seriously.',
      p: 'African civilizational thought, modern science, ethics, and indigenous knowledge — taught as one tradition.',
    },
    {
      n: '02',
      h: 'Research with public consequence.',
      p: 'Four institutes shaping policy, industry, and culture across the continent and the global academy.',
    },
    {
      n: '03',
      h: 'Pathways for every learner.',
      p: 'Undergraduate, postgraduate, doctoral, and online tracks with transparent progression at every stage.',
    },
    {
      n: '04',
      h: 'Ethical, public-spirited leadership.',
      p: 'A founding ethos of restoration: stewardship of African knowledge, ecology, and community life.',
    },
  ];

  readonly departments = [
    {
      icon: 'fa-landmark',
      t: 'African Civilizational Studies',
      d: 'African civilization, heritage, languages, philosophy, and visual arts.',
      schools: '5 schools',
      level: 'UG — PG — PhD',
    },
    {
      icon: 'fa-microscope',
      t: 'Science, Technology & Innovation',
      d: 'Computing, climate, biotech, and applied engineering.',
      schools: '5 schools',
      level: 'UG — PG — PhD',
    },
    {
      icon: 'fa-scale-balanced',
      t: 'Governance, Law & Public Policy',
      d: 'Constitutional studies, public administration, and ethics.',
      schools: '3 schools',
      level: 'UG — PG',
    },
    {
      icon: 'fa-heart-pulse',
      t: 'Health, Wellbeing & Society',
      d: 'Medicine, public health, and indigenous health systems.',
      schools: '4 schools',
      level: 'UG — PG — MD',
    },
    {
      icon: 'fa-chart-line',
      t: 'Business, Enterprise & Economics',
      d: 'African economies, finance, and entrepreneurship.',
      schools: '3 schools',
      level: 'UG — PG — MBA',
    },
    {
      icon: 'fa-people-roof',
      t: 'Education & Teacher Development',
      d: 'Pedagogy, curriculum design, and educational leadership.',
      schools: '2 schools',
      level: 'UG — PG',
    },
  ];

  readonly signals = [
    {
      tone: 'cool',
      date: 'Admissions — 2026 intake',
      h: 'One AI-guided application for every pathway.',
      p: 'Undergraduate, postgraduate, and doctoral routes filed through a single application of record.',
      more: 'Start application',
      route: '/admissions',
    },
    {
      tone: 'warm',
      date: '14 March — Annual Lecture',
      h: 'Prof. R. Ruhinda — Restoration as a research method.',
      p: 'Free, public, and recorded. Held in the John K. Sentongo Hall and streamed live.',
      more: 'Reserve a seat',
      route: null,
    },
    {
      tone: 'default',
      date: 'Research — open call',
      h: 'Faculty research grants for continental impact.',
      p: 'Up to UGX 220 M for cross-school projects on African knowledge systems, climate, and AI.',
      more: 'Read the brief',
      route: null,
    },
  ];
}
