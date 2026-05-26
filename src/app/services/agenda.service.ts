import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AgendaResponse, AgendaRequest, TipoAgendaResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private apiUrl      = `${environment.apiUrl}/agendas`;
  private tiposUrl    = `${environment.apiUrl}/tiposagendas`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<AgendaResponse[]> {
    return this.http.get<AgendaResponse[]>(this.apiUrl);
  }

  listarActivas(): Observable<AgendaResponse[]> {
    return this.http.get<AgendaResponse[]>(`${this.apiUrl}/activos`);
  }

  listarPorFuncionario(funcionarioId: number): Observable<AgendaResponse[]> {
    return this.http.get<AgendaResponse[]>(`${this.apiUrl}/filtrar`, {
      params: new HttpParams().set('funcionarioId', funcionarioId)
    });
  }

  obtenerPorId(id: number): Observable<AgendaResponse> {
    return this.http.get<AgendaResponse>(`${this.apiUrl}/${id}`);
  }

  crear(data: AgendaRequest): Observable<AgendaResponse> {
    return this.http.post<AgendaResponse>(this.apiUrl, data);
  }

  actualizar(id: number, data: AgendaRequest): Observable<AgendaResponse> {
    return this.http.put<AgendaResponse>(`${this.apiUrl}/${id}`, data);
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  darDeAlta(id: number): Observable<AgendaResponse> {
    return this.http.patch<AgendaResponse>(`${this.apiUrl}/${id}/alta`, {});
  }

  listarTipos(): Observable<TipoAgendaResponse[]> {
    return this.http.get<TipoAgendaResponse[]>(this.tiposUrl);
  }
}