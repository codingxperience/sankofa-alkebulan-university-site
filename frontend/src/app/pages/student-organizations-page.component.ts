import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  STUDENT_LIFE_DECLARATIONS,
  STUDENT_LIFE_SYSTEMS,
  type StudentLifeGroup,
  type StudentLifeSystem,
} from '../university/student-life-systems';

type SystemId = StudentLifeSystem['id'];

interface SystemSummary {
  readonly id: SystemId;
  readonly number: string;
  readonly label: string;
  readonly eyebrow: string;
  readonly directoryTitle: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly groups: number;
  readonly entries: number;
  readonly firstGroups: readonly string[];
}

interface FeatureRoute {
  readonly title: string;
  readonly label: string;
  readonly image: string;
  readonly text: string;
}

interface HowToStep {
  readonly number: string;
  readonly title: string;
  readonly text: string;
}

interface Principle {
  readonly number: string;
  readonly title: string;
  readonly text: string;
}

const STUDENT_ORG_IMAGES = {
  hero: '/assets/student-organizations/student-life-culture-societies.jpg',
  cultural: '/assets/student-organizations/cultural-societies.jpg',
  clubs: '/assets/student-organizations/science-clubs-lab.jpg',
  professional: '/assets/student-organizations/professional-societies-meeting.jpg',
  heritagePractice: '/assets/student-organizations/student-life-culture-societies.jpg',
  roboticsWorkshop: '/assets/student-organizations/digital-clubs-lab.jpg',
  professionalSeminar: '/assets/student-organizations/professional-standards-forum.jpg',
  digitalStudyLab: '/assets/student-organizations/student-groups-campus.jpg',
} as const;

interface DirectoryEntry {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly groupTitle: string;
  readonly groupSubtitle: string;
  readonly systemId: SystemId;
  readonly systemLabel: string;
  readonly badge: string;
  readonly description: string;
  readonly membership: string;
  readonly oversight: string;
  readonly output: string;
  readonly mailto: string;
}

@Component({
  selector: 'app-student-organizations-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './student-organizations-page.component.html',
  styleUrl: './student-organizations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentOrganizationsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly contactEmail = 'SanAlkeU@outlook.com';
  private readonly defaultSystem = this.readInitialSystem();

  readonly systems = STUDENT_LIFE_SYSTEMS;
  readonly declarations = STUDENT_LIFE_DECLARATIONS;
  readonly activeSystemId = signal<SystemId>(this.defaultSystem);
  readonly query = signal('');
  readonly activeGroup = signal('All');
  readonly visibleLimit = signal(36);

  readonly summaries: readonly SystemSummary[] = this.systems.map((system) => ({
    id: system.id,
    number: this.systemNumber(system.id),
    label: this.systemLabel(system.id),
    eyebrow: this.systemEyebrow(system.id),
    directoryTitle: this.directoryTitle(system.id),
    title: this.systemCardTitle(system.id),
    description: this.systemCardDescription(system.id),
    image: this.systemImage(system.id),
    imageAlt: this.systemImageAlt(system.id),
    groups: system.groups.length,
    entries: this.countItems(system),
    firstGroups: system.groups.slice(0, 3).map((group) => group.title),
  }));

  readonly totalGroups = this.summaries.reduce((sum, summary) => sum + summary.groups, 0);
  readonly totalEntries = this.summaries.reduce((sum, summary) => sum + summary.entries, 0);

  readonly featureRoutes: readonly FeatureRoute[] = [
    {
      title: 'Cultural unions',
      label: 'Heritage, language, archive, and intercultural work',
      image: STUDENT_ORG_IMAGES.heritagePractice,
      text: 'Cultural societies hold identity work inside an academic frame: language practice, oral history, heritage documentation, and intercultural events.',
    },
    {
      title: 'Applied clubs',
      label: 'Labs, simulations, field practice, and public demonstrations',
      image: STUDENT_ORG_IMAGES.roboticsWorkshop,
      text: 'Applied clubs give students a place to test ideas through projects, clinics, prototypes, debates, field notes, and peer-led production.',
    },
    {
      title: 'Professional societies',
      label: 'Ethics, competencies, internship records, and CPD',
      image: STUDENT_ORG_IMAGES.professionalSeminar,
      text: 'Professional societies connect each discipline to external standards, practice identity, placement preparation, and sector-facing portfolios.',
    },
    {
      title: 'Digital and systems practice',
      label: 'AI, software, data, infrastructure, and security',
      image: STUDENT_ORG_IMAGES.digitalStudyLab,
      text: 'Technical organisations anchor coding, digital defense, data science, telecommunications, and AI policy work in reusable student portfolios.',
    },
  ];

  readonly howToSteps: readonly HowToStep[] = [
    {
      number: '01',
      title: 'Bring a one-page brief.',
      text: 'A name, a clear remit, the academic question or practice it addresses, and the eight founding members, signed.',
    },
    {
      number: '02',
      title: 'Find an academic adviser.',
      text: "A faculty member who agrees to oversee the society's academic content and to sign off the annual report.",
    },
    {
      number: '03',
      title: 'Get a governance home.',
      text: 'Cultural Council, Applied Council, or Professional Council, depending on the system the society sits inside.',
    },
    {
      number: '04',
      title: 'Hold a public meeting.',
      text: 'Open to all students. Officers elected. Society activated with a budget line and a calendar slot.',
    },
  ];

  readonly principles: readonly Principle[] = [
    {
      number: '01',
      title: 'Academic seriousness',
      text: 'Student organisations are academic work in club form, not extracurricular decoration. Every society reports against a question.',
    },
    {
      number: '02',
      title: 'Open membership',
      text: 'Membership is open and traceable. Society rolls, officer elections, and budgets are public information on request.',
    },
    {
      number: '03',
      title: 'Transparent governance',
      text: 'Cultural unions, applied clubs, and professional societies all answer to one rule: show your work each year.',
    },
    {
      number: '04',
      title: 'Public output',
      text: 'Each society leaves evidence behind: a showcase, field note, portfolio, publication, exhibition, clinic, or annual public report.',
    },
  ];

  readonly activeSystem = computed(
    () => this.systems.find((system) => system.id === this.activeSystemId()) ?? this.systems[0],
  );

  readonly activeSummary = computed(
    () => this.summaries.find((summary) => summary.id === this.activeSystemId()) ?? this.summaries[0],
  );

  readonly groupOptions = computed(() => [
    'All',
    ...this.activeSystem().groups.map((group) => group.title),
  ]);

  readonly directoryEntries = computed(() =>
    this.activeSystem().groups.flatMap((group, groupIndex) =>
      group.items.map((item, itemIndex) =>
        this.toDirectoryEntry(this.activeSystem(), group, groupIndex, item, itemIndex),
      ),
    ),
  );

  readonly filteredEntries = computed(() => {
    const query = this.normalise(this.query());
    const group = this.activeGroup();
    return this.directoryEntries().filter((entry) => {
      const groupMatch = group === 'All' || entry.groupTitle === group;
      if (!groupMatch) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = this.normalise(
        `${entry.name} ${entry.groupTitle} ${entry.groupSubtitle} ${entry.description} ${entry.systemLabel}`,
      );
      return haystack.includes(query);
    });
  });

  readonly visibleEntries = computed(() => this.filteredEntries().slice(0, this.visibleLimit()));
  readonly remainingEntries = computed(() =>
    Math.max(0, this.filteredEntries().length - this.visibleEntries().length),
  );

  setSystem(systemId: SystemId): void {
    this.activeSystemId.set(systemId);
    this.activeGroup.set('All');
    this.query.set('');
    this.visibleLimit.set(36);
  }

  setGroup(group: string): void {
    this.activeGroup.set(group);
    this.visibleLimit.set(36);
  }

  updateQuery(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.query.set(input?.value ?? '');
    this.visibleLimit.set(36);
  }

  showMore(): void {
    this.visibleLimit.update((limit) => limit + 36);
  }

  showAll(): void {
    this.visibleLimit.set(this.filteredEntries().length);
  }

  clearFilters(): void {
    this.query.set('');
    this.activeGroup.set('All');
    this.visibleLimit.set(36);
  }

  private readInitialSystem(): SystemId {
    const system = this.route.snapshot.data['system'];
    return system === 'cultural' || system === 'clubs' || system === 'professional'
      ? system
      : 'cultural';
  }

  private toDirectoryEntry(
    system: StudentLifeSystem,
    group: StudentLifeGroup,
    groupIndex: number,
    item: string,
    itemIndex: number,
  ): DirectoryEntry {
    const description = this.describeEntry(system, group);
    return {
      id: `${system.id}-${groupIndex}-${itemIndex}`,
      name: item,
      initials: this.initials(item),
      groupTitle: group.title,
      groupSubtitle: group.subtitle ?? this.groupSubtitle(system.id),
      systemId: system.id,
      systemLabel: system.label,
      badge: this.badge(system.id),
      description,
      membership: this.membership(system.id),
      oversight: this.oversight(system, group),
      output: this.output(system.id),
      mailto: this.mailto(item, system.label, group.title),
    };
  }

  private describeEntry(system: StudentLifeSystem, group: StudentLifeGroup): string {
    const focus = this.cleanGroupTitle(group.title);
    if (system.id === 'cultural') {
      return `Heritage forum for ${focus.toLowerCase()}: language practice, archive work, cultural programming, and documentation.`;
    }
    if (system.id === 'professional') {
      return `Professional identity route for ${focus.toLowerCase()}: ethics, competency records, placements, and CPD preparation.`;
    }
    return `Applied student route for ${focus.toLowerCase()}: project clinics, field practice, simulations, and peer-led production.`;
  }

  private cleanGroupTitle(title: string): string {
    return title
      .replace(' Professional Society', '')
      .replace(' Professional Societies', '')
      .replace(' Society', '')
      .replace(' Societies', '')
      .replace(' Clubs', '')
      .replace(' Systems', '')
      .trim();
  }

  private groupSubtitle(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return 'Cultural knowledge and heritage system';
    }
    if (systemId === 'professional') {
      return 'Professional standards and external relations';
    }
    return 'Applied learning and student practice';
  }

  private badge(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return 'Society';
    }
    if (systemId === 'professional') {
      return 'Professional';
    }
    return 'Club';
  }

  private systemNumber(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return '01';
    }
    if (systemId === 'clubs') {
      return '02';
    }
    return '03';
  }

  private systemLabel(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return 'Cultural unions';
    }
    if (systemId === 'clubs') {
      return 'Applied clubs';
    }
    return 'Professional societies';
  }

  private systemEyebrow(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return 'Heritage, language, intercultural work';
    }
    if (systemId === 'clubs') {
      return 'Labs, simulations, public demonstrations';
    }
    return 'Ethics, competencies, CPD, placement';
  }

  private systemCardTitle(systemId: SystemId): string {
    return this.systemLabel(systemId);
  }

  private systemCardDescription(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return 'Identity work inside an academic frame: language practice, oral history, heritage documentation, and intercultural events.';
    }
    if (systemId === 'clubs') {
      return 'A place to test ideas through projects, clinics, prototypes, debates, field notes, and peer-led production.';
    }
    return 'Connecting each discipline to external standards, practice identity, placement preparation, and sector-facing portfolios.';
  }

  private directoryTitle(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return 'A federation of cultural and language societies.';
    }
    if (systemId === 'clubs') {
      return 'Practice-based ecosystems for capability and leadership.';
    }
    return 'The bridge from study to recognised professional identity.';
  }

  private membership(systemId: SystemId): string {
    if (systemId === 'professional') {
      return 'Open to aligned students, alumni, staff, and approved partners';
    }
    return 'Open to students, with elected officers and a staff adviser';
  }

  private oversight(system: StudentLifeSystem, group: StudentLifeGroup): string {
    if (system.id === 'cultural') {
      return system.governanceTitle;
    }
    return group.subtitle ?? system.governanceTitle;
  }

  private output(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return 'Archive note, event record, or language/heritage output';
    }
    if (systemId === 'professional') {
      return 'Competency log, placement record, or professional portfolio';
    }
    return 'Project record, clinic report, prototype, or public demonstration';
  }

  private initials(value: string): string {
    const words = value
      .replace(/[()]/g, ' ')
      .split(/\s+/)
      .filter((word) => /^[a-z0-9]/i.test(word));
    const first = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
    return first || 'SA';
  }

  private mailto(name: string, system: string, group: string): string {
    const subject = `Student organisation interest - ${name}`;
    const body = [
      `Organisation: ${name}`,
      `System: ${system}`,
      `Group: ${group}`,
      '',
      'Hello Sankofa Alkebulan University,',
      'I would like to receive membership information for this organisation.',
    ].join('\n');
    return `mailto:${this.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  private countItems(system: StudentLifeSystem): number {
    return system.groups.reduce((sum, group) => sum + group.items.length, 0);
  }

  private systemImage(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return STUDENT_ORG_IMAGES.cultural;
    }
    if (systemId === 'professional') {
      return STUDENT_ORG_IMAGES.professional;
    }
    return STUDENT_ORG_IMAGES.clubs;
  }

  private systemImageAlt(systemId: SystemId): string {
    if (systemId === 'cultural') {
      return 'Students gathered for cultural and public life programming';
    }
    if (systemId === 'professional') {
      return 'Professionals in a standards and advisory meeting';
    }
    return 'Students using computers in an applied learning lab';
  }

  private normalise(value: string): string {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
  }
}
