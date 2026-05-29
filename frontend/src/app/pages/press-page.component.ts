import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface SideLink {
  readonly label: string;
  readonly target: string;
  readonly count?: string;
}

interface PressStat {
  readonly value: string;
  readonly label: string;
}

interface TimelineItem {
  readonly date: string;
  readonly title: string;
  readonly summary: string;
  readonly image: string;
}

interface PressRelease {
  readonly date: string;
  readonly type: string;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
}

interface GalleryImage {
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly shape: 'wide' | 'tall' | 'portrait';
}

interface VideoItem {
  readonly title: string;
  readonly date: string;
  readonly source: string;
  readonly poster: string;
  readonly summary: string;
  readonly duration: string;
}

interface PublicationItem {
  readonly title: string;
  readonly category: string;
  readonly date: string;
  readonly summary: string;
  readonly cover: string;
  readonly pdf: string;
}

interface SourceNote {
  readonly label: string;
  readonly href: string;
  readonly summary: string;
}

@Component({
  selector: 'app-press-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './press-page.component.html',
  styleUrl: './press-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PressPageComponent {
  readonly sideLinks: readonly SideLink[] = [
    { label: 'News releases', target: '#latest', count: '54' },
    { label: 'Field dispatches', target: '#feature', count: '12' },
    { label: 'Picture gallery', target: '#gallery', count: '248' },
    { label: 'Films', target: '#films', count: '9' },
    { label: 'Publications', target: '#publications', count: '13' },
    { label: 'Source notes', target: '#sources', count: '-' },
  ];

  readonly stats: readonly PressStat[] = [
    { value: '54', label: 'releases and advisories this year' },
    { value: '13', label: 'publication files indexed on the shelf' },
    { value: '2014', label: 'year the press desk was established' },
  ];

  readonly chronology: readonly TimelineItem[] = [
    {
      date: '20 May 2026',
      title: 'Courtesy calls and arrival documentation',
      summary:
        'SAU field material records early diplomatic conversations, institutional arrival moments, and delegate preparation before the main convention window.',
      image: '/assets/press/images/uganda-flag-meeting.webp',
    },
    {
      date: '21-23 May 2026',
      title: 'Tourism, trade, and destination dialogue',
      summary:
        'The press desk tracks POATE 2026 alongside the convention because tourism, enterprise, culture, and academic diplomacy meet inside the same national week.',
      image: '/assets/press/images/speke-arrival-delegates.webp',
    },
    {
      date: '22 May 2026',
      title: 'Pan-African diaspora economic forum',
      summary:
        'Coverage from Speke Resort records diaspora investment language, continental partnership talk, and the ceremony of convening African publics together.',
      image: '/assets/press/images/diaspora-economic-forum-stage.webp',
    },
    {
      date: '25 May 2026',
      title: 'Liberation Day field note and publication table',
      summary:
        'The closing archive moves from procession to books: public memory, scholarship, and African thought presented as living institutional work.',
      image: '/assets/press/images/liberation-day-procession.webp',
    },
  ];

  readonly releases: readonly PressRelease[] = [
    {
      date: '25 May 2026',
      type: 'Field Dispatch',
      title: 'SAU Press Desk Archives Pan-African Convention Week in Kampala',
      summary:
        'A visual and editorial record from May 20-25 covering arrival diplomacy, diaspora economic dialogue, cultural diplomacy, publication tables, and Liberation Day movement.',
      href: '#feature-article',
    },
    {
      date: '23 May 2026',
      type: 'Tourism Note',
      title: 'POATE 2026 Adds Tourism, Trade, and Community-Led Development to the Week',
      summary:
        'The University Press situates the tourism expo as a public scholarship case in sustainable, inclusive, and community-led tourism futures.',
      href: '#sources',
    },
    {
      date: '22 May 2026',
      type: 'Media Advisory',
      title: 'Diaspora Economic and Investment Forum Signals a Practical Partnership Agenda',
      summary:
        'Speke Resort field images and notes point to a convention language of capital, culture, return, and continental institution-building.',
      href: '#gallery',
    },
    {
      date: '10 Apr 2026',
      type: 'Publication',
      title: 'Pan-African Mobilization in a Fragmented Global Order Enters the Archive',
      summary:
        'A 355-page work anchors the current press library around history, theory, governance, political economy, and future strategic pathways.',
      href: '/assets/press/publications/pan-african-mobilization.pdf',
    },
    {
      date: '08 Apr 2026',
      type: 'Education Series',
      title: 'Children and Youth Formation Series Added to the University Press Shelf',
      summary:
        'Brain power, bravery, strength, kindness, mistakes, and curiosity are catalogued as early learning resources for family and classroom formation.',
      href: '#publications',
    },
    {
      date: '06 Apr 2026',
      type: 'Research Library',
      title: 'Health Sciences and Industrial Hemp Titles Catalogued',
      summary:
        'The library expands across anatomy and physiology, agro-ecology, market potential, sustainability, and applied research needs in Uganda.',
      href: '#publications',
    },
  ];

  readonly gallery: readonly GalleryImage[] = [
    {
      src: '/assets/press/images/convention-group-photo-wide.webp',
      alt: 'Delegates gathered for a group photograph at the Pan-African convention.',
      caption: 'Convention group portrait at Speke Resort.',
      shape: 'wide',
    },
    {
      src: '/assets/press/images/diaspora-economic-forum-stage.webp',
      alt: 'Delegate seated in front of Pan African Diaspora Economic and Investment Forum backdrop.',
      caption: 'Diaspora Economic and Investment Forum.',
      shape: 'portrait',
    },
    {
      src: '/assets/press/images/speke-arrival-delegates.webp',
      alt: 'Delegates at Speke Resort Convention Centre.',
      caption: 'Arrival moments at the convention centre.',
      shape: 'tall',
    },
    {
      src: '/assets/press/images/convention-delegates-ballroom.webp',
      alt: 'Convention delegates standing in a ballroom.',
      caption: 'Formal delegate portrait.',
      shape: 'wide',
    },
    {
      src: '/assets/press/images/publication-table-african-thought.webp',
      alt: 'African thought publications arranged on a table.',
      caption: 'SAU publication table.',
      shape: 'portrait',
    },
    {
      src: '/assets/press/images/liberation-day-procession.webp',
      alt: 'People walking together during Liberation Day activities.',
      caption: 'Liberation Day movement through Kampala.',
      shape: 'portrait',
    },
    {
      src: '/assets/press/images/diplomacy-courtesy-call.webp',
      alt: 'Two leaders photographed during a courtesy call.',
      caption: 'Diplomatic courtesy call.',
      shape: 'portrait',
    },
    {
      src: '/assets/press/images/publication-table-delegates.webp',
      alt: 'Delegates standing near a table of publications.',
      caption: 'Books, readers, and field dialogue.',
      shape: 'portrait',
    },
  ];

  readonly videos: readonly VideoItem[] = [
    {
      title: 'Pan-African Convention Field Note',
      date: '20 May 2026',
      source: '/assets/press/videos/pan-african-convention-field-note.mp4',
      poster: '/assets/press/images/speke-arrival-delegates.webp',
      summary: 'A short field clip from the convention week archive.',
      duration: '02:14',
    },
    {
      title: 'Liberation Day Field Note 01',
      date: '25 May 2026',
      source: '/assets/press/videos/liberation-day-field-note-01.mp4',
      poster: '/assets/press/images/liberation-day-procession.webp',
      summary: 'A compact record from the public procession archive.',
      duration: '01:48',
    },
    {
      title: 'Liberation Day Field Note 02',
      date: '25 May 2026',
      source: '/assets/press/videos/liberation-day-field-note-02.mp4',
      poster: '/assets/press/images/convention-group-photo-stage.webp',
      summary: 'Additional movement and delegate material from the field desk.',
      duration: '02:36',
    },
    {
      title: 'Publication Table Field Note',
      date: '25 May 2026',
      source: '/assets/press/videos/publication-table-field-note.mp4',
      poster: '/assets/press/images/publication-table-african-thought.webp',
      summary: 'Books, readers, and public scholarship presented in context.',
      duration: '03:02',
    },
  ];

  readonly publications: readonly PublicationItem[] = [
    {
      title: 'God of AI: African Digital Futures',
      category: 'Technology and Society',
      date: 'April 2026',
      summary:
        'Artificial intelligence, power, governance, digital control, and African futures placed in one public intellectual frame.',
      cover: '/assets/press/covers/god-of-ai-african-digital-futures.webp',
      pdf: '/assets/press/publications/god-of-ai-african-digital-futures.pdf',
    },
    {
      title: 'Pan-African Mobilization in a Fragmented Global Order',
      category: 'Pan-African Strategy',
      date: '10 April 2026',
      summary:
        'Historical foundations, mobilization theory, political economy, governance, security, and strategic continental pathways.',
      cover: '/assets/press/covers/pan-african-mobilization.webp',
      pdf: '/assets/press/publications/pan-african-mobilization.pdf',
    },
    {
      title: 'African Philosophy',
      category: 'African Knowledge Systems',
      date: 'April 2026',
      summary:
        'Cosmology, epistemology, personhood, ethics, law, justice, indigenous economics, and modern African thought.',
      cover: '/assets/press/covers/african-philosophy.webp',
      pdf: '/assets/press/publications/african-philosophy.pdf',
    },
    {
      title: 'Beneath the Quiet Skin',
      category: 'Scholarly Monograph',
      date: '2025',
      summary:
        'A long-form educational and scholarly work by Emmanuel Mihiingo Kaija, published in Uganda and catalogued for the press shelf.',
      cover: '/assets/press/covers/beneath-the-quiet-skin.webp',
      pdf: '/assets/press/publications/beneath-the-quiet-skin.pdf',
    },
    {
      title: 'Industrial Hemp in Uganda',
      category: 'Agro-Ecology and Markets',
      date: '06 April 2026',
      summary:
        'Botany, agro-ecology, propagation, market potential, sustainability, pilot projects, and future research needs.',
      cover: '/assets/press/covers/industrial-hemp-in-uganda.webp',
      pdf: '/assets/press/publications/industrial-hemp-in-uganda.pdf',
    },
    {
      title: 'Strategic Defense Mobilization in Africa',
      category: 'Security and Governance',
      date: '07 April 2026',
      summary:
        'National security, strategic mobilization, training, technology, regional stability, logistics, and policy recommendations.',
      cover: '/assets/press/covers/strategic-defense-mobilization-africa.webp',
      pdf: '/assets/press/publications/strategic-defense-mobilization-africa.pdf',
    },
    {
      title: 'Anatomy and Physiology',
      category: 'Health Sciences',
      date: '06 April 2026',
      summary:
        'A full health sciences teaching text covering cells, tissues, organs, body systems, development, genetics, and references.',
      cover: '/assets/press/covers/anatomy-and-physiology.webp',
      pdf: '/assets/press/publications/anatomy-and-physiology.pdf',
    },
    {
      title: 'Curiosity Unlocks Potential',
      category: 'Children and Youth Formation',
      date: '08 April 2026',
      summary:
        'A learner-centered title on discovery, feelings, friendship, helpfulness, and steady growth for young readers.',
      cover: '/assets/press/covers/curiosity-unlocks-potential.webp',
      pdf: '/assets/press/publications/curiosity-unlocks-potential.pdf',
    },
  ];

  readonly sourceNotes: readonly SourceNote[] = [
    {
      label: 'AIDO Network International',
      href: 'https://www.aidonetwork.com/',
      summary:
        'Official event context for the 8th Pan-African Convention in Uganda, including the AIDO conference, Royal Summit, diaspora economic forum, awards, banquet, and African Liberation Day celebrations.',
    },
    {
      label: 'Uganda Tourism Board - About POATE',
      href: 'https://utb.go.ug/poate/',
      summary:
        'Official UTB context for POATE as an annual tourism and travel trade show, with the 2026 edition hosted at Speke Resort Monyonyo from 21-23 May 2026.',
    },
    {
      label: 'Official POATE 2026 Website',
      href: 'https://www.poate.co.ug/',
      summary:
        'The official POATE 2026 site describes the event as the Uganda Tourism Board platform for the Pearl of Africa Tourism Expo.',
    },
  ];
}
