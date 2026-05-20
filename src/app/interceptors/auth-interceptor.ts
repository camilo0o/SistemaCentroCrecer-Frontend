import { HttpInterceptorFn, HttpClientModule } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('INTERCEPTOR RUNNING, token:', localStorage.getItem('token'));
  const token = localStorage.getItem('token');

 if (token) {
    return next(req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    }));
  }
  return next(req);
};
