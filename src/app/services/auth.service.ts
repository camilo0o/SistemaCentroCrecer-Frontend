import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse } from '../models/models';

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
  if (res.token) {
    localStorage.setItem('token', res.token);
  }
  localStorage.setItem('rol', res.rol);
  localStorage.setItem('nombre', res.nombreCompleto);
  localStorage.setItem('email', res.email);
  localStorage.setItem('userId', res.id.toString());

  // Guardar foto de perfil si viene en el login
  if (res.fotoPerfil) {
    localStorage.setItem('fotoPerfil', res.fotoPerfil);
  } else {
    localStorage.removeItem('fotoPerfil');
  }

  if (res.mustChangePassword) {
    localStorage.setItem('mustChangePassword', 'true');
  } else {
    localStorage.removeItem('mustChangePassword');
  }
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

  getEmail(): string | null { 
    return localStorage.getItem('email'); 
  }

  getUserId(): number | null {
    const v = localStorage.getItem('userId');
    return v ? Number(v) : null;
  }

  mustChangePassword(): boolean {
    return localStorage.getItem('mustChangePassword') === 'true';
  }

  clearMustChangePassword() {
    localStorage.removeItem('mustChangePassword');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  
  isAdmin(): boolean {
    return this.getRol() === 'ADMINISTRADOR_SISTEMA';
  }
 
  isCoordinadora(): boolean {
    return this.getRol() === 'COORDINADORA';
  }
 
  canManageNinos(): boolean {
    const rol = this.getRol();
    return ['COORDINADORA', 'PSICOLOGO', 'MAESTRA', 'ASISTENTE_SOCIAL'].includes(rol ?? '');
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/iniciarSesion']);
  }
}