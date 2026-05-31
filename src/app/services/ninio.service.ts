import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CondicionMedicaResponse, NinioResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NinioService {
  private apiUrl = `${environment.apiUrl}/ninios`;
  private condicionesUrl = `${environment.apiUrl}/condiciones-medicas`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<NinioResponse[]> {
    return this.http.get<NinioResponse[]>(this.apiUrl);
  }

  crear(dto: any): Observable<NinioResponse> {
    return this.http.post<NinioResponse>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: any): Observable<NinioResponse> {
    return this.http.put<NinioResponse>(`${this.apiUrl}/${id}/actualizar`, dto);
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/baja`);
  }

  obtenerCondiciones(ninioId: number): Observable<CondicionMedicaResponse[]> {
    return this.http.get<CondicionMedicaResponse[]>(
      `${this.condicionesUrl}?ninioId=${ninioId}`
    );
  }
}