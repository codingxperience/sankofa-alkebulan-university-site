import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Post, PostsService } from '../core/posts.service';

interface ProgrammeItem {
  readonly title: string;
  readonly when: string;
  readonly points: readonly string[];
}

const EMAIL = 'SanAlkeU@outlook.com';
const STARTS_AT = '2026-08-14T17:00:00+03:00';
const ENDS_AT = '2026-08-15T21:00:00+03:00';

function escapeCalendarText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function calendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

@Component({
  selector: 'app-convening-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './convening-page.component.html',
  styleUrl: './convening-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConveningPageComponent {
  private readonly postsService = inject(PostsService);

  readonly email = EMAIL;
  readonly startsAt = STARTS_AT;
  readonly endsAt = ENDS_AT;
  readonly ended = Date.now() > Date.parse(ENDS_AT);
  readonly news = signal<Post[]>([]);

  readonly background =
    'Sankofa Alkebulan University is founded on the Akan principle of Sankofa — to go back and retrieve what has been lost — as a method for building a stronger and more enlightened future. The Sankofa Convening opens that work to the public. Its 2026 programme brought together the university’s founding vision and a public conversation on cultural identity, indigenous knowledge and intellectual cooperation across institutions, borders and generations.';

  readonly audience = [
    'Scholars and academics',
    'Government and institutional partners',
    'Students and prospective students',
    'The diaspora',
    'The general public',
    'Press and media',
  ];

  readonly programme: readonly ProgrammeItem[] = [
    {
      title: 'The founding keynote — vision, mission and academic philosophy',
      when: 'Friday 14 August 2026 · 5:00 PM EAT',
      points: [
        'Delivered by Emmanuel Mihiingo Kaija, Founder and Chancellor',
        'The university’s vision, mission and academic philosophy',
        'The university’s strategic role in advancing African civilisational studies',
        'Held at Speke Resort, Munyonyo, with an online audience',
      ],
    },
    {
      title: 'Mini-conference — pathways for identity, knowledge and cooperation',
      when: 'Saturday 15 August 2026 · 5:00 PM EAT',
      points: [
        'Strengthening cultural identity',
        'Recognising and advancing indigenous knowledge',
        'Intellectual cooperation across institutions, borders and generations',
        'Held at Speke Resort, Munyonyo, with an online audience',
      ],
    },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.postsService
        .getLatest(4)
        .then((posts) => this.news.set(posts))
        .catch(() => this.news.set([]));
    }
  }

  addToCalendar(): void {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sankofa Alkebulan University//Events//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:sankofa-convening-2026@sankofa-alkebulan-university',
      `DTSTAMP:${calendarDate(new Date())}`,
      `DTSTART:${calendarDate(new Date(this.startsAt))}`,
      `DTEND:${calendarDate(new Date(this.endsAt))}`,
      'SUMMARY:The Sankofa Convening 2026',
      'LOCATION:Speke Resort, Munyonyo, Kampala, Uganda',
      `DESCRIPTION:${escapeCalendarText('Cultural Identity, Indigenous Knowledge and Intellectual Cooperation')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sankofa-convening-2026.ics';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  shareOnWhatsApp(): void {
    const text = encodeURIComponent(
      `The Sankofa Convening 2026 — Cultural Identity, Indigenous Knowledge and Intellectual Cooperation. ${window.location.href}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }
}
