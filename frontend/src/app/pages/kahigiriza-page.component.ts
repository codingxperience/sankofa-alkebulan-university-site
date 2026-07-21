import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-kahigiriza-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './kahigiriza-page.component.html',
  styleUrl: './kahigiriza-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KahigirizaPageComponent {
  readonly pieces = [
    { t: 'Benin Bronze Head', m: 'Gallery II · Edition of 50', img: 'assets/store/benin-bronze-head.jpg', pos: '22% 50%' },
    { t: 'Ashanti Gold Mask', m: 'Gallery I · Edition of 25', img: 'assets/store/ashanti-gold-mask.jpg', pos: '20% 50%' },
    { t: 'Kongo Power Figure', m: 'Gallery II · Edition of 40', img: 'assets/store/kongo-power-figure.jpg', pos: '32% 45%' },
    { t: 'Nok Terracotta Figure', m: 'Gallery III · Edition of 36', img: 'assets/store/nok-terracotta.jpg', pos: '40% 45%' },
  ];

  readonly tours = [
    {
      t: 'Kahigiriza Memorial',
      d: 'The physical galleries — the Enganzi era, Nkore statecraft, and the Kahigiriza legacy, guided by History students.',
      kind: 'In person', icon: 'fa-landmark', time: '90 min', access: 'Pass or ticket', tone: 'dark',
    },
    {
      t: 'Virtual Great Zimbabwe',
      d: 'Walk the stone city at dusk — a VR reconstruction researched with the archaeology unit and built by ICT students.',
      kind: 'VR tour', icon: 'fa-vr-cardboard', time: '25 min', access: 'Included in pass', tone: 'light',
    },
    {
      t: 'Virtual Timbuktu',
      d: 'The manuscript libraries of Sankoré — page through digitized folios and hear them read in the original.',
      kind: 'VR tour', icon: 'fa-scroll', time: '25 min', access: 'Included in pass', tone: 'light',
    },
  ];

  readonly visit = [
    { icon: 'fa-clock', t: 'Hours', d: 'Tuesday–Sunday, 9:00–17:00. Last entry 16:00. Closed Mondays for conservation.' },
    { icon: 'fa-ticket', t: 'Admission', d: 'Museum Pass $18 — includes both virtual tours. School groups free on Wednesdays.' },
    { icon: 'fa-location-dot', t: 'Getting here', d: 'SAU campus estate, Mbarara. Boda stage at the main gate; parking at the memorial forecourt.' },
    { icon: 'fa-universal-access', t: 'Access', d: 'Step-free galleries, seated VR stations, and tours in Runyankore, Swahili, and English.' },
  ];
}
