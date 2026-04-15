import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard = (route: any, state: any) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    return true;
  } else {
    const requestedUrl = state?.url || '/home';
    router.navigate(['/login'], {
      queryParams: {
        returnUrl: requestedUrl,
        checkout: requestedUrl.startsWith('/payment') ? '1' : null,
      },
    });
    return false;
  }
};

export const adminGuard = (route: any, state: any) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // During SSR/prerendering, window is not available
  if (typeof window === 'undefined') {
    console.log('SSR mode - allowing admin route');
    return true;
  }

  console.log('Admin guard check:', {
    isAuthenticated: authService.isAuthenticated,
    isAdmin: authService.isAdmin,
    currentUser: authService.currentUser
  });

  if (authService.isAuthenticated && authService.isAdmin) {
    console.log('Admin guard passed');
    return true;
  } else {
    console.log('Admin guard failed, redirecting to admin login');
    router.navigate(['/admin-login']);
    return false;
  }
};
