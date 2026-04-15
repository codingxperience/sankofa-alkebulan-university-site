import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  PROGRAMME_CARDS_BY_LEVEL,
  PROGRAMME_CATEGORIES,
  PHD_SECTIONS,
  ProgrammeCategory,
  ProgrammeLevel,
} from '../university/programmes-data';

@Component({
  selector: 'app-programmes-level',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './programmes-level.component.html',
  styleUrls: ['./programmes-level.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgrammesLevelComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly level = computed(() => {
    const routeLevel = this.paramMap().get('level');
    return ((routeLevel as ProgrammeLevel) ?? 'bachelors') as ProgrammeLevel;
  });

  readonly category = computed<ProgrammeCategory>(() => {
    const level = this.level();
    return (
      PROGRAMME_CATEGORIES.find((item) => item.level === level) ??
      PROGRAMME_CATEGORIES[3]
    );
  });

  readonly navItems = PROGRAMME_CATEGORIES.map((item) => ({
    label: item.shortLabel,
    path: `/home/${item.level}`,
  }));

  readonly programmes = computed(() => PROGRAMME_CARDS_BY_LEVEL[this.level()] ?? []);
  readonly isPhdLayout = computed(() => this.category().layout === 'phd');
  readonly phdSections = PHD_SECTIONS;
  readonly activePhdSectionId = signal(PHD_SECTIONS[0]?.id ?? 'scope');
  readonly activePhdSection = computed(() => PHD_SECTIONS.find((section) => section.id === this.activePhdSectionId()) ?? PHD_SECTIONS[0]);

  readonly levelMeta = computed(() => {
    const current = this.level();
    const common = {
      phd: {
        hero: 'Doctoral Research Designed for Pan-African Impact',
        sub: 'Forge original knowledge, join programs with rigorous supervision, and shape policy and innovation across Africa.',
        stats: ['6 research themes', '250+ faculty mentors', '100% doctoral support'],
      },
      masters: {
        hero: 'Masters Degrees for Career Leaders and Research Champions',
        sub: 'Deepen expertise with rigorous coursework, applied research projects, and leadership pathways.',
        stats: ['20+ programs', 'Research projects', 'Professional placements'],
      },
      'postgraduate-diploma': {
        hero: 'Postgraduate Diplomas for Accelerator Skills and Transition',
        sub: 'Build focused technical and professional capability for next-level career pivot in 1 year.',
        stats: ['Skill-focused', 'Industry-aligned', 'Accelerated learning'],
      },
      bachelors: {
        hero: 'Bachelors Programmes Anchored in African Knowledge Systems',
        sub: 'Start your leadership journey with interdisciplinary theory, practical labs, and experiential fieldwork.',
        stats: ['8 semesters', 'Community practice', 'Professional readiness'],
      },
      diploma: {
        hero: 'Diplomas for Fast, Practical Workforce Skills',
        sub: 'Get career-ready with applied training, labs, and real-world projects in 2 years.',
        stats: ['2 years', 'Project-based', 'Industry partnerships'],
      },
      certificate: {
        hero: 'Certificates for Immediate Professional Growth',
        sub: 'Quick, practical credentials to upskill in critical areas and launch your next move.',
        stats: ['1 year', 'Short modules', 'Career-focused'],
      },
    } as const;
    return common[current] ?? common.bachelors;
  });

  setActivePhdSection(id: string) {
    this.activePhdSectionId.set(id);
  }

  constructor() {
    const title = inject(Title);
    effect(() => {
      const selected = this.category();
      const formal = selected.shortLabel.includes('Programmes')
        ? selected.shortLabel
        : `${selected.shortLabel} Programmes`;
      title.setTitle(`${formal} · Sankofa Alkebulan University`);
    });
  }
}
