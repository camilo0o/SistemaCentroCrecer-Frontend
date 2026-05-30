import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const ROLES_FUNCIONARIO = [
  'ADMINISTRADOR_SISTEMA','COORDINADORA','PSICOLOGO',
  'MAESTRA','ASISTENTE_SOCIAL','TALLERISTA_EXPRESION_PLASTICA',
  'TALLERISTA_PSICOMOTRICIDAD','COCINERA','AUXILIAR_LIMPIEZA'
];

function redirectSegunRol(auth: AuthService, router: Router): false {
  const rol = auth.getRol();
  if (!rol) { router.navigate(['/iniciarSesion']); return false; }
  if (rol === 'ADMINISTRADOR_SISTEMA') router.navigate(['/admin/dashboard']);
  else if (rol === 'RESPONSABLE')      router.navigate(['/dashboard/responsable']);
  else                                 router.navigate(['/dashboard/funcionario']);
  return false;
}

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
 
  if (!authService.isLoggedIn()) {
    router.navigate(['/iniciarSesion']);
    return false;
  }

  // Si el funcionario tiene pendiente un cambio obligatorio de contraseña,
  // sólo puede acceder a /perfil
  if (authService.mustChangePassword() && state.url !== '/perfil') {
    router.navigate(['/perfil']);
    return false;
  }

  return true;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/iniciarSesion']); return false; }
  if (auth.mustChangePassword()) { router.navigate(['/perfil']); return false; }
  if (auth.isAdmin()) return true;
  return redirectSegunRol(auth, router);
};

export const funcionarioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/iniciarSesion']); return false; }
  if (auth.mustChangePassword()) { router.navigate(['/perfil']); return false; }
  const rol = auth.getRol();
  if (rol && ROLES_FUNCIONARIO.includes(rol)) return true;
  return redirectSegunRol(auth, router);
};

export const responsableGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/iniciarSesion']); return false; }
  if (auth.getRol() === 'RESPONSABLE') return true;
  return redirectSegunRol(auth, router);
};

 
export const rolGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) { router.navigate(['/iniciarSesion']); return false; }
    const rol = auth.getRol();
    if (rol && rolesPermitidos.includes(rol)) return true;
    return redirectSegunRol(auth, router);
  };
};