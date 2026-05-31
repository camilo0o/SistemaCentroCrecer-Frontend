import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  AsistenciaResponse,
  AsistenciaNinioRequest,
  RegistroEntradaFuncionarioRequest,
  NinioResponse
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private apiUrl = `${environment.apiUrl}/asistencias`;

  constructor(private http: HttpClient) {}

  // ── Mi entrada/salida (funcionario autenticado) ──────────────────────────

  registrarMiEntrada(dto: RegistroEntradaFuncionarioRequest): Observable<AsistenciaResponse> {
    return this.http.post<AsistenciaResponse>(`${this.apiUrl}/mi-entrada`, dto);
  }

  registrarMiSalida(horaSalida: string, fecha?: string): Observable<AsistenciaResponse> {
    const body: any = { horaSalida };
    if (fecha) body['fecha'] = fecha;
    return this.http.put<AsistenciaResponse>(`${this.apiUrl}/mi-salida`, body);
  }

  obtenerMiRegistroDelDia(fecha?: string): Observable<AsistenciaResponse | null> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<AsistenciaResponse>(
      `${this.apiUrl}/mi-registro`,
      { params, observe: 'response' }
    ).pipe(
      map(res => res.status === 204 ? null : res.body)
    );
  }

  // ── Niños de mis grupos ──────────────────────────────────────────────────

  listarNiniosDisponibles(): Observable<NinioResponse[]> {
    return this.http.get<NinioResponse[]>(`${this.apiUrl}/mis-ninios-disponibles`);
  }

  marcarAsistenciaNinio(dto: AsistenciaNinioRequest): Observable<AsistenciaResponse> {
    return this.http.post<AsistenciaResponse>(`${this.apiUrl}/ninio`, dto);
  }

  listarAsistenciasDeNinosPorFecha(fecha?: string): Observable<AsistenciaResponse[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<AsistenciaResponse[]>(`${this.apiUrl}/mis-ninios`, { params });
  }

  registrarSalidaNinio(asistenciaId: number, horaSalida: string): Observable<AsistenciaResponse> {
    return this.http.put<AsistenciaResponse>(`${this.apiUrl}/ninio/${asistenciaId}/salida`, { horaSalida });
  }
}