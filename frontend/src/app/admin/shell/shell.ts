import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ConsoleState } from '../core/console-state';
import { InitialsPipe } from '../core/format';
import { StaffSession } from '../core/staff-session';
import type { Permission } from '../core/types';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly permission: Permission;
  readonly exact?: boolean;
  readonly badge?: 'inbox' | 'admissions' | 'store';
}

const NAVIGATION: ReadonlyArray<{ label: string; links: readonly NavLink[] }> = [
  {
    label: 'Today',
    links: [{ path: '/admin', label: 'Daybook', icon: 'pi-sun', permission: 'overview.read', exact: true }],
  },
  {
    label: 'The work',
    links: [
      { path: '/admin/inbox', label: 'Inbox', icon: 'pi-inbox', permission: 'inquiries.read', badge: 'inbox' },
      { path: '/admin/admissions', label: 'Admissions', icon: 'pi-graduation-cap', permission: 'applications.read', badge: 'admissions' },
      { path: '/admin/events', label: 'Events', icon: 'pi-calendar', permission: 'events.read' },
      { path: '/admin/store', label: 'Store', icon: 'pi-shopping-bag', permission: 'store.read', badge: 'store' },
      { path: '/admin/journal', label: 'Journal', icon: 'pi-book', permission: 'journal.read' },
      { path: '/admin/audience', label: 'Mailing list', icon: 'pi-megaphone', permission: 'audience.read' },
    ],
  },
  {
    label: 'The institution',
    links: [
      { path: '/admin/team', label: 'Team', icon: 'pi-users', permission: 'staff.read' },
      { path: '/admin/audit', label: 'Audit log', icon: 'pi-history', permission: 'audit.read' },
      { path: '/admin/settings', label: 'Settings', icon: 'pi-cog', permission: 'overview.read' },
    ],
  },
];

const REFRESH_EVERY_MS = 90_000;

@Component({
  selector: 'sc-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgOptimizedImage, InitialsPipe],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly session = inject(StaffSession);
  protected readonly state = inject(ConsoleState);
  private readonly router = inject(Router);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  protected readonly menuOpen = signal(false);

  protected readonly groups = computed(() => {
    this.session.me();
    return NAVIGATION.map((group) => ({
      label: group.label,
      links: group.links.filter((link) => this.session.can(link.permission)),
    })).filter((group) => group.links.length > 0);
  });

  protected readonly roleLine = computed(() => {
    const me = this.session.me();
    return me ? me.title || me.roleLabels.join(' · ') : '';
  });

  constructor() {
    void this.state.load();

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void this.state.loadOverview().catch(() => undefined);
      }
    }, REFRESH_EVERY_MS);

    let first = true;
    const navigation = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen.set(false);
      // After moving to another screen, start keyboard and screen-reader users at its content.
      if (!first) {
        this.main().nativeElement.focus({ preventScroll: true });
      }
      first = false;
    });

    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      navigation.unsubscribe();
    });
  }

  /** With a <base href>, a bare "#id" link would leave the page; move focus instead. */
  protected skip(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  protected badge(link: NavLink): number {
    return link.badge ? this.state.badges()[link.badge] : 0;
  }

  protected async signOut(): Promise<void> {
    this.state.reset();
    await this.session.signOut();
  }
}
