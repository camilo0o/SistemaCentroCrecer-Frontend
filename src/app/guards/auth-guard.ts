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

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { 
    router.navigate(['/Iniciar-Sesion']); return false; 
  }
  if (auth.isAdmin()) return true;
  router.navigate(['/dashboard/funcionario']);
  return false;
};
 
export const rolGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
 
    if (!authService.isLoggedIn()) {
      router.navigate(['/Iniciar-Sesion']);
      return false;
    }
 
    const rol = authService.getRol();
    if (rol && rolesPermitidos.includes(rol)) return true;
    if (authService.isAdmin()) router.navigate(['/dashboard/admin']);
    else router.navigate(['/dashboard/funcionario']);
    // Redirigir al dashboard correspondiente
    return false;
  };
};
