import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
 
  if (authService.isLoggedIn()) {
    return true;
  }
  router.navigate(['/Iniciar-Sesion']);
  return false;
};
 
export const rolGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
 
    if (!authService.isLoggedIn()) {
      router.navigate(['/Iniciar-Sesion']);
      return false;
    }
 
    const rol = authService.getRol();
    if (rol && rolesPermitidos.includes(rol)) {
      return true;
    }
 
    // Redirigir al dashboard correspondiente
    router.navigate(['/dashboard']);
    return false;
  };
};
