import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { finalize, forkJoin } from 'rxjs';
import { AsistenciaService } from '../../services/asistencia.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AsistenciaResponse, EstadoPuntualidad, NinioResponse } from '../../models/models';
import { GetPresentesPipe } from '../../pipes/get-presentes-pipe';

interface NinioConEstado extends NinioResponse {
  asistenciaId?: number;
  presente: boolean;
  horaEntrada?: string;
  horaSalida?: string;
  cargando?: boolean;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule, MatChipsModule, MatDividerModule,
    MatTabsModule, MatBadgeModule,
    GetPresentesPipe
  ],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css'
})
export class AsistenciaComponent implements OnInit {

  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  hoy: string = new Date().toISOString().split('T')[0];
  esHoy: boolean = true;

  // ── Mi Registro ──────────────────────────────────────────────────────────
  miRegistro: AsistenciaResponse | null = null;
  cargandoMiRegistro = false;
  modoEntrada = false;
  horaEntradaInput: string = '';
  horaSalidaInput: string = '';
  observacionesInput: string = '';

  // ── Niños de mis grupos ──────────────────────────────────────────────────
  ninios: NinioConEstado[] = [];
  cargandoNinios = false;
  gruposConNinios: { nombre: string; ninios: NinioConEstado[] }[] = [];

  // ── Filtro por grupo ─────────────────────────────────────────────────────
  grupoSeleccionado: string = '';

  // ── Ingreso manual de hora de salida nino ────────────────────────────────
  ninioConSalidaAbierta: number | null = null;
  horaSalidaNinioInput: string = '';

  constructor(
    private asistenciaService: AsistenciaService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  // ── Helpers de puntualidad ───────────────────────────────────────────────

  puntualidadIcono(estado?: EstadoPuntualidad): string {
    switch (estado) {
      case 'EN_HORARIO': return 'check_circle';
      case 'TARDE':      return 'schedule';
      case 'TEMPRANO':   return 'alarm';
      default:           return 'help_outline';
    }
  }

  puntualidadLabel(estado?: EstadoPuntualidad): string {
    switch (estado) {
      case 'EN_HORARIO':          return 'En horario';
      case 'TARDE':               return 'Tarde';
      case 'TEMPRANO':            return 'Anticipado';
      case 'SIN_TURNO_ASIGNADO':  return 'Sin turno asignado';
      default:                    return '';
    }
  }

  puntualidadClase(estado?: EstadoPuntualidad): string {
    switch (estado) {
      case 'EN_HORARIO': return 'puntualidad-ok';
      case 'TARDE':      return 'puntualidad-tarde';
      case 'TEMPRANO':   return 'puntualidad-temprano';
      default:           return 'puntualidad-sin-turno';
    }
  }

  ngOnInit(): void {
    this.horaEntradaInput = this.horaActual();
    this.cargarDatos();
  }

  horaActual(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  fechaLabel(): string {
    if (this.esHoy) return 'Hoy';
    const d = new Date(this.fechaSeleccionada + 'T00:00:00');
    return d.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  cambiarFecha(delta: number): void {
    const d = new Date(this.fechaSeleccionada + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const nueva = d.toISOString().split('T')[0];
    if (nueva > this.hoy) return;
    this.fechaSeleccionada = nueva;
    this.esHoy = this.fechaSeleccionada === this.hoy;
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargarMiRegistro();
    this.cargarNinios();
  }

  // ── Mi Registro ──────────────────────────────────────────────────────────

  cargarMiRegistro(): void {
    this.cargandoMiRegistro = true;
    this.miRegistro = null;
    this.asistenciaService.obtenerMiRegistroDelDia(this.fechaSeleccionada)
      .pipe(finalize(() => this.cargandoMiRegistro = false))
      .subscribe({
        next: r => { this.miRegistro = r; },
        error: () => { this.miRegistro = null; }
      });
  }

  abrirFormEntrada(): void {
    this.modoEntrada = true;
    this.horaEntradaInput = this.horaActual();
    this.horaSalidaInput = '';
    this.observacionesInput = '';
  }

  cancelarEntrada(): void {
    this.modoEntrada = false;
  }

  registrarEntrada(): void {
    if (!this.horaEntradaInput) {
      this.toast.show('Ingrese la hora de entrada', 'error');
      return;
    }
    this.cargandoMiRegistro = true;
    this.asistenciaService.registrarMiEntrada({
      fecha: this.fechaSeleccionada,
      horaEntrada: this.horaEntradaInput,
      horaSalida: this.horaSalidaInput || undefined,
      observaciones: this.observacionesInput || undefined
    }).pipe(finalize(() => this.cargandoMiRegistro = false))
      .subscribe({
        next: r => {
          this.miRegistro = r;
          this.modoEntrada = false;
          this.toast.show('Entrada registrada correctamente', 'success');
        },
        error: e => this.toast.show(e.error?.message || 'Error al registrar entrada', 'error')
      });
  }

  abrirFormSalida(): void {
    this.horaSalidaInput = this.horaActual();
  }

  registrarSalida(): void {
    if (!this.horaSalidaInput) {
      this.toast.show('Ingrese la hora de salida', 'error');
      return;
    }
    this.cargandoMiRegistro = true;
    this.asistenciaService.registrarMiSalida(this.horaSalidaInput, this.fechaSeleccionada)
      .pipe(finalize(() => this.cargandoMiRegistro = false))
      .subscribe({
        next: r => {
          this.miRegistro = r;
          this.horaSalidaInput = '';
          this.toast.show('Salida registrada correctamente', 'success');
        },
        error: e => this.toast.show(e.error?.message || 'Error al registrar salida', 'error')
      });
  }

  // ── Niños de mis grupos ──────────────────────────────────────────────────

  cargarNinios(): void {
    this.cargandoNinios = true;
    forkJoin({
      ninios: this.asistenciaService.listarNiniosDisponibles(),
      asistencias: this.asistenciaService.listarAsistenciasDeNinosPorFecha(this.fechaSeleccionada)
    })
      .pipe(finalize(() => this.cargandoNinios = false))
      .subscribe({
        next: ({ ninios, asistencias }) => {
          this.ninios = ninios.map(n => {
            const asis = asistencias.find(a => a.ninioId === n.id);
            return {
              ...n,
              asistenciaId: asis?.id,
              presente: !!asis,
              horaEntrada: asis?.horaEntrada,
              horaSalida: asis?.horaSalida,
              cargando: false
            } as NinioConEstado;
          });
          this.agruparPorGrupo();
          // Seleccionar automáticamente el primer grupo si hay resultados
          if (this.gruposConNinios.length > 0 && !this.grupoSeleccionado) {
            this.grupoSeleccionado = this.gruposConNinios[0].nombre;
          }
        },
        error: () => this.toast.show('Error al cargar niños', 'error')
      });
  }

  agruparPorGrupo(): void {
    const mapa = new Map<string, NinioConEstado[]>();
    for (const n of this.ninios) {
      // El backend envía grupoNombre como campo plano; grupo?.nombre como fallback
      const gNombre = n.grupoNombre ?? n.grupo?.nombre ?? 'Sin grupo';
      if (!mapa.has(gNombre)) mapa.set(gNombre, []);
      mapa.get(gNombre)!.push(n);
    }
    this.gruposConNinios = Array.from(mapa.entries()).map(([nombre, ninios]) => ({ nombre, ninios }));
  }

  get grupoActual(): { nombre: string; ninios: NinioConEstado[] } | undefined {
    if (!this.grupoSeleccionado) return this.gruposConNinios[0];
    return this.gruposConNinios.find(g => g.nombre === this.grupoSeleccionado);
  }

  marcarPresente(ninio: NinioConEstado): void {
    if (ninio.presente || ninio.cargando) return;
    ninio.cargando = true;
    this.asistenciaService.marcarAsistenciaNinio({
      fecha: this.fechaSeleccionada,
      horaEntrada: this.horaActual(),
      ninioId: ninio.id
    }).pipe(finalize(() => ninio.cargando = false))
      .subscribe({
        next: r => {
          ninio.presente = true;
          ninio.asistenciaId = r.id;
          ninio.horaEntrada = r.horaEntrada;
          ninio.horaSalida = r.horaSalida;
          this.toast.show(`Asistencia de ${ninio.nombre} registrada`, 'success');
        },
        error: e => this.toast.show(e.error?.message || 'Error al marcar asistencia', 'error')
      });
  }

  abrirSalidaNinio(ninio: NinioConEstado): void {
    this.ninioConSalidaAbierta = ninio.id;
    this.horaSalidaNinioInput = this.horaActual();
  }

  cancelarSalidaNinio(): void {
    this.ninioConSalidaAbierta = null;
    this.horaSalidaNinioInput = '';
  }

  registrarSalidaNinio(ninio: NinioConEstado): void {
    if (!ninio.asistenciaId || !this.horaSalidaNinioInput) return;
    ninio.cargando = true;
    this.asistenciaService.registrarSalidaNinio(ninio.asistenciaId, this.horaSalidaNinioInput)
      .pipe(finalize(() => ninio.cargando = false))
      .subscribe({
        next: r => {
          ninio.horaSalida = r.horaSalida;
          this.ninioConSalidaAbierta = null;
          this.horaSalidaNinioInput = '';
          this.toast.show(`Salida de ${ninio.nombre} registrada`, 'success');
        },
        error: e => this.toast.show(e.error?.message || 'Error al registrar salida', 'error')
      });
  }

  get presentesCount(): number {
    return this.ninios.filter(n => n.presente).length;
  }

  get ausentesCount(): number {
    return this.ninios.filter(n => !n.presente).length;
  }

  get totalNinios(): number {
    return this.ninios.length;
  }

  get presentesEnGrupoActual(): number {
    return this.grupoActual?.ninios.filter(n => n.presente).length ?? 0;
  }

  get totalEnGrupoActual(): number {
    return this.grupoActual?.ninios.length ?? 0;
  }
}