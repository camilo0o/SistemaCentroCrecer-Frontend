import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AgendaLimpiezaRequest,
  AgendaLimpiezaResponse,
  EstadoLimpieza,
  SubtipoAgendaResponse
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class AgendaLimpiezaService {
  private apiUrl     = `${environment.apiUrl}/agendaslimpiezas`;
  private subtiposUrl = `${environment.apiUrl}/subtiposagendas`;

  constructor(private http: HttpClient) {}

  listarTodas(): Observable<AgendaLimpiezaResponse[]> {
    return this.http.get<AgendaLimpiezaResponse[]>(this.apiUrl);
  }

  listarPorFuncionario(funcionarioId: number): Observable<AgendaLimpiezaResponse[]> {
    return this.http.get<AgendaLimpiezaResponse[]>(`${this.apiUrl}/funcionario/${funcionarioId}`);
  }

  listarPorEstado(estado: EstadoLimpieza): Observable<AgendaLimpiezaResponse[]> {
    return this.http.get<AgendaLimpiezaResponse[]>(`${this.apiUrl}/estado/${estado}`);
  }

  obtenerPorId(id: number): Observable<AgendaLimpiezaResponse> {
    return this.http.get<AgendaLimpiezaResponse>(`${this.apiUrl}/${id}`);
  }

  crear(data: AgendaLimpiezaRequest): Observable<AgendaLimpiezaResponse> {
    return this.http.post<AgendaLimpiezaResponse>(this.apiUrl, data);
  }

  actualizar(id: number, data: AgendaLimpiezaRequest): Observable<AgendaLimpiezaResponse> {
    return this.http.put<AgendaLimpiezaResponse>(`${this.apiUrl}/${id}`, data);
  }

  cambiarEstado(id: number, estado: EstadoLimpieza): Observable<AgendaLimpiezaResponse> {
    return this.http.patch<AgendaLimpiezaResponse>(`${this.apiUrl}/${id}/estado`, null, {
      params: { estado }
    });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarSubtipos(): Observable<SubtipoAgendaResponse[]> {
    return this.http.get<SubtipoAgendaResponse[]>(this.subtiposUrl);
  }
}
