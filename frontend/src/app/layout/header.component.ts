import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MEGA_MENU_ITEMS } from '../university/university-data';

interface NavLink {
  readonly label: string;
  readonly path: string | null;
  readonly disabled?: boolean;
}

interface MegaLink {
  readonly label: string;
  readonly path: string;
  readonly fragment?: string;
}

interface MegaColumn {
  readonly title: string;
  readonly links: readonly MegaLink[];
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage],
  template: `
    <header class="site-header">
      <div class="utility-row">
        <div class="container utility-row__inner">
          <a
            routerLink="/home"
            class="brand-badge"
            aria-label="Sankofa Alkebulan University home"
            (click)="closeMenus()"
          >
            <img
              ngSrc="/assets/branding/sankofa_university_logo-remove-background.com.png"
              alt="Sankofa Alkebulan University logo"
              width="124"
              height="186"
              priority
            />
          </a>

          <nav class="utility-nav" aria-label="Utility navigation">
            @for (item of utilityLinks; track item.label) {
              @if (item.disabled) {
                <span class="nav-disabled" aria-disabled="true">{{ item.label }}</span>
              } @else {
                <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.label }}</a>
              }
            }
          </nav>

          <span class="utility-chat utility-chat--disabled" aria-disabled="true">
            <span class="live-dot" aria-hidden="true"></span>
            Live Chat
          </span>

          <button
            type="button"
            class="mobile-toggle"
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

      <div class="primary-row">
        <div class="container primary-row__inner">
          <nav class="primary-nav" aria-label="Primary navigation">
            @for (item of primaryLinks; track item.label) {
              @if (item.label === 'Academics') {
                <div
                  class="nav-flyout"
                  (mouseenter)="openAcademicsMenu()"
                  (mouseleave)="closeAcademicsMenuDelayed()"
                  (focusin)="openAcademicsMenu()"
                  (focusout)="onAcademicsFocusOut($event)"
                >
                  <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.label }}</a>
                  <div
                    class="academics-flyout"
                    (mouseenter)="openAcademicsMenu()"
                    (mouseleave)="closeAcademicsMenuDelayed()"
                    [class.academics-flyout--open]="isAcademicsMenuOpen()"
                    aria-label="Academics menu"
                  >
                    <div class="academics-flyout__grid">
                      @for (column of academicsMega; track column.title) {
                        <div class="academics-flyout__column">
                          <h4>{{ column.title }}</h4>
                          <ul>
                            @for (link of column.links; track link.label) {
                              <li>
                                <a
                                  [routerLink]="link.path"
                                  [fragment]="link.fragment"
                                  (click)="closeMenus()"
                                >
                                  {{ link.label }}
                                </a>
                              </li>
                            }
                          </ul>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              } @else if (item.path === '/about') {
                <div
                  class="nav-flyout"
                  (mouseenter)="openAboutMenu()"
                  (mouseleave)="closeAboutMenuDelayed()"
                  (focusin)="openAboutMenu()"
                  (focusout)="onAboutFocusOut($event)"
                >
                  <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.label }}</a>
                  <div
                    class="about-flyout"
                    (mouseenter)="openAboutMenu()"
                    (mouseleave)="closeAboutMenuDelayed()"
                    [class.about-flyout--open]="isAboutMenuOpen()"
                    aria-label="About menu"
                  >
                    <div class="about-flyout__grid">
                      <div class="about-flyout__intro">
                        <p class="about-flyout__eyebrow">Overview</p>
                        <p class="about-flyout__summary">
                          {{ aboutMenuSummary }}
                        </p>
                      </div>
                      <div class="about-flyout__column">
                        <p class="about-flyout__heading">In This Section</p>
                        <ul>
                          @for (link of aboutSectionLinks; track link.label) {
                            <li>
                              <a
                                [routerLink]="link.path"
                                [fragment]="link.fragment"
                                (click)="closeMenus()"
                              >
                                {{ link.label }}
                              </a>
                            </li>
                          }
                        </ul>
                      </div>
                      <div class="about-flyout__column">
                        <p class="about-flyout__heading">Related Links</p>
                        <ul>
                          @for (link of aboutRelatedLinks; track link.label) {
                            <li>
                              <a
                                [routerLink]="link.path"
                                [fragment]="link.fragment"
                                (click)="closeMenus()"
                              >
                                {{ link.label }}
                              </a>
                            </li>
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              } @else {
                @if (item.disabled) {
                  <span class="nav-disabled nav-disabled--primary" aria-disabled="true">{{ item.label }}</span>
                } @else {
                  <a [routerLink]="item.path" routerLinkActive="is-active">{{ item.label }}</a>
                }
              }
            }
            <button
              type="button"
              class="all-sections"
              disabled
              aria-disabled="true"
              [attr.aria-expanded]="false"
              aria-controls="mega-menu-panel"
            >
              All Sections
            </button>
          </nav>
          <a routerLink="/admissions" class="apply-btn">Apply Now</a>
        </div>
      </div>

      <div id="mega-menu-panel" class="mega-menu" [class.mega-menu--open]="isMegaMenuOpen()">
        <div class="container mega-menu__grid">
          @for (item of megaMenuItems; track item.slug) {
            <a [routerLink]="['/', item.path]" class="mega-menu__item" (click)="closeMenus()">
              <strong>{{ item.navLabel }}</strong>
              <span>{{ item.description }}</span>
            </a>
          }
        </div>
      </div>

      <div id="mobile-navigation" class="mobile-menu" [class.mobile-menu--open]="isMobileMenuOpen()">
        <div class="container mobile-menu__inner">
          <a routerLink="/home" routerLinkActive="is-active" (click)="closeMenus()">Home</a>
          @for (item of primaryLinks; track item.label) {
            @if (item.path === '/about') {
              <details class="mobile-menu__group">
                <summary>About</summary>
                <div class="mobile-subnav">
                  <a routerLink="/about" routerLinkActive="is-active" (click)="closeMenus()">About Overview</a>
                  @for (link of aboutSectionLinks; track link.label) {
                    <a [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">
                      {{ link.label }}
                    </a>
                  }
                  <span class="mobile-subnav__label">Related</span>
                  @for (link of aboutRelatedLinks; track link.label) {
                    <a [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">
                      {{ link.label }}
                    </a>
                  }
                </div>
              </details>
            } @else if (item.label === 'Academics') {
              <details class="mobile-menu__group">
                <summary>Academics</summary>
                <div class="mobile-subnav">
                  <a routerLink="/faculties-schools" routerLinkActive="is-active" (click)="closeMenus()">
                    Academics Overview
                  </a>
                  @for (column of academicsMega; track column.title) {
                    <span class="mobile-subnav__label">{{ column.title }}</span>
                    @for (link of column.links; track link.label) {
                      <a [routerLink]="link.path" [fragment]="link.fragment" (click)="closeMenus()">
                        {{ link.label }}
                      </a>
                    }
                  }
                </div>
              </details>
            } @else {
              @if (item.disabled) {
                <span class="mobile-link-disabled" aria-disabled="true">{{ item.label }}</span>
              } @else {
                <a [routerLink]="item.path" routerLinkActive="is-active" (click)="closeMenus()">
                  {{ item.label }}
                </a>
              }
            }
          }
          <span class="mobile-link-disabled" aria-disabled="true">All Sections</span>
          @for (item of utilityLinks; track item.label) {
            @if (item.disabled) {
              <span class="mobile-link-disabled" aria-disabled="true">{{ item.label }}</span>
            } @else {
              <a [routerLink]="item.path" routerLinkActive="is-active" (click)="closeMenus()">
                {{ item.label }}
              </a>
            }
          }
          <span class="mobile-live-chat mobile-link-disabled" aria-disabled="true">
            <span class="live-dot" aria-hidden="true"></span>
            Live Chat Online
          </span>
          <a routerLink="/admissions" class="apply-btn apply-btn--mobile" (click)="closeMenus()">
            Apply Now
          </a>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
    }

    .site-header {
      position: sticky;
      top: 0;
      z-index: 130;
      border-bottom: 1px solid #d4e2ee;
      box-shadow: 0 12px 28px rgba(10, 36, 58, 0.1);
      background: #fff;
    }

    .utility-row {
      background: #ffffff;
      border-bottom: 1px solid #e0ebf6;
    }

    .utility-row__inner {
      position: relative;
      min-height: 48px;
      padding-left: 144px;
      display: flex;
      justify-content: space-between;
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 0.7rem;
      min-width: 0;
    }

    .brand-badge {
      position: absolute;
      left: 0;
      top: -24px;
      width: auto;
      height: auto;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
      box-shadow: none;
      z-index: 4;
      transition: transform 200ms ease;
    }

    .brand-badge img {
      width: 124px;
      height: 186px;
      border-radius: 0;
      object-fit: contain;
      filter: drop-shadow(0 10px 16px rgba(8, 39, 65, 0.26));
      background: transparent;
    }

    .brand-badge:hover {
      transform: translateY(-2px);
    }

    .utility-nav {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: center;
      gap: 0.25rem;
      min-width: 0;
    }

    .utility-nav a {
      color: #355d7d;
      text-decoration: none;
      font-size: 0.77rem;
      padding: 0.34rem 0.5rem;
      border-radius: 999px;
      font-weight: 600;
      font-family: var(--font-family-heading);
      letter-spacing: -0.02em;
    }

    .nav-disabled {
      display: inline-flex;
      align-items: center;
      color: #6f8496;
      font-size: 0.77rem;
      padding: 0.34rem 0.5rem;
      border-radius: 999px;
      font-weight: 700;
      font-family: var(--font-family-heading);
      letter-spacing: -0.02em;
      cursor: default;
      opacity: 0.68;
    }

    .utility-nav a:hover,
    .utility-nav a.is-active {
      background: #eef6fd;
      color: #0f4c81;
      text-decoration: none;
    }

    .utility-chat {
      display: inline-flex;
      align-items: center;
      gap: 0.36rem;
      color: #0f4c81;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.76rem;
      padding: 0.35rem 0.56rem;
      border: 1px solid #c9ddef;
      border-radius: 999px;
      background: #f5fbff;
      font-family: var(--font-family-heading);
      letter-spacing: -0.02em;
    }

    .utility-chat:hover {
      border-color: #9bc0de;
      background: #eaf4fd;
      color: #0d436f;
      text-decoration: none;
    }

    .utility-chat--disabled {
      cursor: default;
      opacity: 0.72;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #23b864;
      box-shadow: 0 0 0 0 rgba(35, 184, 100, 0.46);
      animation: presencePulse 1.9s infinite;
      flex: 0 0 auto;
    }

    .about-flyout {
      position: absolute;
      top: calc(100% + 0.45rem);
      left: 50%;
      right: auto;
      width: min(920px, calc(100vw - 2rem));
      max-width: calc(100vw - 2rem);
      min-width: min(720px, calc(100vw - 2rem));
      background: #f4f6f2;
      border: 1px solid #d8e0e8;
      border-radius: 10px;
      box-shadow: 0 18px 36px rgba(12, 38, 60, 0.2);
      padding: 1.1rem 1.3rem 1.3rem;
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) translateY(12px);
      transition: opacity 180ms ease, transform 180ms ease;
      z-index: 30;
    }

    .about-flyout--open {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }

    .about-flyout__grid {
      display: flex;
      flex-wrap: wrap;
      display: grid;
      grid-template-columns: minmax(220px, 1.2fr) minmax(200px, 1fr) minmax(200px, 1fr);
      gap: 1.6rem;
    }

    .about-flyout__grid > * {
      min-width: 0;
      flex: 1 1 200px;
    }

    .about-flyout__intro {
      display: grid;
      gap: 0.6rem;
      align-content: start;
    }

    .about-flyout__eyebrow {
      margin: 0 0 0.55rem;
      color: #b35c2a;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    .about-flyout__summary {
      margin: 0;
      color: #4b5f70;
      font-size: 0.86rem;
      line-height: 1.6;
    }

    .about-flyout__heading {
      margin: 0 0 0.55rem;
      color: #b35c2a;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      font-family: var(--font-family-heading);
    }

    .about-flyout__column ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.4rem;
    }

    .about-flyout__column a {
      color: #0f4c81;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .about-flyout__column a:hover,
    .about-flyout__column a:focus {
      color: #0a3254;
      text-decoration: none;
    }

    .primary-row {
      background: #d4a22f;
      border-top: 1px solid #e2be61;
    }

    .primary-row__inner {
      min-height: 44px;
      padding-left: 144px;
      display: flex;
      justify-content: space-between;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 0.7rem;
      min-width: 0;
    }

    .primary-nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 0.25rem;
      min-width: 0;
    }
    .nav-flyout {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .nav-flyout > a {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .nav-flyout > a::after {
      content: '';
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid currentColor;
      transform: translateY(1px);
    }

    .academics-flyout {
      position: absolute;
      top: calc(100% + 0.45rem);
      left: 50%;
      right: auto;
      width: min(720px, calc(100vw - 2rem));
      max-width: calc(100vw - 2rem);
      min-width: min(520px, calc(100vw - 2rem));
      background: #f8fcff;
      border: 1px solid #dbe9f5;
      border-radius: 16px;
      box-shadow: 0 18px 40px rgba(12, 46, 78, 0.24);
      padding: 0.9rem 1.1rem 1.1rem;
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) translateY(12px);
      transition: opacity 180ms ease, transform 180ms ease;
      z-index: 30;
    }

    .academics-flyout--open {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }

    .academics-flyout__grid {
      display: flex;
      flex-wrap: wrap;
      display: grid;
      grid-template-columns: repeat(3, minmax(160px, 1fr));
      gap: 1.2rem;
    }

    .academics-flyout__grid > * {
      min-width: 0;
      flex: 1 1 160px;
    }

    .academics-flyout__column h4 {
      margin: 0 0 0.5rem;
      color: #0f3e66;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: var(--font-family-heading);
    }

    .academics-flyout__column ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.4rem;
    }

    .academics-flyout__column a {
      color: #0c3f66;
      text-decoration: none;
      font-size: 0.83rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .academics-flyout__column a::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #d4a22f;
      opacity: 0;
      transform: scale(0.6);
      transition: opacity 160ms ease, transform 160ms ease;
    }

    .academics-flyout__column a:hover,
    .academics-flyout__column a:focus {
      color: #123b5f;
      text-decoration: none;
    }

    .academics-flyout__column a:hover::before,
    .academics-flyout__column a:focus::before {
      opacity: 1;
      transform: scale(1);
    }

    .primary-nav a,
    .all-sections {
      border: none;
      background: transparent;
      color: #0d3d63;
      text-decoration: none;
      font-size: 0.84rem;
      font-weight: 700;
      padding: 0.36rem 0.54rem;
      border-radius: 999px;
      cursor: pointer;
      font-family: var(--font-family-heading);
      letter-spacing: -0.02em;
    }

    .nav-disabled--primary {
      color: #25475f;
      font-size: 0.84rem;
      padding: 0.36rem 0.54rem;
      opacity: 0.76;
    }

    .all-sections:disabled {
      cursor: default;
      opacity: 0.58;
    }

    .primary-nav a:hover,
    .primary-nav a.is-active,
    .all-sections:not(:disabled):hover,
    .all-sections--active {
      background: rgba(255, 255, 255, 0.36);
      color: #0b3454;
      text-decoration: none;
    }

    .apply-btn {
      border: 1px solid #1a4f7c;
      border-radius: 3px;
      background: linear-gradient(180deg, #1f5f95 0%, #0f4c81 100%);
      color: #f3f9ff;
      font-weight: 700;
      text-decoration: none;
      font-size: 0.83rem;
      padding: 0.46rem 0.95rem;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-family: var(--font-family-heading);
    }

    .apply-btn:hover {
      background: linear-gradient(180deg, #0f4c81 0%, #0b3c66 100%);
      text-decoration: none;
    }

    .mobile-toggle {
      display: none;
      width: 46px;
      height: 40px;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      justify-self: end;
      margin-left: auto;
      flex-shrink: 0;
      border: 1px solid #c7dcef;
      background: #f5faff;
      border-radius: 10px;
      padding: 0.42rem;
      cursor: pointer;
    }

    .mobile-toggle span {
      width: 19px;
      height: 2px;
      display: block;
      margin: 3px 0;
      background: #114f81;
    }

    .mega-menu {
      max-height: 0;
      overflow: hidden;
      transition: max-height 240ms ease;
      border-top: 1px solid transparent;
      background: #f8fcff;
    }

    .mega-menu--open {
      max-height: 520px;
      border-top-color: #dbe9f5;
    }

    .mega-menu__grid {
      display: flex;
      flex-wrap: wrap;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.65rem;
      padding-top: 0.85rem;
      padding-bottom: 0.95rem;
    }

    .mega-menu__grid > * {
      flex: 1 1 220px;
      min-width: 0;
    }

    .mega-menu__item {
      border: 1px solid #d8e6f3;
      border-radius: 12px;
      background: #fff;
      padding: 0.76rem;
      color: inherit;
      text-decoration: none;
      display: grid;
      gap: 0.35rem;
    }

    .mega-menu__item strong {
      color: #123f62;
      font-size: 0.91rem;
    }

    .mega-menu__item span {
      color: #4a6f8e;
      font-size: 0.78rem;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .mobile-menu {
      max-height: 0;
      overflow: hidden;
      transition: max-height 220ms ease;
      background: #f7fbff;
      border-top: 1px solid transparent;
    }

    .mobile-menu--open {
      max-height: calc(100vh - 62px);
      overflow-y: auto;
      overscroll-behavior: contain;
      border-top-color: #dce8f3;
    }

    .mobile-menu__inner {
      display: grid;
      gap: 0.45rem;
      padding-top: 0.85rem;
      padding-bottom: 0.9rem;
    }

    .mobile-menu__inner a,
    .mobile-menu__group > summary,
    .mobile-link-disabled {
      border: 1px solid #d5e6f4;
      border-radius: 10px;
      background: #fff;
      color: #173f5f;
      text-decoration: none;
      font-size: 0.9rem;
      padding: 0.58rem 0.72rem;
      font-family: var(--font-family-heading);
      letter-spacing: -0.02em;
    }

    .mobile-link-disabled {
      display: block;
      opacity: 0.62;
      cursor: default;
    }

    .mobile-menu__group {
      min-width: 0;
      border-radius: 12px;
    }

    .mobile-menu__group > summary {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      list-style: none;
      cursor: pointer;
      font-weight: 800;
    }

    .mobile-menu__group > summary::-webkit-details-marker {
      display: none;
    }

    .mobile-menu__group > summary::after {
      content: '';
      width: 0.5rem;
      height: 0.5rem;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
      transition: transform 160ms ease;
      opacity: 0.75;
      flex: 0 0 auto;
      margin-left: 0.8rem;
    }

    .mobile-menu__group[open] > summary {
      border-color: #99bddc;
      background: #e8f3fd;
      color: #0d426f;
    }

    .mobile-menu__group[open] > summary::after {
      transform: rotate(225deg) translate(-2px, -1px);
    }

    .mobile-subnav {
      display: grid;
      gap: 0.38rem;
      margin-top: 0.42rem;
      padding: 0.54rem;
      border: 1px solid #d9e8f4;
      border-radius: 14px;
      background: linear-gradient(180deg, #ffffff 0%, #f0f7fd 100%);
    }

    .mobile-subnav a {
      border-radius: 9px;
      background: #f8fcff;
      border-color: #e1edf6;
      font-size: 0.82rem;
      padding: 0.52rem 0.62rem;
      line-height: 1.3;
    }

    .mobile-subnav a:hover,
    .mobile-subnav a:focus {
      border-color: #a8c8e2;
      background: #ffffff;
      color: #0d426f;
      text-decoration: none;
    }

    .mobile-subnav__label {
      margin-top: 0.28rem;
      color: #a87b18;
      font-family: var(--font-family-heading);
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.15rem 0.25rem;
    }

    .mobile-subnav--sections a {
      display: grid;
      gap: 0.18rem;
    }

    .mobile-subnav--sections strong {
      color: #123f62;
      font-size: 0.84rem;
    }

    .mobile-subnav--sections span {
      color: #5c768c;
      font-size: 0.72rem;
      line-height: 1.35;
    }

    .mobile-menu__inner a.is-active {
      border-color: #99bddc;
      background: #e8f3fd;
      color: #0d426f;
    }

    .mobile-live-chat {
      display: inline-flex;
      align-items: center;
      gap: 0.42rem;
      border-color: #9fc1dd;
      background: #edf6ff;
      color: #124a75;
      font-weight: 700;
    }

    .apply-btn--mobile {
      display: inline-flex;
      justify-content: center;
    }

    @media (max-width: 1040px) {
      .utility-row__inner,
      .primary-row__inner {
        padding-left: 126px;
      }

      .brand-badge img {
        width: 104px;
        height: 156px;
      }
    }

    @media (max-width: 1020px) {
      .academics-flyout {
        right: 0;
        left: auto;
        min-width: 0;
        transform: translateY(12px);
      }

      .academics-flyout--open {
        transform: translateY(0);
      }

      .academics-flyout__grid {
        grid-template-columns: repeat(2, minmax(160px, 1fr));
      }

      .about-flyout {
        right: 0;
        left: auto;
        min-width: 0;
        width: min(760px, 88vw);
        transform: translateY(12px);
      }

      .about-flyout--open {
        transform: translateY(0);
      }

      .about-flyout__grid {
        grid-template-columns: repeat(2, minmax(160px, 1fr));
      }

      .about-flyout__intro {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 920px) {
      .utility-nav,
      .utility-chat,
      .primary-row {
        display: none;
      }

      .utility-row {
        border-bottom: none;
      }

      .utility-row__inner {
        min-height: 68px;
        padding-left: 110px;
        grid-template-columns: minmax(0, 1fr) auto;
        column-gap: 0.85rem;
      }

      .brand-badge {
        top: -14px;
      }

      .brand-badge img {
        width: 82px;
        height: 123px;
      }

      .mobile-toggle {
        display: inline-flex;
      }
    }

    @media (max-width: 520px) {
      .utility-row__inner {
        padding-left: 96px;
        padding-right: 0.3rem;
        min-height: 62px;
        column-gap: 0.7rem;
      }

      .brand-badge {
        top: -10px;
      }

      .brand-badge img {
        width: 68px;
        height: 102px;
      }

      .mobile-toggle {
        width: 44px;
        height: 38px;
        padding: 0.34rem;
      }

      .mobile-menu__inner a {
        font-size: 0.84rem;
        padding: 0.54rem 0.64rem;
      }
    }

    @media (max-width: 400px) {
      .utility-row__inner {
        padding-left: 84px;
        padding-right: 0.2rem;
        min-height: 58px;
      }

      .brand-badge img {
        width: 60px;
        height: 90px;
      }

      .mobile-toggle {
        width: 40px;
        height: 36px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly utilityLinks: readonly NavLink[] = [
    { label: 'Students', path: null, disabled: true },
    { label: 'Faculty & Staff', path: null, disabled: true },
    { label: 'Recruitment', path: null, disabled: true },
    { label: 'Visit', path: null, disabled: true },
    { label: 'Media', path: null, disabled: true },
    { label: 'Give', path: null, disabled: true },
    { label: 'Portal', path: null, disabled: true },
  ];

  readonly primaryLinks: readonly NavLink[] = [
    { label: 'About', path: '/about' },
    { label: 'Academics', path: '/faculties-schools' },
    { label: 'Research', path: '/research-innovation' },
    { label: 'News & Events', path: null, disabled: true },
    { label: 'Campus', path: null, disabled: true },
  ];

  readonly aboutMenuSummary =
    'Sankofa Alkebulan University advances African knowledge systems through research, scholarship, partnerships, and public engagement rooted in the Sankofa principle.';

  readonly aboutSectionLinks: readonly MegaLink[] = [
    { label: 'Founders & Chancellor', path: '/about', fragment: 'founders-chancellor-team' },
    { label: 'Executive Team', path: '/about/executive-team' },
    { label: 'Board of Governance', path: '/about/board-of-governance' },
    { label: 'Advisory Council', path: '/about/advisory-council' },
    { label: 'Research & Scholarly Team', path: '/about/research-scholarly-team' },
    { label: 'History of Sankofa', path: '/about/history-of-sankofa' },
  ];

  readonly aboutRelatedLinks: readonly MegaLink[] = [
    { label: 'Sankofa Charter', path: '/about/sankofa-charter' },
    { label: 'Sankofa Law Council', path: '/about/sankofa-law-council' },
    { label: 'Statute on Governance & Management', path: '/about/statute-on-governance-and-management' },
    { label: 'University Policies', path: '/about/university-policies' },
    { label: 'Job Opportunities', path: '/about/job-opportunities' },
  ];
      readonly academicsMega: readonly MegaColumn[] = [
    {
      title: 'Programmes',
      links: [
        { label: 'PhD Programmes', path: '/home/phd' },
        { label: 'Masters Degree Programmes', path: '/home/masters' },
        { label: 'Postgraduate Diploma Programmes', path: '/home/postgraduate-diploma' },
        { label: 'Bachelors Degree Programmes', path: '/home/bachelors' },
        { label: 'Diploma Programmes', path: '/home/diploma' },
        { label: 'Certificate Programmes', path: '/home/certificate' },
      ],
    },
    {
      title: 'Schools',
      links: [
        { label: 'Business School', path: '/home/Business School' },
        { label: 'Graduate School', path: '/home/Graduate School' },
        { label: 'School of Education', path: '/home/School of Education' },
        { label: 'School of Technology, Computing & Engineering', path: '/home/School of Technology, Computing & Engineering' },
        { label: 'Law School', path: '/home/Law School' },
      ],
    },
    {
      title: 'Institutes',
      links: [
        { label: 'Institute of Public Health & Health Sciences', path: '/home/Institute of Public Health & Health Sciences' },
        { label: 'Institute of African Culture, Science and Technology (IACST)', path: '/home/Institute of African Culture, Science and Technology (IACST)' },
      ],
    },
  ];

  readonly megaMenuItems = MEGA_MENU_ITEMS;
  readonly isMobileMenuOpen = signal(false);
  readonly isMegaMenuOpen = signal(false);
  readonly isAcademicsMenuOpen = signal(false);
  readonly isAboutMenuOpen = signal(false);
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
      this.isMegaMenuOpen.set(false);
      this.isAcademicsMenuOpen.set(false);
      this.isAboutMenuOpen.set(false);
    }
  }

  toggleMegaMenu(): void {
    this.isMegaMenuOpen.set(!this.isMegaMenuOpen());
    if (this.isMegaMenuOpen()) {
      this.isMobileMenuOpen.set(false);
      this.isAcademicsMenuOpen.set(false);
      this.isAboutMenuOpen.set(false);
    }
  }

  openAcademicsMenu(): void {
    if (this.academicsCloseTimer) {
      clearTimeout(this.academicsCloseTimer);
      this.academicsCloseTimer = null;
    }
    this.isAcademicsMenuOpen.set(true);
    this.isMegaMenuOpen.set(false);
    this.isAboutMenuOpen.set(false);
  }

  closeAcademicsMenuDelayed(): void {
    if (this.academicsCloseTimer) {
      clearTimeout(this.academicsCloseTimer);
    }
    this.academicsCloseTimer = setTimeout(() => {
      this.isAcademicsMenuOpen.set(false);
      this.academicsCloseTimer = null;
    }, 240);
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
    this.isMegaMenuOpen.set(false);
    this.isAcademicsMenuOpen.set(false);
  }

  closeAboutMenuDelayed(): void {
    if (this.aboutCloseTimer) {
      clearTimeout(this.aboutCloseTimer);
    }
    this.aboutCloseTimer = setTimeout(() => {
      this.isAboutMenuOpen.set(false);
      this.aboutCloseTimer = null;
    }, 240);
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
    this.isMegaMenuOpen.set(false);
    this.closeAcademicsMenu();
    this.closeAboutMenu();
  }
}











