import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Post, PostsService } from '../core/posts.service';

interface ProgrammeItem {
  readonly title: string;
  readonly points: readonly string[];
  readonly links?: readonly { readonly label: string; readonly href: string; readonly external?: boolean }[];
}

const ZOOM = 'https://byupw.zoom.us/j/91946284908?pwd=fO2ZnoeUVM7GJu7KpWAKeWBMxHcZbv.1';
const WHATSAPP = 'https://wa.me/256765871126';
const EMAIL = 'SanAlkeU@outlook.com';

/** When the second day's programme is over; after it, the page speaks of the Convening in the past. */
const ENDS_AT = Date.parse('2026-08-15T21:00:00+03:00');

@Component({
  selector: 'app-convening-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './convening-page.component.html',
  styleUrl: './convening-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConveningPageComponent {
  private readonly posts = inject(PostsService);

  readonly zoomLink = ZOOM;
  readonly whatsapp = WHATSAPP;
  readonly email = EMAIL;
  readonly ended = Date.now() > ENDS_AT;

  readonly posterShare =
    'https://wa.me/?text=' +
    encodeURIComponent(
      'The Sankofa Convening 2026 — 14–15 August, Speke Resort Munyonyo (Kampala) & online. ' +
        'Two flagship programmes launch: the Chancellor’s founding keynote and a mini-conference on ' +
        'cultural identity, indigenous knowledge, and intellectual cooperation. Free and open to all. ' +
        'Register: https://sankofa-alkebulan.university/convening',
    );

  readonly schedule = [
    { activity: 'Founding keynote — Emmanuel Mihiingo Kaija', when: 'Fri 14 August 2026 · 5:00 PM EAT' },
    { activity: 'Mini-conference — identity, knowledge and cooperation', when: 'Sat 15 August 2026 · 5:00 PM EAT' },
    { activity: 'Online start for the United States East Coast', when: '10:00 AM EDT, both days' },
    { activity: 'Registration closes', when: 'Sat 15 August 2026 · 5:00 PM EAT' },
    { activity: 'Convening dates', when: '14th – 15th August 2026' },
  ];

  readonly programme: readonly ProgrammeItem[] = [
    {
      title: 'Programme 1: The founding keynote — vision, mission and academic philosophy',
      points: [
        'Delivered by Emmanuel Mihiingo Kaija, Founder & Chancellor',
        'The university’s vision, mission and academic philosophy',
        'Its strategic role in advancing African civilisational studies',
        'Friday 14 August · 5:00 PM EAT (10:00 AM EDT)',
        'At Speke Resort, Munyonyo, and streamed live on Zoom',
      ],
    },
    {
      title: 'Programme 2: Mini-conference — pathways for identity, knowledge and cooperation',
      points: [
        'Strengthening cultural identity',
        'Indigenous knowledge',
        'Intellectual cooperation across institutions, borders and generations',
        'Saturday 15 August · 5:00 PM EAT (10:00 AM EDT)',
      ],
    },
    {
      title: 'Attend in person: Speke Resort, Munyonyo',
      points: [
        'Speke Resort, Munyonyo — Kampala, Uganda',
        'Both days begin at 5:00 PM EAT (10:00 AM EDT)',
        'Entry is free; registering helps us seat you',
      ],
    },
    {
      title: 'Join online: live on Zoom',
      points: ['Both programmes stream live on Zoom', 'One link for both days — the passcode is built into it', 'Meeting ID: 919 4628 4908'],
      links: [{ label: 'Open the Zoom link', href: ZOOM, external: true }],
    },
    {
      title: 'RSVP and questions',
      points: ['Write to the convening desk, or message us on WhatsApp'],
      links: [
        { label: EMAIL, href: `mailto:${EMAIL}` },
        { label: 'WhatsApp +256 765 871 126', href: WHATSAPP, external: true },
      ],
    },
  ];

  readonly audience = [
    'Scholars & academics',
    'Government & institutional partners',
    'Students & prospective students',
    'The diaspora',
    'General public',
    'Press & media',
  ];

  /** The newest journal articles, fetched in the browser; the section stays hidden without them. */
  readonly news = signal<Post[]>([]);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.posts
        .getLatest(3)
        .then((posts) => this.news.set(posts))
        .catch(() => this.news.set([]));
    }
  }
}
