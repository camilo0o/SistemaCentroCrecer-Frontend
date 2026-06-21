import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import {
  CalendarioLaboralService,
  DiaNoLaborableResponse,
  TipoDiaNoLaborable
} from '../../services/calendario-laboral.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

interface DiaCalendario {
  fecha: Date;
  iso: string;
  fueraDeMes: boolean;
  finDeSemana: boolean;
  noLaborable?: DiaNoLaborableResponse;
}

@Component({
  selector: 'app-calendario-laboral',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './calendario-laboral.html',
  styleUrl: './calendario-laboral.css'
})
export class CalendarioLaboralComponent implements OnInit {
  fechaActual = new Date();
  dias: DiaCalendario[] = [];
  diasNoLaborables: DiaNoLaborableResponse[] = [];
  seleccionado: DiaCalendario | null = null;
  cargando = false;
  guardando = false;

  motivo = '';
  tipo: TipoDiaNoLaborable = 'FERIADO';
  readonly tipos: TipoDiaNoLaborable[] = ['FERIADO', 'VACACIONES', 'PARO', 'SUSPENSION', 'OTRO'];
  readonly diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  constructor(
    private calendarioService: CalendarioLaboralService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarMes();
  }

  get esAdmin(): boolean {
    const rol = this.auth.getRol();
    return rol === 'ADMIN' || rol === 'ADMINISTRADOR_SISTEMA';
  }

  get tituloMes(): string {
    return this.fechaActual.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  }

  cargarMes(): void {
    const desde = this.iso(new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth(), 1));
    const hasta = this.iso(new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + 1, 0));
    this.cargando = true;
    this.calendarioService.listar(desde, hasta)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: dias => {
          this.diasNoLaborables = dias.filter(d => d.activo !== false);
          this.construirCalendario();
        },
        error: () => {
          this.diasNoLaborables = [];
          this.construirCalendario();
          this.toast.error('No se pudo cargar el calendario laboral');
        }
      });
  }

  mesAnterior(): void {
    this.fechaActual = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() - 1, 1);
    this.seleccionado = null;
    this.cargarMes();
  }

  mesSiguiente(): void {
    this.fechaActual = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + 1, 1);
    this.seleccionado = null;
    this.cargarMes();
  }

  irHoy(): void {
    this.fechaActual = new Date();
    this.seleccionado = null;
    this.cargarMes();
  }

  seleccionar(dia: DiaCalendario): void {
    this.seleccionado = dia;
    this.motivo = dia.noLaborable?.motivo ?? '';
    this.tipo = dia.noLaborable?.tipo ?? 'FERIADO';
  }

  guardarDia(): void {
    if (!this.esAdmin || !this.seleccionado || !this.motivo.trim()) {
      if (!this.motivo.trim()) this.toast.error('Ingrese un motivo');
      return;
    }

    const dto = {
      fecha: this.seleccionado.iso,
      motivo: this.motivo.trim(),
      tipo: this.tipo
    };
    const request = this.seleccionado.noLaborable
      ? this.calendarioService.actualizar(this.seleccionado.noLaborable.id, dto)
      : this.calendarioService.crear(dto);

    this.guardando = true;
    request.pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => {
          this.toast.success('Calendario laboral actualizado');
          this.cargarMes();
        },
        error: err => this.toast.error(err.error?.message || err.error?.error || 'No se pudo guardar el dia')
      });
  }

  quitarDia(): void {
    if (!this.esAdmin || !this.seleccionado?.noLaborable) return;
    this.guardando = true;
    this.calendarioService.eliminar(this.seleccionado.noLaborable.id)
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => {
          this.toast.success('Dia habilitado nuevamente');
          this.seleccionado = null;
          this.cargarMes();
        },
        error: err => this.toast.error(err.error?.message || err.error?.error || 'No se pudo quitar el dia')
      });
  }

  private construirCalendario(): void {
    const noLaborablesPorFecha = new Map(this.diasNoLaborables.map(d => [d.fecha, d]));
    const inicioMes = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth(), 1);
    const finMes = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + 1, 0);
    const inicio = new Date(inicioMes);
    const offsetLunes = (inicio.getDay() + 6) % 7;
    inicio.setDate(inicio.getDate() - offsetLunes);

    const fin = new Date(finMes);
    const offsetDomingo = 6 - ((fin.getDay() + 6) % 7);
    fin.setDate(fin.getDate() + offsetDomingo);

    const dias: DiaCalendario[] = [];
    const actual = new Date(inicio);
    while (actual <= fin) {
      const iso = this.iso(actual);
      const day = actual.getDay();
      dias.push({
        fecha: new Date(actual),
        iso,
        fueraDeMes: actual.getMonth() !== this.fechaActual.getMonth(),
        finDeSemana: day === 0 || day === 6,
        noLaborable: noLaborablesPorFecha.get(iso)
      });
      actual.setDate(actual.getDate() + 1);
    }
    this.dias = dias;
  }

  private iso(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }
}
