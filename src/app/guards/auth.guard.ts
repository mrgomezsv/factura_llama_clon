import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Guard que protege rutas requiriendo autenticación
 * Si el usuario no está autenticado, redirige a /login
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    take(1),
    map(isAuth => {
      if (isAuth) {
        return true;
      } else {
        router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return false;
      }
    })
  );
};

/**
 * Guard que previene acceso a rutas de autenticación si ya está logueado
 * Si el usuario está autenticado, redirige a /dtes
 */
export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    take(1),
    map(isAuth => {
      if (isAuth) {
        router.navigate(['/dtes']);
        return false;
      } else {
        return true;
      }
    })
  );
};
