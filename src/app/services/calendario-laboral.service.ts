import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TipoDiaNoLaborable = 'FERIADO' | 'VACACIONES' | 'PARO' | 'SUSPENSION' | 'OTRO';

export interface DiaNoLaborableResponse {
  id: number;
  fecha: string;
  motivo: string;
  tipo: TipoDiaNoLaborable;
  activo: boolean;
}

export interface DiaNoLaborableRequest {
  fecha: string;
  motivo: string;
  tipo: TipoDiaNoLaborable;
}

@Injectable({ providedIn: 'root' })
export class CalendarioLaboralService {
  private apiUrl = `${environment.apiUrl}/calendario-laboral`;

  constructor(private http: HttpClient) {}

  listar(desde: string, hasta: string): Observable<DiaNoLaborableResponse[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<DiaNoLaborableResponse[]>(this.apiUrl, { params });
  }

  crear(dto: DiaNoLaborableRequest): Observable<DiaNoLaborableResponse> {
    return this.http.post<DiaNoLaborableResponse>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: DiaNoLaborableRequest): Observable<DiaNoLaborableResponse> {
    return this.http.put<DiaNoLaborableResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
