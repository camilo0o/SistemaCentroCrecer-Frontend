import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NinioResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NinioService {
  private apiUrl = `${environment.apiUrl}/ninios`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<NinioResponse[]> {
    return this.http.get<NinioResponse[]>(`${this.apiUrl}/filtrar`);
  }
}