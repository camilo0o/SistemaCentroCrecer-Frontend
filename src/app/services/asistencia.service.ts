import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  AsistenciaResponse,
  AsistenciaNinioRequest,
  RegistroEntradaFuncionarioRequest,
  RegistroSalidaFuncionarioRequest,
  RegistroSalidaNinioRequest,
  FrecuenciaAsistenciaResponse,
  NinioResponse
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private apiUrl = `${environment.apiUrl}/asistencias`;

  constructor(private http: HttpClient) {}

  registrarMiEntrada(dto: RegistroEntradaFuncionarioRequest): Observable<AsistenciaResponse> {
    return this.http.post<AsistenciaResponse>(`${this.apiUrl}/mi-entrada`, dto);
  }

  registrarMiSalida(dto: RegistroSalidaFuncionarioRequest): Observable<AsistenciaResponse> {
    return this.http.put<AsistenciaResponse>(`${this.apiUrl}/mi-salida`, dto);
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

  listarAsistenciasPorNinios(ninioIds: number[], fecha?: string): Observable<AsistenciaResponse[]> {
    let params = new HttpParams();
    ninioIds.forEach(id => params = params.append('ninioIds', id));
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<AsistenciaResponse[]>(`${this.apiUrl}/por-ninios`, { params });
  }

  registrarSalidaNinio(asistenciaId: number, dto: RegistroSalidaNinioRequest): Observable<AsistenciaResponse> {
    return this.http.put<AsistenciaResponse>(`${this.apiUrl}/ninio/${asistenciaId}/salida`, dto);
  }

  historialPorCedula(cedula: string): Observable<AsistenciaResponse[]> {
    return this.http.get<AsistenciaResponse[]>(`${this.apiUrl}/historial/${cedula}`);
  }

  frecuenciaPorCedula(cedula: string, desde: string, hasta: string): Observable<FrecuenciaAsistenciaResponse> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<FrecuenciaAsistenciaResponse>(`${this.apiUrl}/frecuencia/${cedula}`, { params }).pipe(
      timeout(12000)
    );
  }

  listarAsistenciasFuncionariosPorRango(desde: string, hasta: string): Observable<AsistenciaResponse[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<AsistenciaResponse[]>(`${this.apiUrl}/funcionarios/rango`, { params });
  }
}
