import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClient, ApiError } from '../../core/api/api-client';
import type { Me, Permission } from './types';

/**
 * Who is signed in to the console. The session itself lives in an HttpOnly
 * cookie the browser cannot read; this service only remembers what the
 * server said about the person holding it.
 */
@Injectable({ providedIn: 'root' })
export class StaffSession {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private pending: Promise<Me | null> | null = null;

  readonly me = signal<Me | null>(null);

  can(permission: Permission): boolean {
    return this.me()?.permissions.includes(permission) ?? false;
  }

  /** Asks the server who this is, at most once at a time. Resolves null when nobody is signed in. */
  restore(): Promise<Me | null> {
    const known = this.me();
    if (known) {
      return Promise.resolve(known);
    }
    this.pending ??= this.api
      .get<Me>('/admin/auth/me')
      .then((me) => {
        this.me.set(me);
        return me;
      })
      .catch((error: unknown) => {
        if (ApiError.from(error).status === 401) {
          return null;
        }
        throw error;
      })
      .finally(() => {
        this.pending = null;
      });
    return this.pending;
  }

  /** Re-reads roles and permissions, e.g. after an administrator changed them. */
  async refresh(): Promise<Me> {
    const me = await this.api.get<Me>('/admin/auth/me');
    this.me.set(me);
    return me;
  }

  async signIn(email: string, password: string): Promise<Me> {
    await this.api.post('/admin/auth/sign-in', { email, password });
    return this.refresh();
  }

  async signOut(): Promise<void> {
    try {
      await this.api.post('/admin/auth/sign-out');
    } catch {
      // The cookie is cleared server-side when the session is found; if the
      // request failed the session will still expire on its own.
    }
    this.me.set(null);
    await this.router.navigateByUrl('/admin/sign-in');
  }

  /** The server stopped recognising the session (expired, revoked, or suspended). */
  ended(): void {
    if (!this.me()) {
      return;
    }
    this.me.set(null);
    const next = this.router.url.startsWith('/admin') && !this.router.url.startsWith('/admin/sign-in') ? this.router.url : undefined;
    void this.router.navigate(['/admin/sign-in'], { queryParams: { next, ended: 1 } });
  }
}
