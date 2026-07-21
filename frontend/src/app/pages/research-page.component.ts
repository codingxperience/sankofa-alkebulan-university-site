import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface InstituteGroup {
  readonly key: string;
  readonly label: string;
}

interface Institute {
  readonly name: string;
  readonly group: string;
  readonly num: string;
  readonly groupLabel: string;
}

interface CatalogRecord {
  readonly year: string;
  readonly title: string;
  readonly nature: string;
  readonly field: string;
}

interface Catalog {
  readonly label: string;
  readonly summary: string;
  readonly records: readonly CatalogRecord[];
}

const GROUPS: readonly InstituteGroup[] = [
  { key: 'all', label: 'All institutes' },
  { key: 'gov', label: 'Governance & Society' },
  { key: 'econ', label: 'Economy & Enterprise' },
  { key: 'sci', label: 'Science & Technology' },
  { key: 'health', label: 'Health & Life Sciences' },
  { key: 'climate', label: 'Climate, Environment & Infrastructure' },
  { key: 'human', label: 'Humanities & Human Development' },
  { key: 'sacred', label: 'Sacred & Civilisational' },
];

const RAW: readonly (readonly [string, string])[] = [
  ['Institute for Pan-African Civilisational Systems', 'gov'],
  ['Institute for Governance, Public Policy & Statecraft', 'gov'],
  ['Institute for Law, Justice & Constitutional Development', 'gov'],
  ['Institute for Security, Peace & Strategic Studies', 'gov'],
  ['Institute for Diplomacy & Global Relations', 'gov'],
  ['Institute for Leadership, Institutions & State Capacity', 'gov'],
  ['Institute for Financial Systems & Economic Transformation', 'econ'],
  ['Institute for Trade, Logistics & Industrial Systems', 'econ'],
  ['Institute for Entrepreneurship, Innovation & Enterprise Systems', 'econ'],
  ['Institute for Digital Economy & Platform Systems', 'econ'],
  ['Institute for Agribusiness & Value Chain Systems', 'econ'],
  ['Institute for Advanced Mathematical & Computational Systems', 'sci'],
  ['Institute for Physical Sciences & Advanced Materials', 'sci'],
  ['Institute for Engineering, Infrastructure & Industrial Systems', 'sci'],
  ['Institute for Artificial Intelligence, Data & Digital Systems', 'sci'],
  ['Institute for Robotics & Cyber-Physical Systems', 'sci'],
  ['Institute for Telecommunications & Digital Infrastructure', 'sci'],
  ['Institute for Space, Aerospace & Satellite Systems', 'sci'],
  ['Institute for Medical Sciences & Clinical Research', 'health'],
  ['Institute for Public Health, Epidemiology & Health Security', 'health'],
  ['Institute for Pharmaceutical & Drug Development Systems', 'health'],
  ['Institute for Biomedical & Laboratory Systems', 'health'],
  ['Institute for Biotechnology & Genomic Systems', 'health'],
  ['Institute for Agriculture, Agroecology & Food Systems', 'health'],
  ['Institute for Food Science, Nutrition & Food Security', 'health'],
  ['Institute for Industrial Hemp & Bio-Economy Systems', 'health'],
  ['Institute for Earth Systems & Geosciences', 'climate'],
  ['Institute for Climate Change & Sustainability Systems', 'climate'],
  ['Institute for Climate Economy & Carbon Systems', 'climate'],
  ['Institute for Environmental Science & Ecological Systems', 'climate'],
  ['Institute for Water Systems, Hydrology & Sanitation', 'climate'],
  ['Institute for Energy, Extractives & Resource Systems', 'climate'],
  ['Institute for Architecture & Built Environment Systems', 'climate'],
  ['Institute for Urban Futures & Smart Cities', 'climate'],
  ['Institute for Transport & Mobility Systems', 'climate'],
  ['Institute for Maritime & Blue Economy Systems', 'climate'],
  ['Institute for Humanities & Civilisation Studies', 'human'],
  ['Institute for Indigenous Knowledge & Epistemic Systems', 'human'],
  ['Institute for Religion, Spirituality & Ethics', 'human'],
  ['Institute for Languages, Translation & Communication Systems', 'human'],
  ['Institute for Arts, Creative Industries & Cultural Systems', 'human'],
  ['Institute for Media, Communication & Information Systems', 'human'],
  ['Institute for Education Systems & Pedagogical Innovation', 'human'],
  ['Institute for Psychology, Behaviour & Human Development', 'human'],
  ['Institute for Sports Science & Human Performance', 'human'],
  ['Institute for Leadership & Human Capital Systems', 'human'],
  ['Institute for Tourism, Hospitality & Cultural Economy', 'human'],
  ['Institute for Futures, Foresight & Strategic Systems', 'human'],
  ['Institute for Civilisational Transformation & Global Systems', 'human'],
  ['Institute for African Sacred Civilisations', 'sacred'],
  ['Institute for Consciousness and Human Transformation', 'sacred'],
  ['Institute for Ethics and Moral Governance', 'sacred'],
  ['Institute for Sacred Ecology and Planetary Harmony', 'sacred'],
  ['Institute for Peace, Reconciliation and Human Unity', 'sacred'],
  ['Institute for Mysticism and Contemplative Sciences', 'sacred'],
  ['Institute for Spiritual Psychology and Human Flourishing', 'sacred'],
  ['Institute for Comparative Sacred Knowledge', 'sacred'],
  ['Institute for Civilisational Futures and Prophetic Studies', 'sacred'],
  ['Institute for Indigenous Wisdom Recovery and Preservation', 'sacred'],
];

const GROUP_LABEL: Record<string, string> = {};
GROUPS.forEach((g) => {
  GROUP_LABEL[g.key] = g.label;
});

const GROUP_HUE: Record<string, string> = {
  all: '#f1cf83',
  gov: 'oklch(0.74 0.12 250)',
  econ: 'oklch(0.79 0.12 85)',
  sci: 'oklch(0.75 0.12 200)',
  health: 'oklch(0.75 0.13 150)',
  climate: 'oklch(0.75 0.12 120)',
  human: 'oklch(0.72 0.13 300)',
  sacred: 'oklch(0.72 0.13 45)',
};

const INSTITUTES: readonly Institute[] = RAW.map((r, i) => ({
  name: r[0],
  group: r[1],
  num: String(i + 1).padStart(2, '0'),
  groupLabel: GROUP_LABEL[r[1]],
}));

const CATALOGS: readonly Catalog[] = [
  {
    label: 'Guidelines',
    summary:
      'Core frameworks for ethics, methods, repositories, IP, and public-facing scholarship — the standards every institute works to.',
    records: [
      { year: '2026', title: 'Research Ethics and Community Consent Guide', nature: 'Guideline', field: 'Ethics & Fieldwork' },
      { year: '2026', title: 'Pan-African Research Methods Handbook', nature: 'Guideline', field: 'Indigenous Knowledge' },
      { year: '2026', title: 'Open Data and Knowledge Repository Standards', nature: 'Guideline', field: 'Digital Scholarship' },
      { year: '2026', title: 'IP, Patent, and Innovation Transfer Framework', nature: 'Guideline', field: 'Commercialisation' },
    ],
  },
  {
    label: 'Publications',
    summary:
      'Journals, policy briefs, working papers, proceedings, and open scholarship outputs published across the institutes.',
    records: [
      { year: '2026', title: 'Sankofa Journal of Pan-African Studies', nature: 'Journal', field: 'Civilisational Studies' },
      { year: '2026', title: 'Climate, Water, and Food Security Policy Briefs', nature: 'Brief series', field: 'Sustainability' },
      { year: '2026', title: 'AI, Governance, and Public Value Working Papers', nature: 'Working papers', field: 'AI & Governance' },
      { year: '2026', title: 'Cultural Heritage and Digital Humanities Review', nature: 'Research review', field: 'Heritage & Media' },
    ],
  },
  {
    label: 'Proposals',
    summary:
      'Doctoral, masters, and funded interdisciplinary proposals in active development across partner labs.',
    records: [
      { year: '2026', title: 'Indigenous Knowledge Systems and Public Health Resilience', nature: 'Doctoral', field: 'Health & Indigenous' },
      { year: '2026', title: 'AI-Assisted Governance Dashboards for Continental Policy', nature: 'Doctoral', field: 'AI & Policy' },
      { year: '2026', title: 'Climate Intelligence for Water, Agriculture and Food Security', nature: 'Masters', field: 'Climate & Food' },
      { year: '2026', title: 'Digital Humanities Archive for African Cultural Memory', nature: 'Masters', field: 'Digital Humanities' },
    ],
  },
];

@Component({
  selector: 'app-research-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './research-page.component.html',
  styleUrl: './research-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchPageComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly groups = GROUPS;
  readonly catalogs = CATALOGS;

  readonly heroChips = [
    { icon: 'fa-flask', label: '59 institutes' },
    { icon: 'fa-earth-africa', label: 'Continental focus' },
    { icon: 'fa-book-open', label: 'Open scholarship' },
    { icon: 'fa-handshake', label: 'Partner labs' },
  ];

  readonly flagships = [
    {
      eyebrow: 'Public Health',
      title: 'Biomedical discovery for community resilience.',
      description:
        'Health research moves from lab insight to field practice and policy guidance — clinical research, epidemiology, pharmaceutical development, and indigenous health systems working as one pipeline for the continent.',
      img: 'assets/card-medicine.jpg',
      alt: 'Medical research laboratory',
      institutes: [
        'Medical Sciences & Clinical Research',
        'Public Health & Health Security',
        'Biotechnology & Genomic Systems',
      ],
    },
    {
      eyebrow: 'AI + Society',
      title: 'Human-centred intelligence for African futures.',
      description:
        'AI, robotics, data science, and ethics are framed around public usefulness — governance dashboards, language technology, and cyber-physical systems built with African data, African questions, and African oversight.',
      img: 'assets/card-technology.jpg',
      alt: 'Technology and computing research',
      institutes: [
        'Artificial Intelligence, Data & Digital Systems',
        'Robotics & Cyber-Physical Systems',
        'Digital Economy & Platform Systems',
      ],
    },
    {
      eyebrow: 'Climate + Food',
      title: 'Earth systems research tied to everyday survival.',
      description:
        'Water, agriculture, renewable energy, and climate intelligence work together — from carbon systems and hydrology to agroecology and food security, translating earth-systems science into resilience on the ground.',
      img: 'assets/card-agriculture.jpg',
      alt: 'Agriculture and climate research',
      institutes: [
        'Climate Change & Sustainability Systems',
        'Water Systems, Hydrology & Sanitation',
        'Agriculture, Agroecology & Food Systems',
      ],
    },
  ];

  readonly steps = [
    {
      label: '01',
      icon: 'fa-compass-drafting',
      title: 'Frame',
      description: 'Define a continental question with community, faculty, and partner input.',
    },
    {
      label: '02',
      icon: 'fa-people-group',
      title: 'Collaborate',
      description: 'Build interdisciplinary teams across institutes, schools, and partner labs.',
    },
    {
      label: '03',
      icon: 'fa-flask-vial',
      title: 'Validate',
      description: 'Move through ethics, funding, fieldwork, peer review, and open evidence.',
    },
    {
      label: '04',
      icon: 'fa-arrow-up-right-dots',
      title: 'Transfer',
      description: 'Publish, patent, teach, advise policy, or launch practical innovation.',
    },
  ];

  readonly funding = [
    {
      kind: 'Doctoral seats',
      status: '4 seats',
      title: 'Indigenous Knowledge Systems cohort',
      body: 'Fully-supported doctoral seats bridging indigenous epistemics and public-health resilience.',
      metaA: 'PhD',
      metaALabel: 'level',
      metaB: 'Full aid',
      metaBLabel: 'support',
      tone: 'cool',
      cta: 'Apply for a seat',
    },
    {
      kind: 'Faculty grant',
      status: 'Open',
      title: 'Continental-impact research grants',
      body: 'Cross-school projects on African knowledge systems, climate intelligence, and AI for public value.',
      metaA: 'UGX 220 M',
      metaALabel: 'ceiling',
      metaB: 'Cross-school',
      metaBLabel: 'teams',
      tone: 'warm',
      cta: 'Read the brief',
    },
    {
      kind: 'Partnership',
      status: 'Rolling',
      title: 'Institute partnership pathway',
      body: 'For funders, labs, and public institutions co-designing interdisciplinary, continent-scale research.',
      metaA: '59',
      metaALabel: 'institutes',
      metaB: 'Rolling',
      metaBLabel: 'intake',
      tone: 'default',
      cta: 'Start a conversation',
    },
  ];

  readonly catalog = signal(0);
  readonly group = signal('all');
  readonly flag = signal(0);
  readonly query = signal('');
  readonly shown = signal(12);
  readonly counts = signal<number[]>([0, 0, 0, 0]);

  private counting = false;
  private raf = 0;
  private countObserver?: IntersectionObserver;
  private pipeObserver?: IntersectionObserver;
  private readonly targets = [59, 10, 275, 2026];
  private reduceMotion = false;

  @ViewChild('countBand')
  set countBand(ref: ElementRef<HTMLElement> | undefined) {
    if (!ref || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reduceMotion) {
      this.counts.set(this.targets.slice());
      return;
    }
    this.countObserver?.disconnect();
    this.countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.runCount();
            this.countObserver?.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    this.countObserver.observe(ref.nativeElement);
  }

  @ViewChild('pipeline')
  set pipeline(ref: ElementRef<HTMLElement> | undefined) {
    if (!ref || !isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.reduceMotion) {
      ref.nativeElement.classList.add('is-live');
      return;
    }
    this.pipeObserver?.disconnect();
    this.pipeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-live');
            this.pipeObserver?.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    this.pipeObserver.observe(ref.nativeElement);
  }

  ngOnDestroy(): void {
    this.countObserver?.disconnect();
    this.pipeObserver?.disconnect();
    if (this.raf && isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.raf);
    }
  }

  get heroStats() {
    const counts = this.counts();
    return [
      { display: String(counts[0]), label: 'Research institutes across 10 colleges' },
      { display: String(counts[1]), label: 'Colleges organising the academic estate' },
      { display: String(counts[2]), label: 'Programmes from certificate to PhD' },
      { display: String(counts[3]), label: 'Active research and funding cycle' },
    ];
  }

  get filtered(): readonly Institute[] {
    const q = this.query().trim().toLowerCase();
    const grp = this.group();
    let filtered = INSTITUTES;
    if (grp !== 'all') {
      filtered = filtered.filter((i) => i.group === grp);
    }
    if (q) {
      filtered = filtered.filter(
        (i) => i.name.toLowerCase().includes(q) || i.groupLabel.toLowerCase().includes(q),
      );
    }
    return filtered;
  }

  get limited(): boolean {
    return !!this.query().trim() || this.group() !== 'all';
  }

  get visibleInstitutes() {
    const filtered = this.filtered;
    const shown = this.limited ? filtered.length : Math.min(this.shown(), filtered.length);
    return filtered.slice(0, shown).map((i) => ({
      num: i.num,
      name: i.name,
      group: i.groupLabel,
      hue: GROUP_HUE[i.group] || '#f1cf83',
    }));
  }

  get hasMore(): boolean {
    return !this.limited && this.shown() < this.filtered.length;
  }

  get activeCatalog(): Catalog {
    return CATALOGS[this.catalog()];
  }

  groupCount(key: string): number {
    return key === 'all' ? 59 : INSTITUTES.filter((i) => i.group === key).length;
  }

  groupHue(key: string): string {
    return GROUP_HUE[key] || '#f1cf83';
  }

  selectGroup(key: string): void {
    this.group.set(key);
    this.shown.set(12);
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.shown.set(12);
  }

  showMore(): void {
    this.shown.update((s) => s + 12);
  }

  private runCount(): void {
    if (this.counting) {
      return;
    }
    this.counting = true;
    const dur = 1400;
    const start = performance.now();
    const targets = this.targets;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = ease(t);
      this.counts.set(targets.map((v) => Math.round(v * e)));
      if (t < 1) {
        this.raf = requestAnimationFrame(step);
      }
    };
    this.raf = requestAnimationFrame(step);
  }
}
