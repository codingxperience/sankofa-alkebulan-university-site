import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <section>
            <p class="eyebrow">Sankofa Alkebulan University</p>
            <h3>RETURN &bull; RESTORE &bull; REIMAGINE</h3>
            <p>
              A Pan-African university platform advancing scholarship, ethical leadership, research innovation, and
              community transformation.
            </p>
          </section>

          <section>
            <h4>University</h4>
            <ul>
              <li><a routerLink="/about">About</a></li>
              <li><a routerLink="/governance-compliance">Governance</a></li>
              <li><a routerLink="/admissions">Admissions</a></li>
              <li><a routerLink="/programs">Programs</a></li>
              <li><a routerLink="/faculties-schools">Faculties and Schools</a></li>
            </ul>
          </section>

          <section>
            <h4>Research and Digital</h4>
            <ul>
              <li><a routerLink="/research-innovation">Research Institutes</a></li>
              <li><a routerLink="/library-repository">Library and Repository</a></li>
              <li><a routerLink="/digital-learning">Virtual Campus</a></li>
              <li><a routerLink="/ai-advanced-tools">AI and Advanced Tools</a></li>
              <li><a routerLink="/sustainability">Sustainability</a></li>
            </ul>
          </section>

          <section>
            <h4>Contact</h4>
            <p class="contact-row">
              <span>Email</span>
              <a href="mailto:sankofalkebulanuniversity@outlook.com">
                sankofalkebulanuniversity@outlook.com
              </a>
            </p>
            <p class="contact-row">
              <span>Support</span>
              <a routerLink="/contact">Administrative Access Center</a>
            </p>
            <p class="contact-row">
              <span>Safety</span>
              <a routerLink="/emergency-safety">Emergency and Safety Portal</a>
            </p>
          </section>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2026 Sankofa Alkebulan University. All rights reserved.</p>
          <p>Pan-African vision for education, research, and social impact.</p>
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
      background: #08243a;
      color: #deebf7;
      margin-top: auto;
      border-top: 1px solid #0f3e64;
    }

    .site-footer > .container {
      max-width: 1480px;
    }

    .footer-grid {
      padding: 3rem 0 1.4rem;
      display: flex;
      flex-wrap: wrap;
      display: grid;
      grid-template-columns: 1.7fr 1fr 1fr 1.15fr;
      gap: 1.3rem;
    }

    .footer-grid > section {
      min-width: 0;
      flex: 1 1 220px;
    }

    .eyebrow {
      margin: 0;
      color: #7db9ea;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }

    h3 {
      margin: 0.55rem 0 0.6rem;
      color: #fff;
      font-size: 1.3rem;
    }

    h4 {
      margin: 0 0 0.75rem;
      color: #fff;
      font-size: 0.97rem;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.45rem;
    }

    a {
      color: #cae6ff;
      text-decoration: none;
    }

    a:hover {
      color: #fff;
      text-decoration: underline;
    }

    section > p {
      margin: 0.3rem 0 0;
      color: #b5cee3;
    }

    .contact-row {
      display: grid;
      gap: 0.2rem;
      margin-bottom: 0.72rem;
    }

    .contact-row a {
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .contact-row span {
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #84b5dc;
      font-weight: 700;
    }

    .footer-bottom {
      border-top: 1px solid #17507e;
      padding: 0.95rem 0 1.4rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.6rem;
      font-size: 0.84rem;
      color: #9ec0de;
    }

    .footer-bottom p {
      margin: 0;
      overflow-wrap: anywhere;
    }

    @media (max-width: 1024px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 700px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
