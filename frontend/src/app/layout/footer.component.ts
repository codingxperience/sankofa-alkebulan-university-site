import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container footer-shell">
        <section class="footer-intro" aria-label="Sankofa Alkebulan University footer">
          <a routerLink="/home" class="footer-logo" aria-label="Sankofa Alkebulan University home">
            <img src="/assets/design/logo-primary.png" alt="Sankofa Alkebulan University logo" />
          </a>
          <div>
            <p class="footer-kicker">Sankofa Alkebulan University</p>
            <h2>A continental research university advancing African scholarship.</h2>
            <p>
              Independent, multidisciplinary, public-spirited. Founded on the Akan principle of Sankofa.
            </p>
          </div>
        </section>

        <nav class="footer-nav" aria-label="Footer navigation">
          <section>
            <h3>Study</h3>
            <a routerLink="/home/bachelors">Undergraduate</a>
            <a routerLink="/home/masters">Postgraduate</a>
            <a routerLink="/home/phd">Doctoral</a>
            <a routerLink="/admissions">Apply now</a>
            <a routerLink="/faculties-schools">Course catalogue</a>
          </section>

          <section>
            <h3>Research</h3>
            <a routerLink="/research-innovation">Institutes</a>
            <a routerLink="/research-innovation">Projects</a>
            <a routerLink="/library-repository">Publications</a>
            <a routerLink="/events-conferences">Open science</a>
            <a routerLink="/services">Funding portal</a>
          </section>

          <section>
            <h3>University</h3>
            <a routerLink="/about">About</a>
            <a routerLink="/about/executive-team">Leadership</a>
            <a routerLink="/about/sankofa-charter">Charter</a>
            <a routerLink="/events-conferences">Annual reports</a>
            <a routerLink="/events-conferences">Press</a>
          </section>

          <section>
            <h3>Connect</h3>
            <a routerLink="/contact">Contact</a>
            <a routerLink="/student-life">Student life</a>
            <a routerLink="/admissions">Apply now</a>
            <a href="mailto:SanAlkeU@outlook.com">SanAlkeU@outlook.com</a>
            <div class="footer-social" aria-label="Social links">
              <a href="https://www.facebook.com/share/18epzuCc9P/" target="_blank" rel="noopener">Facebook</a>
              <a href="https://x.com/Kaija1133706" target="_blank" rel="noopener">X</a>
              <a href="https://www.tiktok.com/@salkebulaniversity?_r=1&_t=ZS-961VzQ09pfZ" target="_blank" rel="noopener">TikTok</a>
              <a href="https://youtube.com/@sankofalkebulaniversity?si=5ObT7pysdzPSeTHN" target="_blank" rel="noopener">YouTube</a>
              <a href="https://www.linkedin.com/in/sankofa-alkebulan-university-b177a03a9?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener">LinkedIn</a>
              <a href="https://chat.whatsapp.com/Dv2lTXXzhfMDf6sClAxpEP" target="_blank" rel="noopener">WhatsApp</a>
            </div>
          </section>
        </nav>

        <p class="footer-motto">Return. <span>Restore.</span> Reimagine.</p>

        <div class="footer-bottom">
          <p>&copy; 2026 Sankofa Alkebulan University. All rights reserved.</p>
          <nav aria-label="Footer legal links">
            <a routerLink="/about/university-policies">Privacy</a>
            <a routerLink="/services">Accessibility</a>
            <a routerLink="/about/sankofa-charter">Charter</a>
            <a routerLink="/contact">Cookies</a>
          </nav>
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
      border-top: 1px solid rgb(15 76 129 / 10%);
      background:
        radial-gradient(circle at 10% 0%, rgb(212 162 47 / 10%), transparent 18rem),
        linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
      color: #0a2d49;
    }

    .site-footer::before {
      content: 'Sankofa';
      position: absolute;
      left: 50%;
      bottom: 1.4rem;
      transform: translateX(-50%);
      color: rgb(15 76 129 / 12%);
      font-family: var(--font-family-heading);
      font-size: clamp(7rem, 22vw, 20rem);
      font-weight: 900;
      letter-spacing: -0.09em;
      line-height: 0.7;
      pointer-events: none;
      white-space: nowrap;
    }

    .footer-shell {
      position: relative;
      z-index: 1;
      display: grid;
      gap: clamp(1.6rem, 4vw, 3rem);
      max-width: 1480px;
      padding-top: clamp(2rem, 5vw, 4rem);
      padding-bottom: 1.4rem;
    }

    .footer-intro {
      display: grid;
      grid-template-columns: 104px minmax(0, 1fr);
      gap: 1.2rem;
      align-items: center;
      max-width: 50rem;
    }

    .footer-logo {
      display: block;
      width: 104px;
      min-width: 104px;
      background: transparent;
      text-decoration: none;
    }

    .footer-logo img {
      display: block;
      width: 100%;
      height: auto;
      filter: drop-shadow(0 14px 24px rgb(8 36 58 / 10%));
    }

    .footer-kicker {
      margin: 0 0 0.45rem;
      color: var(--sau-return, #b35c2a);
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .footer-intro h2 {
      max-width: 22ch;
      margin: 0;
      color: #08243a;
      font-family: var(--font-family-heading);
      font-size: clamp(1.5rem, 3vw, 2.45rem);
      line-height: 1;
      letter-spacing: -0.055em;
      text-wrap: balance;
    }

    .footer-intro p:not(.footer-kicker) {
      max-width: 36rem;
      margin: 0.65rem 0 0;
      color: #5c7286;
      line-height: 1.58;
    }

    .footer-nav {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: clamp(1rem, 4vw, 3rem);
      padding-top: 1.5rem;
      border-top: 1px solid rgb(15 76 129 / 9%);
    }

    .footer-nav section {
      min-width: 0;
    }

    .footer-nav h3 {
      margin: 0 0 0.8rem;
      color: #08243a;
      font-family: var(--font-family-heading);
      font-size: 0.92rem;
      letter-spacing: -0.01em;
    }

    .footer-nav a {
      display: block;
      width: fit-content;
      max-width: 100%;
      margin-top: 0.48rem;
      color: #49677f;
      font-size: 0.88rem;
      text-decoration: none;
      overflow-wrap: anywhere;
      transition: color 160ms ease, transform 160ms ease;
    }

    .footer-nav a:hover {
      color: #0f4c81;
      transform: translateX(2px);
    }

    .footer-social {
      display: flex;
      flex-wrap: wrap;
      gap: 0.38rem;
      margin-top: 0.78rem;
    }

    .footer-social a {
      margin-top: 0;
      padding: 0.34rem 0.58rem;
      border: 1px solid rgb(15 76 129 / 12%);
      border-radius: 999px;
      background: #ffffff;
      color: #0f4c81;
      font-size: 0.72rem;
      font-weight: 850;
    }

    .footer-motto {
      margin: 0;
      padding: 1.5rem 0 0.2rem;
      border-top: 1px solid rgb(15 76 129 / 9%);
      color: #0f4c81;
      font-family: var(--font-family-heading);
      font-size: clamp(1.2rem, 2vw, 1.6rem);
      font-weight: 500;
      letter-spacing: -0.03em;
      text-align: center;
    }

    .footer-motto span {
      margin: 0 0.8rem;
    }

    .footer-bottom {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.8rem;
      color: #71889b;
      font-size: 0.78rem;
    }

    .footer-bottom p {
      margin: 0;
    }

    .footer-bottom nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.9rem;
    }

    .footer-bottom a {
      color: #71889b;
      text-decoration: none;
    }

    .footer-bottom a:hover {
      color: #0f4c81;
    }

    @media (max-width: 920px) {
      .footer-nav {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .site-footer {
        background:
          radial-gradient(circle at 16% 0%, rgb(179 92 42 / 10%), transparent 14rem),
          linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
      }

      .site-footer::before {
        color: rgb(15 76 129 / 6%);
        font-size: clamp(5.6rem, 34vw, 8.8rem);
        left: auto;
        right: -1.1rem;
        bottom: 1.2rem;
        transform: none;
      }

      .footer-shell {
        gap: 1.15rem;
        padding-top: 1.35rem;
        padding-bottom: 1rem;
      }

      .footer-intro {
        grid-template-columns: 1fr;
        justify-items: start;
        gap: 0.85rem;
        padding: 1rem;
        border: 1px solid rgb(15 76 129 / 9%);
        border-radius: 22px;
        background: rgb(255 255 255 / 66%);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      .footer-logo {
        width: 76px;
        min-width: 76px;
      }

      .footer-kicker {
        margin-bottom: 0.35rem;
        color: var(--sau-return, #b35c2a);
        font-size: 0.62rem;
      }

      .footer-intro h2 {
        max-width: 20ch;
        font-size: clamp(1.42rem, 8vw, 2rem);
        letter-spacing: -0.045em;
      }

      .footer-intro p:not(.footer-kicker) {
        margin-top: 0.55rem;
        font-size: 0.9rem;
      }

      .footer-nav {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
        padding-top: 0;
        border-top: 0;
      }

      .footer-nav section {
        padding: 0.85rem;
        border: 1px solid rgb(15 76 129 / 9%);
        border-radius: 18px;
        background: rgb(255 255 255 / 46%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      .footer-nav h3 {
        margin-bottom: 0.62rem;
        color: var(--sau-return, #b35c2a);
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .footer-nav a {
        margin-top: 0.42rem;
        font-size: 0.82rem;
        line-height: 1.28;
      }

      .footer-social {
        gap: 0.28rem;
      }

      .footer-social a {
        padding: 0.28rem 0.45rem;
        font-size: 0.66rem;
      }

      .footer-motto {
        padding-top: 1rem;
        color: var(--sau-return, #b35c2a);
        font-size: clamp(1.05rem, 6vw, 1.25rem);
        text-align: center;
      }

      .footer-motto span {
        margin: 0 0.35rem;
      }

      .footer-bottom {
        display: grid;
        justify-items: center;
        text-align: center;
      }

      .footer-bottom nav {
        justify-content: center;
        gap: 0.7rem;
      }
    }

    @media (max-width: 460px) {
      .footer-nav {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
