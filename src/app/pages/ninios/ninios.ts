import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { NinioService } from '../../services/ninio.service';
import { ToastService } from '../../services/toast.service';
import { NinioResponse } from '../../models/models';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-ninios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './ninios.html',
  styleUrls: ['./ninios.css']
})
export class NiniosComponent implements OnInit {
  ninios: NinioResponse[] = [];
  filtrados: NinioResponse[] = [];
  cargando = true;
  busqueda = '';

  constructor(
    private ninioService: NinioService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cargarNinios();
  }

  cargarNinios() {
    this.cargando = true;
    this.ninioService.listarTodos().pipe(
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (data) => {
        this.ninios = data;
        this.aplicarFiltros();
      },
      error: () => {
        this.toast.error('Error al cargar los niños');
      }
    });
  }

  aplicarFiltros() {
    const texto = this.busqueda.trim().toLowerCase();
    this.filtrados = this.ninios.filter(ninio => {
      if (!texto) return true;
      const target = [
        `${ninio.nombre} ${ninio.apellido}`,
        ninio.cedula,
        ninio.direccion || '',
        ninio.observaciones || '',
        ninio.grupo?.nombre || '',
        ninio.grupo?.rangoEdad || ''
      ].join(' ').toLowerCase();
      return target.includes(texto);
    });
  }

  getNombreCompleto(ninio: NinioResponse) {
    return `${ninio.nombre} ${ninio.apellido}`;
  }

  displaySexo(sexo?: string) {
    if (!sexo) return '—';
    return sexo.toLowerCase() === 'masculino' ? 'Masculino'
      : sexo.toLowerCase() === 'femenino' ? 'Femenino'
      : sexo;
  }

  formatDate(fecha?: string) {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  get totalActivos(): number {
    return this.ninios.filter(n => n.activo).length;
  }

  get totalInactivos(): number {
    return this.ninios.filter(n => !n.activo).length;
  }
}