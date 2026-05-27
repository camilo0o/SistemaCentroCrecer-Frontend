import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FuncionarioRequest, FuncionarioResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class FuncionarioService {
  private apiUrl = `${environment.apiUrl}/funcionarios`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<FuncionarioResponse[]> {
    return this.http.get<FuncionarioResponse[]>(this.apiUrl);
  }

  listarActivos(): Observable<FuncionarioResponse[]> {
    return this.http.get<FuncionarioResponse[]>(`${this.apiUrl}/activos`);
  }

  obtenerPorId(id: number): Observable<FuncionarioResponse> {
   return this.http.get<FuncionarioResponse>(`${this.apiUrl}/${id}`);
  }

  crear(data: FuncionarioRequest): Observable<FuncionarioResponse> {
    return this.http.post<FuncionarioResponse>(this.apiUrl, data);
  }

  actualizar(id: number, data: FuncionarioRequest): Observable<FuncionarioResponse> {
    return this.http.put<FuncionarioResponse>(`${this.apiUrl}/${id}`, data);
  }

  darDeBaja(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  darDeAlta(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/alta`, {});
  }

  cambiarPassword(id: number, nuevaContrasenia: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cambiar-contrasenia`, { nuevaContrasenia });
  }

  blanquearPassword(id: number, nuevaContrasenia: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/blanquear-contrasenia`, { nuevaContrasenia });
  }
}