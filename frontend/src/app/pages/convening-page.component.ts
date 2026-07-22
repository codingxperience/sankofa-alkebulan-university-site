import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-convening-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './convening-page.component.html',
  styleUrl: './convening-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConveningPageComponent {
  readonly zoomLink =
    'https://byupw.zoom.us/j/91946284908?pwd=fO2ZnoeUVM7GJu7KpWAKeWBMxHcZbv.1';
  readonly whatsapp = 'https://wa.me/256765871126';
  readonly email = 'SanAlkeU@outlook.com';

  readonly posterShare =
    'https://wa.me/?text=' +
    encodeURIComponent(
      'The Sankofa Convening 2026 — 14–15 August, Speke Resort Munyonyo (Kampala) & online. ' +
        'Two flagship programmes launch: the Chancellor’s founding keynote and a mini-conference on ' +
        'cultural identity, indigenous knowledge, and intellectual cooperation. Free and open to all. ' +
        'Register: https://sankofa-alkebulan.university/convening',
    );

  readonly audience = [
    'Scholars & academics',
    'Government & institutional partners',
    'Students & prospective students',
    'The diaspora',
    'General public',
    'Press & media',
  ];
}
