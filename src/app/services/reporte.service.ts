import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReporteRequest, ReporteResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<ReporteResponse[]> {
    return this.http.get<ReporteResponse[]>(this.apiUrl);
  }

  listarPorResponsable(responsableId: number): Observable<ReporteResponse[]> {
    return this.http.get<ReporteResponse[]>(`${this.apiUrl}/responsable/${responsableId}`);
  }

  crear(payload: ReporteRequest): Observable<ReporteResponse> {
    return this.http.post<ReporteResponse>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: ReporteRequest): Observable<ReporteResponse> {
    return this.http.put<ReporteResponse>(`${this.apiUrl}/${id}/actualizar`, payload);
  }

  marcarVisto(id: number, responsableId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/visto?responsableId=${responsableId}`, {});
  }

  exportarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
