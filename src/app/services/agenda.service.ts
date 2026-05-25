import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AgendaResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private apiUrl = `${environment.apiUrl}/agendas`;

  constructor(private http: HttpClient) {}

  eventosDia(fecha: string): Observable<AgendaResponse[]> {
    return this.http.get<AgendaResponse[]>(`${this.apiUrl}/dia`, {
      params: new HttpParams().set('fecha', fecha)
    });
  }

  eventosSemana(fecha: string): Observable<AgendaResponse[]> {
    return this.http.get<AgendaResponse[]>(`${this.apiUrl}/semana`, {
      params: new HttpParams().set('fecha', fecha)
    });
  }
}
