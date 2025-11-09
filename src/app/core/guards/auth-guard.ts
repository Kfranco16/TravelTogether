import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

/* export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuth()) return true;
  router.navigateByUrl('/login');
  return false;
}; */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  //si me logado y si existe token ()
  // redux, stagejs. Pero de forma nativa localstorage
  //existe token en el localstorage
  let token = localStorage.getItem('token') || null;
  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
