import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { FooterComponent } from './footer.component';
import { LanguageSwitcherComponent } from './language-switcher.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LanguageSwitcherComponent],
  template: `
    <app-header></app-header>

    <main class="main">
      <router-outlet></router-outlet>
    </main>

    <app-footer></app-footer>
    <app-language-switcher></app-language-switcher>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      min-height: 100vh;
    }

    .main {
      flex: 1 0 auto;
      width: 100%;
      min-width: 0;
      min-height: calc(100vh - 220px);
      background-color: var(--background-color);
    }
  `]
})
export class LayoutComponent {}
