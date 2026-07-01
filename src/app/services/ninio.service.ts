import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  actualizarFoto(id: number, fotoUrl: string): Observable<NinioResponse> {
    return this.http.put<NinioResponse>(`${this.apiUrl}/${id}/foto`, { fotoUrl });
  }

  misNinios(responsableId: number): Observable<NinioResponse[]> {
    return this.http.get<NinioResponse[]>(`${this.apiUrl}/mis-ninios`, {
      params: { responsableId: responsableId.toString() }
    });
  }

  actualizarPorResponsable(ninioId: number, responsableId: number, dto: {
    direccion?: string;
    observaciones?: string;
    condicionesMedicas?: { condicionId?: number; condicion: string; observacion?: string; esCronica: boolean }[];
  }): Observable<NinioResponse> {
    return this.http.put<NinioResponse>(`${this.apiUrl}/${ninioId}/responsable-actualizar`, dto, {
      params: { responsableId: responsableId.toString() }
    });
  }

  subirFotoCloudinary(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', environment.cloudinaryUploadPreset);
    return this.http.post<any>(
      `https://api.cloudinary.com/v1_1/${environment.cloudinaryCloudName}/image/upload`,
      formData
    ).pipe(
      map(res => {
        if (!res?.secure_url) {
          throw new Error(res?.error?.message ?? 'Cloudinary no devolvió una URL válida');
        }
        return res.secure_url as string;
      })
    );
  }
}