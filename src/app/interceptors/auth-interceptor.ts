import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Evita disparar varios logout en paralelo si caen varias requests con 401
// al mismo tiempo (ej: el dashboard pide 3 cosas a la vez al expirar el token).
let cerrandoSesionPorVencimiento = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('cloudinary.com')) {
    return next(req);
  }

  // El JWT viaja en una cookie httpOnly que el navegador adjunta solo si
  // mandamos withCredentials. Ya no leemos ni mandamos el token a mano.
  const authService = inject(AuthService);

  // Las llamadas de login/logout también pueden devolver 401 (ej: credenciales
  // inválidas), pero eso no significa "se venció la sesión" — esos casos los
  // maneja cada componente con su propio error handler, no acá.
  const esLlamadaDeAuth = req.url.includes('/auth/');

  return next(req.clone({ withCredentials: true })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !esLlamadaDeAuth && !cerrandoSesionPorVencimiento) {
        cerrandoSesionPorVencimiento = true;
        authService.logout();
        setTimeout(() => { cerrandoSesionPorVencimiento = false; }, 2000);
      }
      return throwError(() => error);
    })
  );
};