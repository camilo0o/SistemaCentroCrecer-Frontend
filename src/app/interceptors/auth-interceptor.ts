import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Evita disparar varios logout en paralelo si caen varias requests con 401
// al mismo tiempo (ej: el dashboard pide 3 cosas a la vez al expirar el token).
let cerrandoSesionPorVencimiento = false;
const TIEMPO_MAXIMO_REQUEST_MS = 15000;

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

  const request = next(req.clone({ withCredentials: true }));
  const puedeAplicarTimeout = req.method === 'GET'
    && req.responseType !== 'blob'
    && !(req.body instanceof FormData);

  return (puedeAplicarTimeout ? request.pipe(timeout(TIEMPO_MAXIMO_REQUEST_MS)) : request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse
          && error.status === 401
          && !esLlamadaDeAuth
          && !cerrandoSesionPorVencimiento) {
        cerrandoSesionPorVencimiento = true;
        authService.logout();
        setTimeout(() => { cerrandoSesionPorVencimiento = false; }, 2000);
      }
      return throwError(() => error);
    })
  );
};
