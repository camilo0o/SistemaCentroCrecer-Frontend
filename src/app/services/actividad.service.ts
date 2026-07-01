import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ActividadRequest,
  ActividadResponse,
  PermisoRequest,
  PermisoResponse,
  EmpresaExternaResponse
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private apiUrl = `${environment.apiUrl}/actividades`;
  private empresasUrl = `${environment.apiUrl}/empresas-externas`;
  private permisosUrl = `${environment.apiUrl}/permisos`;

  constructor(private http: HttpClient) {}

  // Actividades
  listarTodas(): Observable<ActividadResponse[]> {
    return this.http.get<ActividadResponse[]>(this.apiUrl);
  }

  listarActivas(): Observable<ActividadResponse[]> {
    return this.http.get<ActividadResponse[]>(`${this.apiUrl}/activos`);
  }

  listarProximas(): Observable<ActividadResponse[]> {
    return this.http.get<ActividadResponse[]>(`${this.apiUrl}/proximas`);
  }

  obtenerPorId(id: number): Observable<ActividadResponse> {
    return this.http.get<ActividadResponse>(`${this.apiUrl}/${id}`);
  }

  crear(data: ActividadRequest): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(this.apiUrl, data);
  }

  actualizar(id: number, data: ActividadRequest): Observable<ActividadResponse> {
    return this.http.put<ActividadResponse>(`${this.apiUrl}/${id}/actualizar`, data); 
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/baja`, {}); 
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  asignarNinios(actividadId: number, niniosIds: number[]): Observable<ActividadResponse> {
    return this.http.patch<ActividadResponse>(`${this.apiUrl}/${actividadId}/ninios`, niniosIds);
  }

  listarPorNinio(ninioId: number): Observable<ActividadResponse[]> {
    return this.http.get<ActividadResponse[]>(`${this.apiUrl}/ninio/${ninioId}`);
  }

  asignarEmpresas(actividadId: number, empresasIds: number[]): Observable<ActividadResponse> {
    return this.http.patch<ActividadResponse>(`${this.apiUrl}/${actividadId}/empresas`, empresasIds);
  }

  listarEmpresas(): Observable<EmpresaExternaResponse[]> {
    return this.http.get<EmpresaExternaResponse[]>(this.empresasUrl);
  }

  listarEmpresasPorActividad(actividadId: number): Observable<EmpresaExternaResponse[]> {
    return this.http.get<EmpresaExternaResponse[]>(`${this.empresasUrl}/actividad/${actividadId}`);
  }

  asignarPermisos(actividadId: number, permisosIds: number[]): Observable<ActividadResponse> {
    return this.http.patch<ActividadResponse>(`${this.apiUrl}/${actividadId}/permisos`, permisosIds);
  }

  registrarPermiso(data: PermisoRequest): Observable<PermisoResponse> {
    return this.http.post<PermisoResponse>(this.permisosUrl, data);
  }

  actualizarPermiso(permisoId: number, data: PermisoRequest): Observable<PermisoResponse> {
    return this.http.put<PermisoResponse>(`${this.permisosUrl}/${permisoId}`, data);
  }

  listarPermisosPorActividad(actividadId: number): Observable<PermisoResponse[]> {
    return this.http.get<PermisoResponse[]>(`${this.permisosUrl}/actividad/${actividadId}`);
  }

  autorizarPermiso(permisoId: number): Observable<PermisoResponse> {
    return this.http.patch<PermisoResponse>(`${this.permisosUrl}/${permisoId}/autorizar`, {});
  }

  rechazarPermiso(permisoId: number): Observable<PermisoResponse> {
    return this.http.patch<PermisoResponse>(`${this.permisosUrl}/${permisoId}/rechazar`, {});
  }

  validarAutorizacion(actividadId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${actividadId}/autorizacion`);
  }
}