import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Subject {
  readonly key: string;
  readonly label: string;
  readonly q: string;
}

interface BookResult {
  readonly title: string;
  readonly author: string;
  readonly year: string;
  readonly cover: string;
  readonly hasCover: boolean;
  readonly href: string;
  readonly accessLabel: string;
  readonly accessBg: string;
  readonly accessColor: string;
}

const SUBJECTS: readonly Subject[] = [
  { key: 'african', label: 'African history', q: 'African history' },
  { key: 'panafrican', label: 'Pan-African thought', q: 'Pan-Africanism' },
  { key: 'indigenous', label: 'Indigenous knowledge', q: 'indigenous knowledge Africa' },
  { key: 'climate', label: 'Climate & environment', q: 'climate change Africa' },
  { key: 'health', label: 'Public health', q: 'public health Africa' },
  { key: 'governance', label: 'Governance & law', q: 'governance Africa' },
  { key: 'heritage', label: 'Heritage & culture', q: 'African culture heritage' },
];

const SORTS = [
  { key: 'relevance', label: 'Relevance', param: '' },
  { key: 'new', label: 'Newest', param: 'new' },
  { key: 'old', label: 'Oldest', param: 'old' },
  { key: 'editions', label: 'Most editions', param: 'editions' },
] as const;

const ACCESS = [
  { key: 'any', label: 'Any' },
  { key: 'public', label: 'Read free' },
  { key: 'borrowable', label: 'Borrowable' },
] as const;

const LANGS = [
  { key: 'any', label: 'Any' },
  { key: 'eng', label: 'English' },
  { key: 'fre', label: 'French' },
  { key: 'swa', label: 'Swahili' },
  { key: 'ara', label: 'Arabic' },
] as const;

function accessMeta(a: string | undefined): { label: string; bg: string; color: string } {
  switch (a) {
    case 'public':
      return { label: 'Read free', bg: 'rgba(35,184,100,0.12)', color: '#1f7a4d' };
    case 'borrowable':
      return { label: 'Borrowable', bg: '#eef1ff', color: '#0f4c81' };
    case 'printdisabled':
      return { label: 'Print-disabled', bg: 'rgba(179,92,42,0.1)', color: '#b35c2a' };
    default:
      return { label: 'Catalogue', bg: '#f1f4f8', color: '#58728b' };
  }
}

@Component({
  selector: 'app-library-repository-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './library-repository-page.component.html',
  styleUrl: './library-repository-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryRepositoryPageComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly subjects = SUBJECTS;
  readonly sorts = SORTS;
  readonly accessOptions = ACCESS;
  readonly langOptions = LANGS;
  readonly skeletons = [0, 1, 2, 3, 4, 5];

  readonly query = signal('');
  readonly subject = signal('african');
  readonly sort = signal<string>('relevance');
  readonly access = signal<string>('any');
  readonly lang = signal<string>('any');
  readonly yearFrom = signal('');
  readonly yearTo = signal('');
  readonly results = signal<BookResult[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly total = signal(0);
  readonly counts = signal<number[]>([0, 0, 0, 0]);

  private term = 'African history';
  private reqId = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private counting = false;
  private raf = 0;
  private countObserver?: IntersectionObserver;
  private readonly targets = [12400, 59, 2026, 100];

  readonly collections = [
    {
      icon: 'fa-book-open',
      count: '4,200+',
      title: 'Open Access Repository',
      body: 'Journals, working papers, and policy briefs from the institutes, free to read and cite.',
    },
    {
      icon: 'fa-graduation-cap',
      count: '2,100+',
      title: 'Theses & Dissertations',
      body: 'Doctoral and masters research across the academic estate, deposited under open standards.',
    },
    {
      icon: 'fa-box-archive',
      count: '3,600+',
      title: 'Digital Heritage Archive',
      body: 'African cultural memory — languages, oral histories, lectures, and film — digitised and preserved.',
    },
    {
      icon: 'fa-database',
      count: '900+',
      title: 'Data & Datasets',
      body: 'Climate, health, and governance datasets released to open-data and repository standards.',
    },
    {
      icon: 'fa-landmark-dome',
      count: '640+',
      title: 'Special Collections',
      body: 'Indigenous knowledge, sacred civilisational texts, and rare materials held for scholarship.',
    },
    {
      icon: 'fa-scroll',
      count: '48',
      title: 'Standards & Guidelines',
      body: 'Ethics, methods, IP, and repository frameworks that govern the whole collection.',
    },
  ];

  readonly services = [
    {
      icon: 'fa-book-reader',
      title: 'Read & borrow',
      body: 'Open reading for all; extended borrowing and reservations for members and students.',
    },
    {
      icon: 'fa-people-arrows',
      title: 'Interlibrary access',
      body: 'Requests routed through partner libraries and continental repository networks.',
    },
    {
      icon: 'fa-user-graduate',
      title: 'Research support',
      body: 'Librarian-led search, citation, systematic-review, and data-management guidance.',
    },
    {
      icon: 'fa-cloud-arrow-up',
      title: 'Digital access',
      body: 'Full-text, datasets, and archives available online, digital-first across the continent.',
    },
  ];

  @ViewChild('countBand')
  set countBand(ref: ElementRef<HTMLElement> | undefined) {
    if (!ref || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
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

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.search();
    }
  }

  ngOnDestroy(): void {
    this.countObserver?.disconnect();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.raf && isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.raf);
    }
  }

  get stats() {
    const c = this.counts();
    const fmt = (n: number) =>
      n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 1 : 0).replace(/\.0$/, '') + 'k' : String(n);
    return [
      { display: fmt(c[0]) + '+', label: 'Open catalogue records at SAU' },
      { display: String(c[1]), label: 'Contributing institutes' },
      { display: String(c[2]), label: 'Current deposit cycle' },
      { display: String(c[3]) + '%', label: 'Digital-first access' },
    ];
  }

  get hasFilters(): boolean {
    return (
      this.sort() !== 'relevance' ||
      this.access() !== 'any' ||
      this.lang() !== 'any' ||
      !!this.yearFrom() ||
      !!this.yearTo()
    );
  }

  get totalLabel(): string {
    const total = this.total();
    return total > 0 ? this.grp(total) + ' found' : 'Search';
  }

  get resultSummary(): string {
    if (this.loading()) {
      return 'Searching the open catalogue…';
    }
    if (this.error()) {
      return 'Catalogue temporarily unavailable';
    }
    const results = this.results();
    return results.length > 0
      ? 'Showing ' + results.length + ' of ' + this.grp(this.total()) + ' open records'
      : 'No open records found';
  }

  get hasResults(): boolean {
    return !this.loading() && !this.error() && this.results().length > 0;
  }

  get isEmpty(): boolean {
    return !this.loading() && !this.error() && this.results().length === 0;
  }

  onQuery(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.query.set(v);
    this.term = v;
    this.subject.set('');
    this.rerun();
  }

  selectSubject(s: Subject): void {
    this.subject.set(s.key);
    this.query.set('');
    this.term = s.q;
    this.search();
  }

  selectSort(key: string): void {
    this.sort.set(key);
    this.search();
  }

  selectAccess(key: string): void {
    this.access.set(key);
    this.search();
  }

  selectLang(key: string): void {
    this.lang.set(key);
    this.search();
  }

  setYearFrom(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.yearFrom.set(input.value.replace(/[^0-9]/g, '').slice(0, 4));
    this.rerun();
  }

  setYearTo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.yearTo.set(input.value.replace(/[^0-9]/g, '').slice(0, 4));
    this.rerun();
  }

  resetFilters(): void {
    this.sort.set('relevance');
    this.access.set('any');
    this.lang.set('any');
    this.yearFrom.set('');
    this.yearTo.set('');
    this.search();
  }

  retry(): void {
    this.search();
  }

  coverError(event: Event): void {
    (event.target as HTMLElement).style.display = 'none';
  }

  private grp(n: number): string {
    return Number(n).toLocaleString('en-US');
  }

  private rerun(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.search(), 260);
  }

  private search(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const base = this.term && this.term.trim() ? this.term.trim() : 'African studies';
    const parts = ['(' + base + ')'];
    const access = this.access();
    const lang = this.lang();
    if (access === 'public') {
      parts.push('ebook_access:public');
    } else if (access === 'borrowable') {
      parts.push('ebook_access:borrowable');
    }
    if (lang !== 'any') {
      parts.push('language:' + lang);
    }
    const yf = parseInt(this.yearFrom(), 10);
    const yt = parseInt(this.yearTo(), 10);
    if (!isNaN(yf) || !isNaN(yt)) {
      const a = !isNaN(yf) ? yf : 1;
      const b = !isNaN(yt) ? yt : new Date().getFullYear();
      parts.push('first_publish_year:[' + a + ' TO ' + b + ']');
    }
    const q = parts.join(' AND ');
    const sortObj = SORTS.find((s) => s.key === this.sort());
    const reqId = ++this.reqId;
    this.loading.set(true);
    this.error.set('');
    let url =
      'https://openlibrary.org/search.json?q=' +
      encodeURIComponent(q) +
      '&limit=18&fields=title,author_name,first_publish_year,cover_i,key,ebook_access';
    if (sortObj && sortObj.param) {
      url += '&sort=' + sortObj.param;
    }
    fetch(url)
      .then((r) => {
        if (!r.ok) {
          throw new Error('HTTP ' + r.status);
        }
        return r.json();
      })
      .then((d) => {
        if (reqId !== this.reqId) {
          return;
        }
        const docs: BookResult[] = (d.docs || []).map((x: any) => {
          const am = accessMeta(x.ebook_access);
          return {
            title: x.title || 'Untitled',
            author: (x.author_name && x.author_name[0]) || 'Unknown author',
            year: x.first_publish_year ? String(x.first_publish_year) : '—',
            cover: x.cover_i ? 'https://covers.openlibrary.org/b/id/' + x.cover_i + '-M.jpg' : '',
            hasCover: !!x.cover_i,
            href: 'https://openlibrary.org' + (x.key || ''),
            accessLabel: am.label,
            accessBg: am.bg,
            accessColor: am.color,
          };
        });
        this.results.set(docs);
        this.loading.set(false);
        this.total.set(d.numFound || docs.length);
      })
      .catch(() => {
        if (reqId !== this.reqId) {
          return;
        }
        this.loading.set(false);
        this.error.set(
          'We could not reach the open catalogue just now. Please check your connection and retry.',
        );
      });
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
