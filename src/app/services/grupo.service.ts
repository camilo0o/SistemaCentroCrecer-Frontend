import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GrupoResponse, GrupoRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class GrupoService {
  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<GrupoResponse[]> {
    return this.http.get<GrupoResponse[]>(this.apiUrl);
  }

  listarActivos(): Observable<GrupoResponse[]> {
    return this.http.get<GrupoResponse[]>(`${this.apiUrl}/activos`);
  }

  crear(dto: GrupoRequest): Observable<GrupoResponse> {
    return this.http.post<GrupoResponse>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: GrupoRequest): Observable<GrupoResponse> {
    return this.http.put<GrupoResponse>(`${this.apiUrl}/${id}/actualizar`, dto);
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/baja`, {});
  }
}