import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ActualizarPerfilRequest {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  fotoPerfil?: string;
}

export interface CambiarContraseniaSeguraRequest {
  contraseniaActual: string;
  nuevaContrasenia: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  constructor(private http: HttpClient) {}

  // Funcionarios
  actualizarPerfilFuncionario(id: number, data: ActualizarPerfilRequest): Observable<any> {
    return this.http.put(`${environment.apiUrl}/funcionarios/${id}/perfil`, data);
  }

  cambiarPasswordFuncionario(id: number, data: CambiarContraseniaSeguraRequest): Observable<any> {
    return this.http.put(`${environment.apiUrl}/funcionarios/${id}/cambiar-contrasenia-seguro`, data);
  }

  obtenerFuncionario(id: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/funcionarios/${id}`);
  }

  // Responsables
  actualizarPerfilResponsable(id: number, data: ActualizarPerfilRequest): Observable<any> {
    return this.http.put(`${environment.apiUrl}/responsables/${id}/perfil`, data);
  }

  cambiarPasswordResponsable(id: number, data: CambiarContraseniaSeguraRequest): Observable<any> {
    return this.http.put(`${environment.apiUrl}/responsables/${id}/cambiar-contrasenia-seguro`, data);
  }

  obtenerResponsable(id: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/responsables/${id}`);
  }
}