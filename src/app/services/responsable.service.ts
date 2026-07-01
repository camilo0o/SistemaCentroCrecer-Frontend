import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResponsableResponse, ResponsableNinioResponse, ResponsableNinioRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ResponsableService {
  private apiUrl = `${environment.apiUrl}/responsables`;
  private apiNinioUrl = `${environment.apiUrl}/responsables-ninios`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<ResponsableResponse[]> {
    return this.http.get<ResponsableResponse[]>(this.apiUrl);
  }

  listarActivos(): Observable<ResponsableResponse[]> {
    return this.http.get<ResponsableResponse[]>(`${this.apiUrl}/activos`);
  }

  obtenerPorId(id: number): Observable<ResponsableResponse> {
    return this.http.get<ResponsableResponse>(`${this.apiUrl}/${id}`);
  }

  activar(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activar`, {});
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarRelaciones(): Observable<ResponsableNinioResponse[]> {
    return this.http.get<ResponsableNinioResponse[]>(this.apiNinioUrl);
  }

  listarRelacionesPorNinio(ninioId: number): Observable<ResponsableNinioResponse[]> {
    return this.http.get<ResponsableNinioResponse[]>(`${this.apiNinioUrl}/por-ninio/${ninioId}`);
  }

  vincular(data: ResponsableNinioRequest): Observable<ResponsableNinioResponse> {
    return this.http.post<ResponsableNinioResponse>(this.apiNinioUrl, data);
  }

  desvincular(relacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiNinioUrl}/${relacionId}/eliminar`);
  }

  actualizarRelacion(id: number, data: ResponsableNinioRequest): Observable<ResponsableNinioResponse> {
    return this.http.put<ResponsableNinioResponse>(`${this.apiNinioUrl}/${id}/actualizar`, data);
  }
}