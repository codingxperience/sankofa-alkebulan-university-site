import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const COURSES = [
  { id: 'gov', t: 'Pre-Colonial Governance', track: 'Governance', icon: 'fa-landmark', color: '#b35c2a', tint: 'rgba(179,92,42,0.10)', d: 'Enganzi councils, Mali’s kurukan fuga, and consensus systems — statecraft before the Berlin lines.', weeks: '6 weeks', lessons: '18 lessons', p: 40 },
  { id: 'run', t: 'Runyankore for Diaspora', track: 'Language', icon: 'fa-comments', color: '#1f7a4d', tint: 'rgba(31,122,77,0.10)', d: 'Speak home again — greetings, kinship, proverbs, and the Okwevuga praise tradition.', weeks: '8 weeks', lessons: '24 lessons', p: 30 },
  { id: 'swa', t: 'Swahili Tech Terms', track: 'Language', icon: 'fa-microchip', color: '#086b83', tint: 'rgba(8,107,131,0.10)', d: 'The working vocabulary of East African tech — product, code, and boardroom Swahili.', weeks: '4 weeks', lessons: '12 lessons', p: 25 },
  { id: 'cur', t: 'Curriculum for Cultural Relevance', track: 'Education', icon: 'fa-chalkboard-user', color: '#0f4c81', tint: 'rgba(15,76,129,0.10)', d: 'The SAU Press framework as a taught course — rebuild a syllabus, assessed by Education faculty.', weeks: '5 weeks', lessons: '15 lessons', p: 45 },
  { id: 'seed', t: 'Indigenous Seed Systems', track: 'Agriculture', icon: 'fa-seedling', color: '#1f7a4d', tint: 'rgba(31,122,77,0.10)', d: 'Enkungu, fonio, and teff — save, plant, and breed with the Agriculture institute’s seed bank.', weeks: '6 weeks', lessons: '16 lessons', p: 35 },
  { id: 'pharm', t: 'Pharmacopeia Foundations', track: 'Medicine', icon: 'fa-mortar-pestle', color: '#a03a52', tint: 'rgba(160,58,82,0.10)', d: 'Traditional medicine as evidence — methods, ethics, and the certified herbal kit protocols.', weeks: '7 weeks', lessons: '20 lessons', p: 40 },
];

const STEPS = [
  { n: '01', t: 'Learn free', d: 'Every vault opens with free lessons — no card, no wall. Study on any device; your progress lives on African servers.' },
  { n: '02', t: 'Pass the assessment', d: 'A practical assessment marked against the institute’s rubric — resubmit as often as you need.' },
  { n: '03', t: 'Certify — $20', d: 'A verified certificate with a public check URL, recognised by SAU and partner universities.' },
];

@Component({
  selector: 'app-knowledge-vault-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './knowledge-vault-page.component.html',
  styleUrl: './knowledge-vault-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeVaultPageComponent {
  readonly courses = COURSES;
  readonly steps = STEPS;
  readonly enrolled = signal<Record<string, boolean>>({});

  toggle(id: string): void {
    this.enrolled.update((e) => ({ ...e, [id]: !e[id] }));
  }

  isOn(id: string): boolean {
    return !!this.enrolled()[id];
  }
}
