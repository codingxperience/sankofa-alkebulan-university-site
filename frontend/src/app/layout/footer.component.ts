import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container">
        <section class="footer-primary" aria-label="Sankofa Alkebulan University footer">
          <div class="footer-identity">
            <span class="footer-logo-mark">
              <img
                src="/assets/branding/sankofa_university_logo-remove-background.com.png"
                alt="Sankofa Alkebulan University logo"
              />
            </span>
            <div>
              <p class="footer-kicker">Sankofa Alkebulan University</p>
              <h3>Pan-African scholarship for a changing world.</h3>
              <p>
                A modern university experience for study, research, leadership, and public
                impact across Africa and the global academy.
              </p>
            </div>
          </div>
        </section>

        <nav class="footer-nav" aria-label="Footer navigation">
          <section>
            <h4>Study</h4>
            <a routerLink="/admissions">Admissions</a>
            <a routerLink="/programs">Programs</a>
            <a routerLink="/faculties-schools">Faculties and Schools</a>
            <span class="footer-disabled">Virtual Campus</span>
          </section>

          <section>
            <h4>Research</h4>
            <a routerLink="/research-innovation">Research Institutes</a>
            <a routerLink="/library-repository">Library Repository</a>
            <a routerLink="/university-press">University Press</a>
            <a routerLink="/ai-advanced-tools">AI and Advanced Tools</a>
          </section>

          <section>
            <h4>University</h4>
            <a routerLink="/about">About</a>
            <a routerLink="/governance-compliance">Governance</a>
            <a routerLink="/sustainability">Sustainability</a>
            <a routerLink="/emergency-safety">Emergency and Safety</a>
          </section>

          <section>
            <h4>Connect</h4>
            <span class="footer-disabled">Events</span>
            <a routerLink="/partnerships-global">Partnerships</a>
            <span class="footer-disabled">Media</span>
            <a href="mailto:sankofalkebulanuniversity@outlook.com">
              sankofalkebulanuniversity@outlook.com
            </a>
          </section>
        </nav>

        <div class="footer-bottom">
          <p>&copy; 2026 Sankofa Alkebulan University.</p>
          <p>Return to knowledge. Restore possibility. Reimagine the future.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
    }

    .site-footer {
      position: relative;
      overflow: hidden;
      margin-top: auto;
      background:
        radial-gradient(circle at 8% 0%, rgb(212 162 47 / 12%), transparent 22rem),
        radial-gradient(circle at 92% 12%, rgb(47 125 184 / 13%), transparent 24rem),
        linear-gradient(180deg, #08243a 0%, #051b2c 100%);
      color: #d9e9f6;
      border-top: 1px solid rgb(255 255 255 / 8%);
    }

    .site-footer::before {
      content: 'Sankofa';
      position: absolute;
      right: -0.08em;
      bottom: -0.28em;
      color: rgb(255 255 255 / 15%);
      font-family: var(--font-family-heading);
      font-size: clamp(7rem, 22vw, 20rem);
      font-weight: 800;
      letter-spacing: -0.08em;
      pointer-events: none;
      white-space: nowrap;
    }

    .site-footer > .container {
      position: relative;
      z-index: 1;
      max-width: 1480px;
      padding-top: 2.4rem;
      padding-bottom: 1.2rem;
    }

    .footer-primary {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
      align-items: end;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
    }

    .footer-identity {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr);
      gap: 1.2rem;
      align-items: center;
      min-width: 0;
    }

    .footer-logo-mark {
      display: grid;
      place-items: center;
      width: 150px;
      min-height: 150px;
      padding: 0.35rem;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    .footer-logo-mark img {
      width: 100%;
      height: auto;
      display: block;
      filter:
        drop-shadow(0 16px 28px rgb(255 255 255 / 14%))
        drop-shadow(0 8px 16px rgb(0 0 0 / 45%));
      opacity: 1;
    }

    .footer-kicker {
      margin: 0 0 0.55rem;
      color: #f1cf83;
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    h3 {
      max-width: 16ch;
      margin: 0;
      color: #ffffff;
      font-family: var(--font-family-heading);
      font-size: clamp(2.1rem, 4.2vw, 4.25rem);
      line-height: 0.96;
      letter-spacing: -0.045em;
      text-wrap: balance;
    }

    .footer-identity p:not(.footer-kicker) {
      max-width: 42rem;
      margin: 0.75rem 0 0;
      color: #aac3d8;
      font-size: 1rem;
      line-height: 1.62;
    }

    .footer-nav {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1.1rem;
      padding: 2rem 0;
    }

    .footer-nav section {
      min-width: 0;
      padding-top: 1rem;
      border-top: 1px solid rgb(255 255 255 / 10%);
    }

    h4 {
      margin: 0 0 0.8rem;
      color: #ffffff;
      font-family: var(--font-family-heading);
      font-size: 1rem;
      letter-spacing: -0.01em;
    }

    .footer-nav a,
    .footer-disabled {
      position: relative;
      display: block;
      width: fit-content;
      max-width: 100%;
      margin-top: 0.52rem;
      color: #bdd8ed;
      text-decoration: none;
      overflow-wrap: anywhere;
      transition: color 160ms ease, transform 160ms ease;
    }

    .footer-disabled {
      opacity: 0.58;
      cursor: default;
    }

    .footer-nav a::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -0.16rem;
      height: 1px;
      background: #d4a22f;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 180ms ease;
    }

    .footer-nav a:hover {
      color: #ffffff;
      transform: translateX(2px);
    }

    .footer-nav a:hover::after {
      transform: scaleX(1);
    }

    .footer-bottom {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.65rem;
      padding-top: 1rem;
      border-top: 1px solid rgb(255 255 255 / 10%);
      color: #91aec5;
      font-size: 0.84rem;
    }

    .footer-bottom p {
      margin: 0;
      overflow-wrap: anywhere;
    }

    @media (max-width: 980px) {
      .footer-primary {
        grid-template-columns: 1fr;
        align-items: start;
      }

      .footer-nav {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .site-footer > .container {
        padding-top: 1.45rem;
      }

      .footer-primary {
        gap: 1.2rem;
        padding-bottom: 1.45rem;
      }

      .footer-identity {
        grid-template-columns: 108px minmax(0, 1fr);
        gap: 0.85rem;
        align-items: start;
      }

      .footer-logo-mark {
        width: 108px;
        min-height: 108px;
        border-radius: 0;
      }

      .footer-logo-mark img {
        width: 100%;
      }

      .footer-kicker {
        margin-bottom: 0.45rem;
        font-size: 0.66rem;
        letter-spacing: 0.13em;
      }

      h3 {
        max-width: 12ch;
        font-size: clamp(1.85rem, 9.4vw, 2.55rem);
        line-height: 0.98;
      }

      .footer-identity p:not(.footer-kicker) {
        grid-column: 1 / -1;
        margin-top: 0.2rem;
        font-size: 0.92rem;
      }

      .footer-nav {
        grid-template-columns: 1fr;
        gap: 0;
        padding: 1.4rem 0;
      }

      .footer-nav section {
        padding: 1rem 0;
      }

      .footer-bottom {
        display: grid;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
