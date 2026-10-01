import { Injectable, computed, inject, signal } from '@angular/core';
import { ConsoleApi } from './console-api';
import { StaffSession } from './staff-session';
import type { DirectoryEntry, Office, OfficeRoute, Overview, SystemStatus } from './types';
import { OFFICE_NAMES } from './vocabulary';

/**
 * What every screen of the console shares: the waiting counts on the
 * navigation, office names, who can be assigned work, and whether email
 * and payments are switched on. Loaded once, refreshed when work changes.
 */
@Injectable({ providedIn: 'root' })
export class ConsoleState {
  private readonly api = inject(ConsoleApi);
  private readonly session = inject(StaffSession);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private directoryLoad: Promise<void> | null = null;

  readonly overview = signal<Overview | null>(null);
  readonly system = signal<SystemStatus | null>(null);
  readonly offices = signal<readonly OfficeRoute[]>([]);
  readonly directory = signal<readonly DirectoryEntry[]>([]);

  readonly emailConfigured = computed(() => this.system()?.email.configured ?? false);

  readonly badges = computed(() => {
    const overview = this.overview();
    return {
      inbox: overview?.inquiries?.new ?? 0,
      admissions: overview?.applications?.awaitingDecision ?? 0,
      store: (overview?.store?.awaitingPayment ?? 0) + (overview?.store?.toFulfil ?? 0),
    };
  });

  officeName(office: Office): string {
    return this.offices().find((route) => route.office === office)?.label ?? OFFICE_NAMES[office];
  }

  /** First load after sign-in. Failures here never block the console. */
  async load(): Promise<void> {
    await Promise.allSettled([this.loadOverview(), this.loadSystem(), this.loadOffices()]);
  }

  async loadOverview(): Promise<Overview | null> {
    if (!this.session.can('overview.read')) {
      return null;
    }
    const overview = await this.api.get<Overview>('/overview');
    this.overview.set(overview);
    return overview;
  }

  async loadSystem(): Promise<void> {
    if (this.session.can('overview.read')) {
      this.system.set(await this.api.get<SystemStatus>('/settings/system'));
    }
  }

  async loadOffices(): Promise<void> {
    this.offices.set(await this.api.get<OfficeRoute[]>('/settings/offices'));
  }

  /** People who can be assigned work. Fetched the first time a menu needs it. */
  ensureDirectory(): Promise<void> {
    if (this.directory().length) {
      return Promise.resolve();
    }
    this.directoryLoad ??= this.api
      .get<DirectoryEntry[]>('/staff/directory')
      .then((list) => this.directory.set(list))
      .finally(() => {
        this.directoryLoad = null;
      });
    return this.directoryLoad;
  }

  /** Something changed that the navigation counts depend on; collect bursts into one request. */
  refreshSoon(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      void this.loadOverview().catch(() => undefined);
    }, 600);
  }

  reset(): void {
    this.overview.set(null);
    this.system.set(null);
    this.offices.set([]);
    this.directory.set([]);
  }
}
