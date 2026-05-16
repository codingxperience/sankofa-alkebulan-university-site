import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../directives/reveal.directive';
import { TEAM_CATEGORY_GROUPS, TEAM_MEMBERS } from '../university/team-members';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
})
export class AboutPageComponent implements AfterViewInit {
  @ViewChild('heroVideo') heroVideo?: ElementRef<HTMLVideoElement>;

  readonly subnav = [
    { label: 'Mission & philosophy', path: '/about', fragment: 'mission' },
    { label: 'History', path: '/about', fragment: 'history' },
    { label: 'Governance', path: '/about', fragment: 'governance' },
    { label: 'Leadership', path: '/about', fragment: 'leadership' },
    { label: 'Executive Team', path: '/about/executive-team', fragment: undefined },
    { label: 'Board of Governance', path: '/about/board-of-governance', fragment: undefined },
    { label: 'Advisory Council', path: '/about/advisory-council', fragment: undefined },
    { label: 'Research & Scholarly Team', path: '/about/research-scholarly-team', fragment: undefined },
    { label: 'Identity & charter', path: '/about', fragment: 'identity' },
    { label: 'Impact', path: '/about', fragment: 'impact' },
  ];

  readonly values = [
    {
      n: '01',
      b: 'Restoration as method',
      p: 'Treating the recovery of African intellectual heritage as a primary academic discipline, not a footnote.',
    },
    {
      n: '02',
      b: 'Rigour over rhetoric',
      p: "Peer-reviewed, multidisciplinary scholarship. Africa's questions taken as seriously as Africa's answers.",
    },
    {
      n: '03',
      b: 'Public scholarship',
      p: 'Research that contributes to public policy, social transformation, and cultural renewal - not only the seminar room.',
    },
    {
      n: '04',
      b: 'Intellectual sovereignty',
      p: 'Building institutions that hold the work of African thinking, in African hands, for the long term.',
    },
  ];

  readonly timeline = [
    {
      year: '2018',
      b: 'An idea takes shape.',
      p: 'Scholars convene around the premise that Africa needs a serious research home for its own intellectual traditions.',
    },
    {
      year: '2021',
      b: 'Institute incorporated.',
      p: 'The Sankofa Research Institute is registered as an independent intellectual platform with a publishing arm.',
    },
    {
      year: '2023',
      b: 'First doctoral cohort.',
      p: 'Six funded doctoral fellows begin work across Pan-African studies, indigenous knowledge, and political thought.',
    },
    {
      year: '2025',
      b: 'University charter granted.',
      p: 'Sankofa Alkebulan University is chartered, opening undergraduate, postgraduate, and online pathways.',
    },
    {
      year: '2026',
      b: 'Third intake opens.',
      p: 'Domestic and international applications open for the September 2026 cohort, with full need-based aid.',
    },
  ];

  readonly governance = [
    {
      num: '01',
      h: 'Founder',
      p: 'Custodian of the founding vision and philosophical direction. The Founder safeguards the long-term mission and the founding ethos of the institution.',
      role: 'Strategic authority',
    },
    {
      num: '02',
      h: 'Board of Governance',
      p: 'The highest supervisory authority of the university. Approves major policy, oversees financial stewardship, and ensures compliance with legal and ethical standards.',
      role: 'Supervisory authority',
    },
    {
      num: '03',
      h: 'Advisory Council',
      p: 'Distinguished scholars, intellectuals, and policy experts who provide independent counsel on academic direction, international collaboration, and strategic planning.',
      role: 'Advisory body',
    },
    {
      num: '04',
      h: 'University Council',
      p: 'The central governing body responsible for institutional administration. Translates strategic direction into operational frameworks across the university.',
      role: 'Governing body',
    },
    {
      num: '05',
      h: 'Academic Senate',
      p: 'The highest authority on academic matters. Approves programmes and curricula, sets research priorities, and maintains academic quality and freedom.',
      role: 'Academic authority',
    },
    {
      num: '06',
      h: 'Executive Directors',
      p: 'The senior administrative leadership responsible for implementing policies and managing operations across research, academic affairs, and institutional development.',
      role: 'Executive leadership',
    },
  ];

  readonly leadership = TEAM_MEMBERS
    .filter((member) => member.categories.includes('founders'))
    .map((member) => ({
      photo: member.image,
      b: member.name,
      s: member.role,
      p: member.summary,
      route: ['/about/team', member.slug] as const,
      objectPosition: member.objectPosition ?? '50% 30%',
    }));

  readonly teamGateways = TEAM_CATEGORY_GROUPS
    .filter((group) => group.id !== 'founders')
    .map((group) => ({
      label: group.label,
      count: group.members.length,
      route: this.teamRoute(group.id),
      icon: this.teamIcon(group.id),
      summary: this.teamSummary(group.id),
      preview: group.members.slice(0, 4),
    }));
  readonly identityDocs = [
    { icon: 'fa-solid fa-scroll', b: 'Institutional charter', s: '2025' },
    { icon: 'fa-regular fa-compass', b: 'Strategic plan', s: '2026-2031' },
    { icon: 'fa-solid fa-scale-balanced', b: 'Code of ethics', s: 'Senate-ratified' },
    { icon: 'fa-solid fa-book', b: 'Regulations handbook', s: '2026' },
    { icon: 'fa-regular fa-calendar', b: 'Academic calendar', s: '2026 / 2027' },
  ];

  readonly impactRowA = [
    { num: '17', lbl: 'Schools across six colleges' },
    { num: '4', lbl: 'Continental research institutes' },
    { num: '54', lbl: 'Countries in present cohort' },
    { num: 'UGX 1.2 B', lbl: 'Need-based aid each year' },
  ];

  readonly impactRowB = [
    { num: '320+', lbl: 'Peer-reviewed papers since 2023' },
    { num: '62', lbl: 'Active continental partnerships' },
    { num: '100%', lbl: 'Need-met for admitted undergraduates' },
    { num: '38', lbl: 'Languages represented in current cohort' },
  ];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') { return; }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced && this.heroVideo) {
      this.heroVideo.nativeElement.pause();
    }
  }

  private teamRoute(categoryId: string): string {
    switch (categoryId) {
      case 'executive':
        return '/about/executive-team';
      case 'board':
        return '/about/board-of-governance';
      case 'advisory':
        return '/about/advisory-council';
      case 'research-scholarly':
        return '/about/research-scholarly-team';
      default:
        return '/about';
    }
  }

  private teamIcon(categoryId: string): string {
    switch (categoryId) {
      case 'executive':
        return 'fa-compass-drafting';
      case 'board':
        return 'fa-building-shield';
      case 'advisory':
        return 'fa-people-arrows';
      case 'research-scholarly':
        return 'fa-book-open-reader';
      default:
        return 'fa-users';
    }
  }

  private teamSummary(categoryId: string): string {
    switch (categoryId) {
      case 'executive':
        return 'Operational leadership carrying policy, student systems, and institutional implementation.';
      case 'board':
        return 'Supervisory stewardship for institutional authority, compliance, and long-range stability.';
      case 'advisory':
        return 'Independent counsel strengthening academic direction, partnerships, and public judgement.';
      case 'research-scholarly':
        return 'Scholarly contributors supporting inquiry, documentation, and knowledge-system formation.';
      default:
        return 'Leadership directory.';
    }
  }
}
