import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The navy half of every sign-in screen: the crest, a sentence about the console, the motto. */
@Component({
  selector: 'sc-auth-panel',
  imports: [NgOptimizedImage],
  template: `
    <a class="sc-auth__mark" href="/">
      <img ngSrc="/assets/design/crest-112.png" width="52" height="52" alt="" priority />
      <div>
        <strong>Sankofa Alkebulan University</strong>
        <span>Console</span>
      </div>
    </a>
    <div class="sc-auth__words">
      <p class="sc-auth__headline">{{ heading() }}</p>
      <p>{{ text() }}</p>
    </div>
    <p class="sc-auth__motto">Return · Restore · Reimagine</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sc-auth__panel', role: 'complementary', 'aria-label': 'About the console' },
})
export class AuthPanel {
  readonly heading = input('Everything that arrives, in one daybook.');
  readonly text = input(
    'Messages to the seven offices, applications, registrations and orders — gathered for the people who answer them, with a record of every decision.',
  );
}
