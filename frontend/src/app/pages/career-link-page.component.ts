import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const CATS: Record<string, { label: string; color: string; tint: string }> = {
  au: { label: 'AU & multilaterals', color: '#0f4c81', tint: 'rgba(15,76,129,0.10)' },
  startup: { label: 'Startups', color: '#b35c2a', tint: 'rgba(179,92,42,0.10)' },
  eng: { label: 'Engineering', color: '#086b83', tint: 'rgba(8,107,131,0.10)' },
  policy: { label: 'Policy & research', color: '#1f7a4d', tint: 'rgba(31,122,77,0.10)' },
};

const ROLES = [
  { id: 1, t: 'Programme Officer, Agenda 2063', org: 'African Union Commission', abbr: 'AU', loc: 'Addis Ababa', pay: '$3.2k–4.1k / mo', posted: '2 days ago', cat: 'au' },
  { id: 2, t: 'Investment Analyst, Energy', org: 'African Development Bank', abbr: 'AfDB', loc: 'Abidjan · hybrid', pay: '$3.8k–4.6k / mo', posted: '4 days ago', cat: 'au' },
  { id: 3, t: 'Product Engineer, Payments', org: 'Flutterwave', abbr: 'FLW', loc: 'Lagos · remote', pay: '$2.4k–3.6k / mo', posted: '1 week ago', cat: 'eng' },
  { id: 4, t: 'Agronomy Lead, Seed Systems', org: 'One Acre Fund', abbr: 'OAF', loc: 'Kigali', pay: '$1.9k–2.6k / mo', posted: '3 days ago', cat: 'policy' },
  { id: 5, t: 'Founding Engineer, Solar Grid', org: 'Zembo Mobility', abbr: 'ZM', loc: 'Kampala', pay: 'Equity + $1.8k / mo', posted: '5 days ago', cat: 'startup' },
  { id: 6, t: 'Trade Policy Researcher, AfCFTA', org: 'UNECA', abbr: 'ECA', loc: 'Addis Ababa · remote', pay: '$2.8k–3.4k / mo', posted: '1 week ago', cat: 'policy' },
  { id: 7, t: 'Swahili NLP Engineer', org: 'Jacaranda Health', abbr: 'JH', loc: 'Nairobi', pay: '$2.6k–3.2k / mo', posted: '6 days ago', cat: 'eng' },
  { id: 8, t: 'Growth Lead, Diaspora Remittance', org: 'Chipper Cash', abbr: 'CC', loc: 'Accra · remote', pay: '$2.9k–3.8k / mo', posted: '2 weeks ago', cat: 'startup' },
];

const FILTERS = [
  ['all', 'All roles'],
  ['au', 'AU & multilaterals'],
  ['startup', 'Startups'],
  ['eng', 'Engineering'],
  ['policy', 'Policy & research'],
] as const;

@Component({
  selector: 'app-career-link-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './career-link-page.component.html',
  styleUrl: './career-link-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerLinkPageComponent {
  readonly filters = FILTERS;
  readonly filter = signal('all');
  readonly applied = signal<Record<number, boolean>>({});

  readonly roles = computed(() =>
    ROLES.filter((r) => this.filter() === 'all' || r.cat === this.filter()).map((r) => ({
      ...r,
      catLabel: CATS[r.cat].label,
      color: CATS[r.cat].color,
      tint: CATS[r.cat].tint,
      on: !!this.applied()[r.id],
    })),
  );

  toggleApply(id: number): void {
    this.applied.update((a) => ({ ...a, [id]: !a[id] }));
  }
}
