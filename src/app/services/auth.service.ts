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
    return this.http.post<LoginResponse>(`${this.apiUrl}/funcionario/login`, data, { withCredentials: true }).pipe(
      tap(res => this.saveSession(res))
    );
  }
 
  loginResponsable(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/responsable/login`, data, { withCredentials: true }).pipe(
      tap(res => this.saveSession(res))
    );
  }
 
 private saveSession(res: LoginResponse) {
  // El JWT ya no pasa por acá: lo setea el backend como cookie httpOnly.
  // Esto guarda solo datos de UI, no credenciales.
  localStorage.setItem('sesionIniciada', 'true');
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
    return localStorage.getItem('sesionIniciada') === 'true';
  }
  
  isAdmin(): boolean {
    const rol = this.getRol();
    return rol === 'ADMIN' || rol === 'ADMINISTRADOR_SISTEMA';
  }
 
  isCoordinadora(): boolean {
    return this.getRol() === 'COORDINADORA';
  }
 
  canManageNinos(): boolean {
    const rol = this.getRol();
    return ['COORDINADORA', 'PSICOLOGO', 'MAESTRA', 'ASISTENTE_SOCIAL'].includes(rol ?? '');
  }

  logout() {
    // Avisamos al backend para que invalide la cookie httpOnly. Si la
    // request falla (red caída, etc.) igual limpiamos el estado local
    // y mandamos al usuario al login.
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.finalizarSesionLocal(),
      error: () => this.finalizarSesionLocal()
    });
  }

  private finalizarSesionLocal() {
    localStorage.clear();
    this.router.navigate(['/iniciarSesion']);
  }
}
