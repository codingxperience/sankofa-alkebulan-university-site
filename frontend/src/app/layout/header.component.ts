import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface NavLink {
  readonly label: string;
  readonly path: string;
  readonly kind?: 'about' | 'academics';
  readonly disabled?: boolean;
}

interface MegaLink {
  readonly label: string;
  readonly path: string;
  readonly fragment?: string;
  readonly description?: string;
  readonly icon?: string;
}

interface MegaColumn {
  readonly title: string;
  readonly links: readonly MegaLink[];
}

type MobileGroup = 'about' | 'academics';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="editorial-bar">
        <div class="container editorial-bar__inner">
          <a
            routerLink="/home"
            class="editorial-brand"
            aria-label="Sankofa Alkebulan University home"
            (click)="closeMenus()"
          >
            <img src="/assets/design/logo-primary.png" alt="Sankofa Alkebulan University" />
          </a>

          <nav class="editorial-nav" aria-label="Primary navigation">
            @for (item of primaryLinks; track item.label) {
              @if (item.kind === 'about') {
                <div
                  class="nav-item nav-item--has-menu"
                  (mouseenter)="openAboutMenu()"
                  (mouseleave)="closeAboutMenuDelayed()"
                  (focusin)="openAboutMenu()"
                  (focusout)="onAboutFocusOut($event)"
                >
                  <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.label }}</a>
                  <div class="nav-panel nav-panel--about" [class.nav-panel--open]="isAboutMenuOpen()">
                    <div class="nav-panel__intro">
                      <span>About SAU</span>
                      <strong>Institutional identity with African intellectual roots.</strong>
                      <p>{{ aboutMenuSummary }}</p>
                    </div>
                    <div class="nav-panel__columns nav-panel__columns--two">
                      <section>
                        <h3>Institution</h3>
                        @for (link of aboutSectionLinks; track link.label) {
                          <a [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">
                            <strong>{{ link.label }}</strong>
                            @if (link.description) {
                              <span>{{ link.description }}</span>
                            }
                          </a>
                        }
                      </section>
                      <section>
                        <h3>Governance</h3>
                        @for (link of aboutRelatedLinks; track link.label) {
                          <a [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">
                            <strong>{{ link.label }}</strong>
                            @if (link.description) {
                              <span>{{ link.description }}</span>
                            }
                          </a>
                        }
                      </section>
                    </div>
                  </div>
                </div>
              } @else if (item.kind === 'academics') {
                <div
                  class="nav-item nav-item--has-menu"
                  (mouseenter)="openAcademicsMenu()"
                  (mouseleave)="closeAcademicsMenuDelayed()"
                  (focusin)="openAcademicsMenu()"
                  (focusout)="onAcademicsFocusOut($event)"
                >
                  <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.label }}</a>
                  <div class="nav-panel nav-panel--academics" [class.nav-panel--open]="isAcademicsMenuOpen()">
                    <div class="nav-panel__intro">
                      <span>Academic Estate</span>
                      <strong>Choose the question, then the route.</strong>
                      <p>Colleges, schools, departments, programmes, and institutes in one clear academic path.</p>
                    </div>
                    <div class="nav-panel__columns">
                      @for (column of academicsMega; track column.title) {
                        <section>
                          <h3>{{ column.title }}</h3>
                          @for (link of column.links; track link.label) {
                            <a class="mega-link" [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">
                              @if (link.icon) {
                                <i class="fa-solid {{ link.icon }}" aria-hidden="true"></i>
                              }
                              <div>
                                <strong>{{ link.label }}</strong>
                                @if (link.description) {
                                  <span>{{ link.description }}</span>
                                }
                              </div>
                            </a>
                          }
                        </section>
                      }
                    </div>
                  </div>
                </div>
              } @else if (item.disabled) {
                <button
                  type="button"
                  class="nav-construction"
                  aria-disabled="true"
                  data-tip="Coming soon"
                >
                  {{ item.label }}
                </button>
              } @else {
                <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.label }}</a>
              }
            }
          </nav>

          <a routerLink="/admissions" class="apply-link" (click)="closeMenus()">Apply &middot; 2026</a>

          <button
            type="button"
            class="mobile-toggle"
            [class.mobile-toggle--open]="isMobileMenuOpen()"
            [attr.aria-expanded]="isMobileMenuOpen()"
            aria-controls="mobile-navigation"
            aria-label="Toggle mobile navigation"
            (click)="toggleMobileMenu()"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <div id="mobile-navigation" class="mobile-drawer" [class.mobile-drawer--open]="isMobileMenuOpen()">
        <div class="mobile-drawer__surface">
          <div class="mobile-drawer__head">
            <a routerLink="/home" class="mobile-drawer__brand" (click)="closeMenus()">
              <img src="/assets/design/logo-primary.png" alt="Sankofa Alkebulan University" />
            </a>
            <button type="button" aria-label="Close mobile navigation" (click)="closeMenus()">&times;</button>
          </div>

          <p class="mobile-drawer__eyebrow">Sankofa Alkebulan</p>

          <nav class="mobile-drawer__nav" aria-label="Mobile navigation">
            @for (item of primaryLinks; track item.label) {
              @if (item.kind === 'about') {
                <div
                  class="mobile-group"
                  [class.mobile-group--open]="isMobileGroupOpen('about')"
                  [class.mobile-group--active]="isAboutRoute()"
                >
                  <button
                    type="button"
                    [attr.aria-expanded]="isMobileGroupOpen('about')"
                    (click)="toggleMobileGroup('about')"
                  >
                    About SAU
                  </button>
                  <div class="mobile-group__links">
                    <a routerLink="/about" (click)="closeMenus()">About overview</a>
                    @for (link of aboutSectionLinks; track link.label) {
                      <a [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">{{ link.label }}</a>
                    }
                    @for (link of aboutRelatedLinks; track link.label) {
                      <a [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">{{ link.label }}</a>
                    }
                  </div>
                </div>
              } @else if (item.kind === 'academics') {
                <div
                  class="mobile-group"
                  [class.mobile-group--open]="isMobileGroupOpen('academics')"
                  [class.mobile-group--active]="isAcademicsRoute()"
                >
                  <button
                    type="button"
                    [attr.aria-expanded]="isMobileGroupOpen('academics')"
                    (click)="toggleMobileGroup('academics')"
                  >
                    Academics
                  </button>
                  <div class="mobile-group__links">
                    <a routerLink="/academics" (click)="closeMenus()">Academic overview</a>
                    @for (column of academicsMega; track column.title) {
                      <span>{{ column.title }}</span>
                      @for (link of column.links; track link.label) {
                        <a [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">
                          @if (link.icon) {
                            <i class="fa-solid {{ link.icon }}" aria-hidden="true"></i>
                          }
                          {{ link.label }}
                        </a>
                      }
                    }
                  </div>
                </div>
              } @else if (item.disabled) {
                <button
                  type="button"
                  class="mobile-construction"
                  aria-disabled="true"
                >
                  <span>{{ item.label }}</span>
                  <small>Coming soon</small>
                </button>
              } @else {
                <a [routerLink]="item.path" routerLinkActive="is-active" (click)="closeMenus()">{{ item.label }}</a>
              }
            }
          </nav>

          <div class="mobile-drawer__cta">
            <a routerLink="/admissions" class="mobile-drawer__apply" (click)="closeMenus()">Apply now</a>
            <a
              href="https://chat.whatsapp.com/Dv2lTXXzhfMDf6sClAxpEP"
              target="_blank"
              rel="noopener"
              class="mobile-drawer__support"
              (click)="closeMenus()"
            >
              Live chat with admissions
            </a>
          </div>
        </div>
      </div>

    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .site-header {
      position: sticky;
      top: 0;
      z-index: 130;
      background: transparent;
    }

    .editorial-bar {
      border-bottom: 1px solid rgb(15 76 129 / 10%);
      background: rgb(247 241 230 / 88%);
      backdrop-filter: blur(14px);
      box-shadow: 0 10px 28px rgb(8 36 58 / 7%);
    }

    .editorial-bar__inner {
      display: grid;
      grid-template-columns: minmax(170px, 220px) minmax(0, 1fr) auto;
      gap: clamp(0.8rem, 2vw, 1.4rem);
      align-items: center;
      min-height: 76px;
      min-width: 0;
    }

    .editorial-brand {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      min-width: 0;
      text-decoration: none;
    }

    .editorial-brand img {
      width: auto;
      height: 54px;
      max-width: 180px;
      object-fit: contain;
    }

    .editorial-nav {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.16rem;
      min-width: 0;
    }

    .editorial-nav > a,
    .nav-construction,
    .nav-item > a {
      display: inline-flex;
      align-items: center;
      min-height: 38px;
      padding: 0.46rem 0.72rem;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #294960;
      font-family: var(--font-family-heading);
      font-size: 0.82rem;
      font-weight: 750;
      letter-spacing: -0.02em;
      text-decoration: none;
      white-space: nowrap;
      transition: color 160ms ease, background-color 160ms ease, transform 160ms ease;
    }

    .editorial-nav > a:hover,
    .nav-construction:hover,
    .nav-construction:focus-visible,
    .nav-item > a:hover,
    .editorial-nav > a.is-active,
    .nav-item > a.is-active {
      background: rgb(255 255 255 / 62%);
      color: #0f4c81;
      text-decoration: none;
      transform: translateY(-1px);
    }

    .nav-construction {
      position: relative;
      cursor: default;
    }

    .nav-construction::after {
      content: '';
      width: 0.36rem;
      height: 0.36rem;
      margin-left: 0.34rem;
      border-radius: 999px;
      background: var(--sau-return, #b35c2a);
      box-shadow: 0 0 0 4px rgb(179 92 42 / 14%);
    }

    .nav-construction::before {
      content: attr(data-tip);
      position: absolute;
      left: 50%;
      top: calc(100% + 0.58rem);
      z-index: 3;
      padding: 0.34rem 0.62rem;
      border: 1px solid rgb(179 92 42 / 24%);
      border-radius: 999px;
      background: rgb(255 248 242 / 97%);
      box-shadow: 0 14px 32px rgb(8 36 58 / 12%);
      color: var(--sau-return, #b35c2a);
      font-family: var(--font-family-heading);
      font-size: 0.64rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) translateY(-4px);
      transition: opacity 160ms ease, transform 160ms ease;
    }

    .nav-construction:hover::before,
    .nav-construction:focus-visible::before {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .nav-item {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .nav-item--has-menu > a::after {
      content: '';
      width: 0.42rem;
      height: 0.42rem;
      margin-left: 0.36rem;
      border-right: 1.8px solid currentColor;
      border-bottom: 1.8px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
      opacity: 0.68;
    }

    .apply-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 0.6rem 1.05rem;
      border-radius: 4px;
      background: #0f4c81;
      color: #ffffff;
      font-family: var(--font-family-heading);
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-decoration: none;
      text-transform: uppercase;
      white-space: nowrap;
      box-shadow: 0 14px 28px rgb(15 76 129 / 18%);
      transition: background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
    }

    .apply-link:hover {
      background: #08243a;
      color: #ffffff;
      text-decoration: none;
      transform: translateY(-1px);
      box-shadow: 0 18px 34px rgb(8 36 58 / 22%);
    }

    .nav-panel {
      position: absolute;
      top: calc(100% + 0.85rem);
      left: 50%;
      display: grid;
      grid-template-columns: minmax(260px, 0.42fr) minmax(0, 1fr);
      gap: 1.4rem;
      width: min(1040px, calc(100vw - 2rem));
      padding: 1.2rem;
      border: 1px solid rgb(15 76 129 / 10%);
      border-radius: 18px;
      background: rgb(255 253 248 / 90%);
      box-shadow: 0 26px 60px rgb(8 36 58 / 18%);
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) translateY(10px);
      transition: opacity 170ms ease, transform 170ms ease;
      backdrop-filter: blur(22px) saturate(150%);
      -webkit-backdrop-filter: blur(22px) saturate(150%);
    }

    .nav-panel--about {
      width: min(860px, calc(100vw - 2rem));
    }

    .nav-panel--open {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }

    .nav-panel::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      width: 16px;
      height: 16px;
      border-left: 1px solid rgb(15 76 129 / 10%);
      border-top: 1px solid rgb(15 76 129 / 10%);
      background: rgb(255 253 248 / 90%);
      transform: translateX(-50%) rotate(45deg);
    }

    .nav-panel__intro {
      display: grid;
      gap: 0.55rem;
      align-content: start;
      min-height: 100%;
      padding: 1.05rem;
      border-radius: 14px;
      border: 1px solid rgb(255 255 255 / 54%);
      background:
        radial-gradient(circle at 92% 0%, rgb(179 92 42 / 12%), transparent 8rem),
        linear-gradient(180deg, rgb(255 253 248 / 64%) 0%, rgb(255 255 255 / 42%) 100%);
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 70%);
      backdrop-filter: blur(12px) saturate(145%);
      -webkit-backdrop-filter: blur(12px) saturate(145%);
    }

    .nav-panel__intro span,
    .nav-panel__columns h3,
    .mobile-drawer__eyebrow,
    .mobile-group__links span {
      color: var(--sau-return, #b35c2a);
      font-family: var(--font-family-heading);
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .nav-panel__intro strong {
      max-width: 18ch;
      color: #08243a;
      font-family: var(--font-family-heading);
      font-size: 1.55rem;
      line-height: 1.02;
      letter-spacing: -0.045em;
    }

    .nav-panel__intro p {
      margin: 0;
      color: #536b7d;
      font-size: 0.86rem;
      line-height: 1.55;
    }

    .nav-panel__columns {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      min-width: 0;
      align-items: start;
    }

    .nav-panel__columns--two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .nav-panel__columns section {
      display: grid;
      align-content: start;
      gap: 0.38rem;
      min-width: 0;
    }

    .nav-panel__columns h3 {
      margin: 0 0 0.2rem;
    }

    .nav-panel__columns a {
      display: grid;
      gap: 0.14rem;
      padding: 0.58rem 0;
      border-top: 1px solid rgb(15 76 129 / 9%);
      color: inherit;
      text-decoration: none;
      transition: padding-left 160ms ease, color 160ms ease;
    }

    .nav-panel__columns a.mega-link {
      grid-template-columns: 2rem minmax(0, 1fr);
      align-items: start;
      column-gap: 0.62rem;
      min-height: 4.25rem;
      padding: 0.62rem 0.58rem;
      border-top: 0;
      border-radius: 0.88rem;
      background: rgb(255 255 255 / 42%);
      box-shadow: inset 0 0 0 1px rgb(15 76 129 / 6%);
    }

    .nav-panel__columns a.mega-link > i {
      width: 2rem;
      height: 2rem;
      display: grid;
      place-items: center;
      border-radius: 0.72rem;
      background: rgb(179 92 42 / 9%);
      color: var(--sau-return, #b35c2a);
      font-size: 0.82rem;
      transition: background-color 160ms ease, color 160ms ease;
    }

    .nav-panel__columns a.mega-link:hover > i {
      background: rgb(15 76 129 / 9%);
      color: #0f4c81;
    }

    .nav-panel__columns a:hover {
      padding-left: 0.58rem;
      color: #0f4c81;
      text-decoration: none;
      background: rgb(255 255 255 / 68%);
    }

    .nav-panel__columns strong {
      color: #123f62;
      font-family: var(--font-family-heading);
      font-size: 0.86rem;
      line-height: 1.22;
      letter-spacing: -0.025em;
    }

    .nav-panel__columns span {
      color: #63798b;
      font-size: 0.74rem;
      line-height: 1.35;
    }

    .mobile-toggle {
      display: none;
      width: 42px;
      height: 42px;
      place-items: center;
      border: 1px solid rgb(15 76 129 / 14%);
      border-radius: 10px;
      background: rgb(255 255 255 / 72%);
      cursor: pointer;
    }

    .mobile-toggle span {
      display: block;
      width: 18px;
      height: 2px;
      margin: 2.7px 0;
      border-radius: 999px;
      background: #0f4c81;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .mobile-toggle--open span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }

    .mobile-toggle--open span:nth-child(2) {
      opacity: 0;
    }

    .mobile-toggle--open span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    .mobile-drawer {
      position: fixed;
      inset: 0;
      z-index: 150;
      display: grid;
      justify-items: end;
      background: rgb(5 20 32 / 0%);
      opacity: 0;
      pointer-events: none;
      transition: opacity 180ms ease, background-color 180ms ease;
    }

    .mobile-drawer--open {
      opacity: 1;
      pointer-events: auto;
      background: rgb(5 20 32 / 48%);
    }

    .mobile-drawer__surface {
      position: relative;
      display: grid;
      align-content: start;
      gap: 0.75rem;
      width: min(420px, 100%);
      height: 100%;
      overflow-y: auto;
      padding: 1rem;
      background: linear-gradient(180deg, #08243a 0%, #051b2c 100%);
      color: #ffffff;
      transform: translateX(100%);
      transition: transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1);
    }

    .mobile-drawer--open .mobile-drawer__surface {
      transform: translateX(0);
    }

    .mobile-drawer__surface::after {
      content: 'Sankofa';
      position: fixed;
      right: -0.28em;
      bottom: -0.18em;
      color: rgb(255 255 255 / 5%);
      font-family: var(--font-family-heading);
      font-size: 8rem;
      font-weight: 900;
      letter-spacing: -0.08em;
      pointer-events: none;
    }

    .mobile-drawer__head {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.45rem;
    }

    .mobile-drawer__brand img {
      height: 48px;
      width: auto;
      object-fit: contain;
      filter: brightness(0) invert(1);
    }

    .mobile-drawer__head button {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border: 1px solid rgb(255 255 255 / 16%);
      border-radius: 12px;
      background: rgb(255 255 255 / 10%);
      color: #ffffff;
      cursor: pointer;
      font-size: 1.5rem;
      line-height: 1;
    }

    .mobile-drawer__eyebrow {
      position: relative;
      z-index: 1;
      margin: 0;
      color: #f4c3a4;
    }

    .mobile-drawer__nav {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 0.22rem;
    }

    .mobile-drawer__nav > a,
    .mobile-construction,
    .mobile-group > button {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 50px;
      padding: 0.75rem 0.8rem;
      border: 0;
      border-bottom: 1px solid rgb(255 255 255 / 9%);
      background: transparent;
      color: #ffffff;
      font-family: var(--font-family-heading);
      font-size: 1rem;
      font-weight: 850;
      letter-spacing: -0.02em;
      cursor: pointer;
      list-style: none;
      text-decoration: none;
      width: 100%;
      text-align: left;
    }

    .mobile-drawer__nav > a::after,
    .mobile-group > button::after {
      content: '';
      width: 0.46rem;
      height: 0.46rem;
      border-top: 2px solid currentColor;
      border-right: 2px solid currentColor;
      color: rgb(255 255 255 / 58%);
      transform: rotate(45deg);
      transition: color 160ms ease, transform 160ms ease;
    }

    .mobile-drawer__nav > a.is-active,
    .mobile-drawer__nav > a.is-active::after,
    .mobile-group--active > button,
    .mobile-group--active > button::after,
    .mobile-group--open > button,
    .mobile-group--open > button::after {
      color: #f4c3a4;
    }

    .mobile-construction {
      cursor: default;
    }

    .mobile-construction small {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.2rem 0.52rem;
      border: 1px solid rgb(179 92 42 / 28%);
      border-radius: 999px;
      background: rgb(179 92 42 / 12%);
      color: #f4c3a4;
      font-family: var(--font-family-heading);
      font-size: 0.62rem;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .mobile-group--open > button::after {
      transform: rotate(135deg);
    }

    .mobile-group__links {
      display: none;
      gap: 0.12rem;
      padding: 0.15rem 0.8rem 0.75rem;
    }

    .mobile-group--open .mobile-group__links {
      display: grid;
    }

    .mobile-group__links a {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.48rem 0.2rem;
      color: rgb(255 255 255 / 76%);
      font-size: 0.86rem;
      text-decoration: none;
    }

    .mobile-group__links a i {
      width: 1.45rem;
      height: 1.45rem;
      display: grid;
      place-items: center;
      border-radius: 0.5rem;
      background: rgb(244 195 164 / 10%);
      color: #f4c3a4;
      font-size: 0.72rem;
      flex: 0 0 auto;
    }

    .mobile-group__links span {
      margin-top: 0.6rem;
      color: #f4c3a4;
      font-size: 0.62rem;
    }

    .mobile-drawer__cta {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 0.55rem;
      margin-top: 0.9rem;
    }

    .mobile-drawer__apply,
    .mobile-drawer__support {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 46px;
      border-radius: 6px;
      color: #1a0d00;
      background: #d4a22f;
      font-family: var(--font-family-heading);
      font-size: 0.84rem;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-decoration: none;
      text-transform: uppercase;
    }

    .mobile-drawer__support {
      border: 1px solid rgb(255 255 255 / 18%);
      background: rgb(255 255 255 / 8%);
      color: #ffffff;
      text-transform: none;
      letter-spacing: 0;
    }

    @media (max-width: 1160px) {
      .editorial-bar__inner {
        grid-template-columns: minmax(145px, 180px) minmax(0, 1fr) auto;
      }

      .editorial-nav > a,
      .nav-item > a {
        padding-inline: 0.5rem;
        font-size: 0.78rem;
      }
    }

    @media (max-width: 980px) {
      .editorial-bar__inner {
        grid-template-columns: 1fr auto;
        min-height: 68px;
      }

      .editorial-brand img {
        height: 46px;
        max-width: 136px;
      }

      .editorial-nav,
      .apply-link {
        display: none;
      }

      .mobile-toggle {
        display: grid;
      }
    }

    @media (max-width: 460px) {
      .editorial-bar__inner {
        min-height: 64px;
      }

      .editorial-brand img {
        height: 44px;
        max-width: 112px;
        content: url('/assets/design/logo-mark.png');
      }

      .mobile-drawer__surface {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly primaryLinks: readonly NavLink[] = [
    { label: 'About', path: '/about', kind: 'about' },
    { label: 'Academics', path: '/academics', kind: 'academics' },
    { label: 'Admissions', path: '/admissions' },
    { label: 'Research', path: '/research-innovation' },
    { label: 'Digital Campus', path: '/digital-learning', disabled: true },
    { label: 'Student Life', path: '/student-life' },
    { label: 'Library', path: '/library-repository', disabled: true },
    { label: 'Contact', path: '/contact' },
  ];

  readonly aboutMenuSummary =
    'A Sankofa-centered university model rooted in African knowledge systems, rigorous scholarship, ethical leadership, and institutional renewal.';

  readonly aboutSectionLinks: readonly MegaLink[] = [
    {
      label: 'Vision & Mission',
      path: '/about',
      fragment: 'mission',
      description: 'Purpose, mission, values, and philosophical direction.',
    },
    {
      label: 'History of SAU',
      path: '/about/history-of-sankofa',
      description: 'Origins, legacy, and African intellectual renewal.',
    },
    {
      label: 'Identity and Motto',
      path: '/about',
      fragment: 'identity',
      description: 'Logo, motto, philosophy, and institutional language.',
    },
    {
      label: 'Institutional Charter',
      path: '/about/sankofa-charter',
      description: 'The supreme institutional framework.',
    },
  ];

  readonly aboutRelatedLinks: readonly MegaLink[] = [
    {
      label: 'Governance Structure',
      path: '/about/governance-structure',
      description: 'How authority and accountability are organized.',
    },
    {
      label: 'University Council',
      path: '/about/university-council',
      description: 'Administration, planning, and policy implementation.',
    },
    {
      label: 'Academic Senate',
      path: '/about/academic-senate',
      description: 'Academic standards, curricula, research, and quality assurance.',
    },
    {
      label: 'University Policies',
      path: '/about/university-policies',
      description: 'Academic, student, finance, technology, and ethics policies.',
    },
  ];

  readonly academicsMega: readonly MegaColumn[] = [
    {
      title: 'Academic Structure',
      links: [
        {
          label: 'Colleges',
          path: '/academics/colleges',
          icon: 'fa-building-columns',
          description: 'Start with the academic home.',
        },
        {
          label: 'Schools',
          path: '/academics/schools',
          icon: 'fa-sitemap',
          description: 'Choose the method inside a college.',
        },
        {
          label: 'Departments',
          path: '/academics/departments',
          icon: 'fa-layer-group',
          description: 'Enter the teaching and research home.',
        },
        {
          label: 'Research',
          path: '/academics/research-institutes',
          icon: 'fa-flask',
          description: 'Institutes, labs, and public scholarship.',
        },
      ],
    },
    {
      title: 'Programmes',
      links: [
        { label: 'Programme Levels', path: '/academics', fragment: 'programmes', icon: 'fa-book-open', description: 'Certificates through doctorates.' },
        { label: 'PhD Programmes', path: '/home/phd', icon: 'fa-microscope', description: 'Doctoral research pathways.' },
        { label: 'Masters Programmes', path: '/home/masters', icon: 'fa-user-graduate', description: 'Advanced professional and research pathways.' },
        { label: 'Undergraduate Studies', path: '/home/bachelors', icon: 'fa-graduation-cap', description: 'Bachelor degree academic formation.' },
      ],
    },
    {
      title: 'Research Layer',
      links: [
        {
          label: 'Research Institutes',
          path: '/academics/research-institutes',
          icon: 'fa-flask',
          description: '49 institute pathways aligned to the colleges.',
        },
        {
          label: 'Graduate School',
          path: '/home/graduate-school',
          icon: 'fa-scroll',
          description: 'Postgraduate coordination and higher degrees quality assurance.',
        },
        {
          label: 'University Press',
          path: '/university-press',
          icon: 'fa-newspaper',
          description: 'Journals, books, proceedings, and scholarly publishing.',
        },
      ],
    },
    {
      title: 'Applied Learning',
      links: [
        {
          label: 'Clubs & Societies',
          path: '/student-life',
          icon: 'fa-people-group',
          description: 'Cultural societies, clubs, and professional societies.',
        },
        {
          label: 'Admissions',
          path: '/admissions',
          icon: 'fa-file-signature',
          description: 'Choose a level, intake, and application route.',
        },
        {
          label: 'Support Services',
          path: '/services',
          icon: 'fa-life-ring',
          description: 'Routing for applicants, students, scholars, and partners.',
        },
      ],
    },
  ];

  readonly isMobileMenuOpen = signal(false);
  readonly isAcademicsMenuOpen = signal(false);
  readonly isAboutMenuOpen = signal(false);
  readonly mobileOpenGroup = signal<MobileGroup | null>(null);
  private academicsCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private aboutCloseTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeMenus());
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
    if (this.isMobileMenuOpen()) {
      this.isAcademicsMenuOpen.set(false);
      this.isAboutMenuOpen.set(false);
      this.mobileOpenGroup.set(this.currentMobileGroup());
    }
  }

  toggleMobileGroup(group: MobileGroup): void {
    this.mobileOpenGroup.set(this.mobileOpenGroup() === group ? null : group);
  }

  isMobileGroupOpen(group: MobileGroup): boolean {
    return this.mobileOpenGroup() === group;
  }

  isAboutRoute(): boolean {
    return this.router.url.startsWith('/about');
  }

  isAcademicsRoute(): boolean {
    const url = this.router.url;
    return (
      url.startsWith('/faculties-schools') ||
      url.startsWith('/academics') ||
      url.startsWith('/program') ||
      url.startsWith('/programmes') ||
      url.startsWith('/home/phd') ||
      url.startsWith('/home/masters') ||
      url.startsWith('/home/bachelors') ||
      url.startsWith('/home/certificate') ||
      url.startsWith('/home/diploma')
    );
  }

  openAcademicsMenu(): void {
    if (this.academicsCloseTimer) {
      clearTimeout(this.academicsCloseTimer);
      this.academicsCloseTimer = null;
    }
    this.isAcademicsMenuOpen.set(true);
    this.isAboutMenuOpen.set(false);
  }

  closeAcademicsMenuDelayed(): void {
    if (this.academicsCloseTimer) {
      clearTimeout(this.academicsCloseTimer);
    }
    this.academicsCloseTimer = setTimeout(() => {
      this.isAcademicsMenuOpen.set(false);
      this.academicsCloseTimer = null;
    }, 180);
  }

  closeAcademicsMenu(): void {
    if (this.academicsCloseTimer) {
      clearTimeout(this.academicsCloseTimer);
      this.academicsCloseTimer = null;
    }
    this.isAcademicsMenuOpen.set(false);
  }

  onAcademicsFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    if (!nextTarget || !(event.currentTarget as HTMLElement).contains(nextTarget)) {
      this.closeAcademicsMenu();
    }
  }

  openAboutMenu(): void {
    if (this.aboutCloseTimer) {
      clearTimeout(this.aboutCloseTimer);
      this.aboutCloseTimer = null;
    }
    this.isAboutMenuOpen.set(true);
    this.isAcademicsMenuOpen.set(false);
  }

  closeAboutMenuDelayed(): void {
    if (this.aboutCloseTimer) {
      clearTimeout(this.aboutCloseTimer);
    }
    this.aboutCloseTimer = setTimeout(() => {
      this.isAboutMenuOpen.set(false);
      this.aboutCloseTimer = null;
    }, 180);
  }

  closeAboutMenu(): void {
    if (this.aboutCloseTimer) {
      clearTimeout(this.aboutCloseTimer);
      this.aboutCloseTimer = null;
    }
    this.isAboutMenuOpen.set(false);
  }

  onAboutFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    if (!nextTarget || !(event.currentTarget as HTMLElement).contains(nextTarget)) {
      this.closeAboutMenu();
    }
  }

  closeMenus(): void {
    this.isMobileMenuOpen.set(false);
    this.mobileOpenGroup.set(null);
    this.closeAcademicsMenu();
    this.closeAboutMenu();
  }

  private currentMobileGroup(): MobileGroup | null {
    if (this.isAboutRoute()) {
      return 'about';
    }
    if (this.isAcademicsRoute()) {
      return 'academics';
    }
    return null;
  }
}

