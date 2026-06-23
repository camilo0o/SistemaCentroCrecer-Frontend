import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NinioSolicitudRequest {
  cedula: string;
  nombre: string;
  apellido: string;
  sexo: string;
  fechaNacimiento: string;
  direccion?: string;
  observaciones?: string;
  condicionesMedicas?: { condicion: string; observacion?: string; esCronica: boolean }[];
}

export interface RegistroResponsableRequest {
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  contrasenia: string;
  ninos: NinioSolicitudRequest[];
}

export interface InscripcionSolicitudResponse {
  id: number;
  fechaInscripcion: string;
  estadoInscripcion: string;
  motivoBaja?: string;
  observaciones?: string;
  responsableId: number;
  responsableNombre?: string;
  responsableCedula?: string;
  responsableEmail?: string;
  responsableTelefono?: string;
  ninioId: number;
  ninioNombre?: string;
  ninioApellido?: string;
  ninioCedula?: string;
  ninioFechaNacimiento?: string;
  ninioSexo?: string;
  ninioFotoUrl?: string;
  ninioObservaciones?: string;
  ninioDireccion?: string;
  condicionesMedicas?: { condicion: string; observacion?: string; esCronica: boolean }[];
  grupoId?: number;
  grupoNombre?: string;
}

export interface DarDeAltaRequest {
  grupoId: number;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class InscripcionService {
  private apiUrl = `${environment.apiUrl}/inscripciones`;
  private responsablesUrl = `${environment.apiUrl}/responsables`;

  constructor(private http: HttpClient) {}

  /** Registro público: crea responsable + niños + solicitudes de inscripción */
  registrarResponsableConNinos(dto: RegistroResponsableRequest): Observable<any> {
    return this.http.post(`${this.responsablesUrl}/registro-completo`, dto);
  }

  /** Lista inscripciones pendientes (para el funcionario en el dashboard) */
  listarPendientes(): Observable<InscripcionSolicitudResponse[]> {
    return this.http.get<InscripcionSolicitudResponse[]>(`${this.apiUrl}/pendientes`);
  }

  /** Dar de alta: asigna grupo y activa la inscripción */
  darDeAlta(inscripcionId: number, dto: DarDeAltaRequest): Observable<InscripcionSolicitudResponse> {
    return this.http.put<InscripcionSolicitudResponse>(`${this.apiUrl}/${inscripcionId}/dar-de-alta`, dto);
  }

  /** Rechazar / dar de baja una solicitud */
  rechazar(inscripcionId: number, motivo: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${inscripcionId}/rechazar`, { motivo });
  }

  /** Lista las inscripciones del responsable autenticado */
  listarPorResponsable(responsableId: number): Observable<InscripcionSolicitudResponse[]> {
    return this.http.get<InscripcionSolicitudResponse[]>(`${this.apiUrl}/por-responsable/${responsableId}`);
  }

  /** El responsable logueado solicita inscribir nuevos niños */
  solicitarNuevosNinos(responsableId: number, ninos: NinioSolicitudRequest[]): Observable<InscripcionSolicitudResponse[]> {
    return this.http.post<InscripcionSolicitudResponse[]>(`${this.apiUrl}/responsable/${responsableId}/solicitar`, ninos);
  }
}
