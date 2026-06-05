import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TurnoRequest, TurnoResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private apiUrl = `${environment.apiUrl}/turnos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<TurnoResponse[]> {
    return this.http.get<TurnoResponse[]>(this.apiUrl);
  }

  listarActivos(): Observable<TurnoResponse[]> {
    return this.http.get<TurnoResponse[]>(`${this.apiUrl}/activos`);
  }

  obtenerPorId(id: number): Observable<TurnoResponse> {
    return this.http.get<TurnoResponse>(`${this.apiUrl}/${id}`);
  }

  crear(data: TurnoRequest): Observable<TurnoResponse> {
    return this.http.post<TurnoResponse>(this.apiUrl, data);
  }

  actualizar(id: number, data: TurnoRequest): Observable<TurnoResponse> {
    return this.http.put<TurnoResponse>(`${this.apiUrl}/${id}`, data);
  }

  darDeBaja(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  reactivar(id: number): Observable<TurnoResponse> {
    return this.http.put<TurnoResponse>(`${this.apiUrl}/${id}/reactivar`, {});
  }
}