import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  token: string;
  tipoToken: string;
  rol: string;
  id: number;
  nombreCompleto: string;
  correo: string;
  expiracion: number;
}
 
export interface LoginRequest {
  correo: string;
  password: string;
}



@Injectable({ providedIn: 'root' })
export class AuthService {
 
  private apiUrl = `${environment.apiUrl}/auth`;
 
  constructor(private http: HttpClient, private router: Router) {}
 
  loginFuncionario(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/funcionario/login`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }
 
  loginResponsable(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/responsable/login`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }
 
  private saveSession(res: LoginResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('rol', res.rol);
    localStorage.setItem('nombre', res.nombreCompleto);
    localStorage.setItem('correo', res.correo);
    localStorage.setItem('userId', res.id.toString());
  }
 
  getToken(): string | null {
    return localStorage.getItem('token');
  }
 
  getRol(): string | null {
    return localStorage.getItem('rol');
  }
 
  getNombre(): string | null {
    return localStorage.getItem('nombre');
  }
 
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
 
  logout() {
    localStorage.clear();
    this.router.navigate(['/Iniciar-Sesion']);
  }
}
