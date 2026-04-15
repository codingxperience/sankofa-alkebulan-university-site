import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta-surface',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrls: ['./cta-surface.component.scss'],
  template: `
    <section class="cta-surface">
      <div class="container">
        <div class="cta-surface__content">
          <div class="cta-surface__text">
            <h2 class="cta-surface__title">Join Our Community</h2>
            <p class="cta-surface__description">
              Support African voices and cultural preservation. Get exclusive access to essays,
              community events, and help sustain independent African journalism.
            </p>
          </div>

          <div class="cta-surface__actions">
            <a routerLink="/membership" class="btn btn--accent cta-surface__button">
              <svg class="cta-surface__pattern" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="kente-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
                    <!-- Kente cloth inspired pattern -->
                    <rect x="0" y="0" width="20" height="20" fill="#D4AF37" opacity="0.1"/>
                    <rect x="2" y="2" width="16" height="16" fill="none" stroke="#8B4513" stroke-width="1" opacity="0.3"/>
                    <circle cx="10" cy="10" r="3" fill="#654321" opacity="0.4"/>
                    <path d="M 5 5 L 15 15 M 15 5 L 5 15" stroke="#2F1B14" stroke-width="1" opacity="0.5"/>
                    <!-- Adinkra inspired elements -->
                    <circle cx="5" cy="5" r="1" fill="#8B4513" opacity="0.6"/>
                    <circle cx="15" cy="15" r="1" fill="#8B4513" opacity="0.6"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#kente-pattern)" />
              </svg>
              Join Our Community
            </a>
            <a routerLink="/about" class="btn btn--secondary cta-surface__link">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cta-surface {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--text-color) 100%);
      color: var(--background-color);
      padding: var(--spacing-3xl) 0;
      position: relative;
      overflow: hidden;
    }

    .cta-surface::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
      opacity: 0.1;
    }

    .cta-surface__content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--spacing-2xl);
      align-items: center;
    }

    .cta-surface__text {
      max-width: 500px;
    }

    .cta-surface__title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      margin-bottom: var(--spacing-lg);
      color: var(--background-color);
    }

    .cta-surface__description {
      font-size: var(--font-size-lg);
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0;
    }

    .cta-surface__actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: flex-start;
    }

    .cta-surface__button {
      position: relative;
      overflow: hidden;
      padding: var(--spacing-md) var(--spacing-xl);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      background-color: var(--accent-color);
      color: var(--primary-color);
      border: 2px solid var(--accent-color);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      transition: all var(--transition-fast);
    }

    .cta-surface__button:hover {
      background-color: transparent;
      color: var(--accent-color);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .cta-surface__pattern {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .cta-surface__link {
      color: var(--background-color);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid transparent;
      transition: border-color var(--transition-fast);
    }

    .cta-surface__link:hover {
      border-bottom-color: var(--background-color);
    }

    @media (max-width: 768px) {
      .cta-surface {
        padding: var(--spacing-2xl) 0;
      }

      .cta-surface__content {
        grid-template-columns: 1fr;
        gap: var(--spacing-xl);
        text-align: center;
      }

      .cta-surface__actions {
        align-items: center;
      }

      .cta-surface__title {
        font-size: var(--font-size-2xl);
      }

      .cta-surface__description {
        font-size: var(--font-size-base);
      }
    }
  `]
})
export class CtaSurfaceComponent {}