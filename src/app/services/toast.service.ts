import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { observeOn, asyncScheduler } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<Toast>();
  // observeOn(asyncScheduler) hace que cada emisión se procese
  // en el siguiente macrotask, nunca durante un ciclo de CD activo.
  toasts$ = this.toastSubject.asObservable().pipe(observeOn(asyncScheduler));
  private counter = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 4000) {
    this.toastSubject.next({ id: ++this.counter, message, type, duration });
  }

  success(message: string) { this.show(message, 'success'); }
  error(message: string)   { this.show(message, 'error', 6000); }
  info(message: string)    { this.show(message, 'info'); }
  warning(message: string) { this.show(message, 'warning'); }
}