import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { Toasts } from './feedback';
import { StaffSession } from './staff-session';
import type { Permission } from './types';

/** The console proper: only for someone the server recognises. */
export const signedIn: CanActivateFn = async (_route, state) => {
  const session = inject(StaffSession);
  const router = inject(Router);
  try {
    if (await session.restore()) {
      return true;
    }
  } catch {
    // The server could not be reached; the sign-in screen explains what to do.
  }
  return router.createUrlTree(['/admin/sign-in'], { queryParams: { next: state.url === '/admin' ? undefined : state.url } });
};

/** Sign-in and link pages: someone already signed in goes straight to the console. */
export const signedOut: CanActivateFn = async () => {
  const session = inject(StaffSession);
  try {
    if (await session.restore()) {
      return inject(Router).createUrlTree(['/admin']);
    }
  } catch {
    // Show the page; it will report the connection problem when used.
  }
  return true;
};

/** A part of the console that needs a particular permission. */
export function allowed(permission: Permission): CanActivateFn {
  return () => {
    const session = inject(StaffSession);
    if (session.can(permission)) {
      return true;
    }
    inject(Toasts).error('Your role does not include that part of the console.');
    return inject(Router).createUrlTree(['/admin']);
  };
}
