
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('access_token');

  if (token) {
    await firstValueFrom(authService.userLoaded$.pipe(filter(loaded => loaded)));

    if (authService.isAuthenticated()) {
      if (authService.isAdmin()) {
        return true;
      } else {
        router.navigate(['/']);
        return false;
      }
    } else {
      router.navigate(['/private/user/me/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  } else {
    router.navigate(['/private/user/me/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};

export const publicOnlyGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('access_token');

  if (token) {
    await firstValueFrom(authService.userLoaded$.pipe(filter(loaded => loaded)));

    if (authService.isAuthenticated()) {
      router.navigate(['/admin']);
      return false;
    }
  }

  return true;
};
