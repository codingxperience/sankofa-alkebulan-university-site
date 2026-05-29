import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface LanguageEdition {
  readonly label: string;
  readonly nativeLabel: string;
  readonly region: string;
}

@Component({
  selector: 'app-language-switcher',
  template: `
    <div class="language-dock" [class.language-dock--open]="isOpen()">
      <button
        type="button"
        class="language-dock__button"
        aria-label="Open language editions"
        [attr.aria-expanded]="isOpen()"
        (click)="toggle()"
      >
        <i class="fa-solid fa-globe" aria-hidden="true"></i>
      </button>

      @if (isOpen()) {
        <section class="language-dock__panel" aria-label="Language editions">
          <div class="language-dock__head">
            <span>Language editions</span>
            <button type="button" aria-label="Close language editions" (click)="close()">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div class="language-dock__grid">
            @for (language of languages; track language.label) {
              <button
                type="button"
                [attr.lang]="language.label.toLowerCase()"
                [class.language-dock__option--active]="activeLanguage() === language.label"
                (click)="select(language)"
              >
                <strong>{{ language.nativeLabel }}</strong>
                <span>{{ language.label }} &middot; {{ language.region }}</span>
              </button>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .language-dock {
        position: fixed;
        left: 0;
        bottom: 1.15rem;
        z-index: 180;
        display: grid;
        align-items: end;
        gap: 0.55rem;
        pointer-events: none;
      }

      .language-dock__button {
        pointer-events: auto;
        display: grid;
        place-items: center;
        width: 45px;
        height: 45px;
        border: 1px solid rgb(8 36 58 / 12%);
        border-left: 0;
        border-radius: 0 999px 999px 0;
        background: #ffffff;
        color: #051b2c;
        box-shadow: 0 12px 30px rgb(8 36 58 / 14%);
        cursor: pointer;
        transition:
          background-color 160ms ease,
          color 160ms ease,
          transform 160ms ease;
      }

      .language-dock__button:hover,
      .language-dock__button:focus-visible,
      .language-dock--open .language-dock__button {
        background: #051b2c;
        color: #ffffff;
        transform: translateX(2px);
      }

      .language-dock__panel {
        pointer-events: auto;
        width: min(336px, calc(100vw - 1.4rem));
        margin-left: 0.75rem;
        overflow: hidden;
        border: 1px solid rgb(8 36 58 / 10%);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 22px 60px rgb(8 36 58 / 18%);
      }

      .language-dock__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.82rem 0.95rem;
        border-bottom: 1px solid rgb(8 36 58 / 8%);
        color: #08243a;
        font-family: var(--font-family-heading);
        font-size: 0.78rem;
        font-weight: 850;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .language-dock__head button {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border: 1px solid rgb(8 36 58 / 10%);
        border-radius: 999px;
        background: #f6fbff;
        color: #0f4c81;
        cursor: pointer;
      }

      .language-dock__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        padding: 0.46rem;
      }

      .language-dock__grid button {
        display: grid;
        gap: 0.1rem;
        min-width: 0;
        padding: 0.58rem 0.62rem;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #102a43;
        cursor: pointer;
        font: inherit;
        text-decoration: none;
        text-align: left;
      }

      .language-dock__grid button:hover,
      .language-dock__grid button:focus-visible,
      .language-dock__option--active {
        background: #f6fbff;
        color: #0f4c81;
      }

      .language-dock__grid strong {
        font-family: var(--font-family-heading);
        font-size: 0.9rem;
        font-weight: 780;
        letter-spacing: -0.01em;
      }

      .language-dock__grid span {
        color: #58728b;
        font-size: 0.72rem;
        line-height: 1.25;
      }

      @media (max-width: 640px) {
        .language-dock {
          bottom: 0.85rem;
        }

        .language-dock__button {
          width: 42px;
          height: 42px;
        }

        .language-dock__panel {
          width: min(308px, calc(100vw - 1rem));
          margin-left: 0.5rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  readonly isOpen = signal(false);
  readonly activeLanguage = signal('English');

  readonly languages: readonly LanguageEdition[] = [
    { label: 'English', nativeLabel: 'English', region: 'Pan-African' },
    { label: 'Kiswahili', nativeLabel: 'Kiswahili', region: 'East Africa' },
    { label: 'Luganda', nativeLabel: 'Luganda', region: 'Uganda' },
    { label: 'Yoruba', nativeLabel: 'Yoruba', region: 'West Africa' },
    { label: 'Hausa', nativeLabel: 'Hausa', region: 'Sahel' },
    { label: 'Igbo', nativeLabel: 'Igbo', region: 'West Africa' },
    { label: 'Amharic', nativeLabel: 'Amharic', region: 'Horn of Africa' },
    { label: 'Kinyarwanda', nativeLabel: 'Kinyarwanda', region: 'Great Lakes' },
    { label: 'isiZulu', nativeLabel: 'isiZulu', region: 'Southern Africa' },
    { label: 'French', nativeLabel: 'Francais', region: 'Continental' },
  ];

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  close(): void {
    this.isOpen.set(false);
  }

  select(language: LanguageEdition): void {
    this.activeLanguage.set(language.label);
    this.close();
  }
}
