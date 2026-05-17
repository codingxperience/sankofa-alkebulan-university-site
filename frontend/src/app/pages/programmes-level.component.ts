import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
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
  imports: [RouterLink, RouterLinkActive],
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

  readonly programmesPerPage = 9;
  readonly programmePage = signal(0);
  readonly programmes = computed(() => PROGRAMME_CARDS_BY_LEVEL[this.level()] ?? []);
  readonly programmePageCount = computed(() =>
    Math.max(1, Math.ceil(this.programmes().length / this.programmesPerPage)),
  );
  readonly currentProgrammePage = computed(() =>
    Math.min(this.programmePage(), this.programmePageCount() - 1),
  );
  readonly visibleProgrammes = computed(() => {
    const start = this.currentProgrammePage() * this.programmesPerPage;
    return this.programmes().slice(start, start + this.programmesPerPage);
  });
  readonly isPhdLayout = computed(() => this.category().layout === 'phd');
  readonly phdSections = PHD_SECTIONS;
  readonly activePhdSectionId = signal(PHD_SECTIONS[0]?.id ?? 'scope');
  readonly activePhdSection = computed(() => PHD_SECTIONS.find((section) => section.id === this.activePhdSectionId()) ?? PHD_SECTIONS[0]);

  readonly levelMeta = computed(() => {
    const current = this.level();
    const common = {
      phd: {
        hero: 'Doctoral study with public consequence.',
        sub: 'Research programmes for scholars whose questions need supervision, method, evidence, and a continental field of application.',
        stats: ['6 research themes', '250+ faculty mentors', 'Thesis to public work'],
      },
      masters: {
        hero: 'Masters programmes for serious professional depth.',
        sub: 'Advanced study for practitioners, researchers, and institution builders moving from competence into leadership.',
        stats: ['20+ programmes', 'Applied research', 'Professional routes'],
      },
      'postgraduate-diploma': {
        hero: 'Postgraduate diplomas for focused transition.',
        sub: 'Compact, practice-led study for graduates who need a sharper professional method before the next academic or career move.',
        stats: ['Focused year', 'Practice led', 'Career transition'],
      },
      bachelors: {
        hero: 'Undergraduate study with a research spine.',
        sub: 'Bachelor programmes that join disciplinary foundations, African knowledge systems, applied learning, and public responsibility.',
        stats: ['8 semesters', 'Field practice', 'Professional readiness'],
      },
      diploma: {
        hero: 'Diplomas for applied capability.',
        sub: 'Practical routes for students building workforce-ready skills, technical confidence, and clear progression into higher awards.',
        stats: ['2 years', 'Studio and lab', 'Work ready'],
      },
      certificate: {
        hero: 'Certificates for immediate formation.',
        sub: 'Short, disciplined credentials for focused skills, early access, and professional refresh without a full degree commitment.',
        stats: ['Short modules', 'Focused skills', 'Stackable routes'],
      },
    } as const;
    return common[current] ?? common.bachelors;
  });

  setActivePhdSection(id: string) {
    this.activePhdSectionId.set(id);
  }

  previousProgrammePage() {
    this.programmePage.set(Math.max(0, this.currentProgrammePage() - 1));
  }

  nextProgrammePage() {
    this.programmePage.set(Math.min(this.programmePageCount() - 1, this.currentProgrammePage() + 1));
  }

  constructor() {
    const title = inject(Title);
    effect(() => {
      const selected = this.category();
      const formal = selected.shortLabel.includes('Programmes')
        ? selected.shortLabel
        : `${selected.shortLabel} Programmes`;
      title.setTitle(`${formal} - Sankofa Alkebulan University`);
    });
  }
}
