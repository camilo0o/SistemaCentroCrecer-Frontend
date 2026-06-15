import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { finalize, forkJoin } from 'rxjs';
import { AsistenciaService } from '../../services/asistencia.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AsistenciaResponse, EstadoPuntualidad, FrecuenciaAsistenciaResponse, NinioResponse } from '../../models/models';
import { GetPresentesPipe } from '../../pipes/get-presentes-pipe';
import { ActividadResponse } from '../../models/models';
import { ActividadService } from '../../services/actividad.service';

interface NinioConEstado extends NinioResponse {
  asistenciaId?: number;
  presente: boolean;
  horaEntrada?: string;
  horaSalida?: string;
  observaciones?: string;
  cargando?: boolean;
  actividadId?: number;
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
    MatTabsModule, MatBadgeModule, MatDialogModule,
    GetPresentesPipe
  ],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css'
})
export class AsistenciaComponent implements OnInit {

  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  hoy: string = new Date().toISOString().split('T')[0];
  esHoy: boolean = true;

  get esAuxiliar(): boolean { return this.authService.getRol() === 'AUXILIAR_LIMPIEZA'; }

  miRegistro: AsistenciaResponse | null = null;
  cargandoMiRegistro = false;
  modoEntrada = false;
  horaEntradaInput: string = '';
  horaSalidaInput: string = '';
  observacionesInput: string = '';

  ninios: NinioConEstado[] = [];
  cargandoNinios = false;
  gruposConNinios: { nombre: string; ninios: NinioConEstado[] }[] = [];

  grupoSeleccionado: string = '';

  ninioConSalidaAbierta: number | null = null;
  horaSalidaNinioInput: string = '';
  observacionesSalidaNinioInput: string = '';

  ninioConObsAbierta: number | null = null;
  horaEntradaNinioInput: string = '';
  observacionesEntradaNinioInput: string = '';

  actividades: ActividadResponse[] = [];
  actividadSeleccionadaId: number | null = null;

  observacionesSalidaInput: string = '';

  constructor(
    private asistenciaService: AsistenciaService,
    private authService: AuthService,
    private toast: ToastService,
    private dialog: MatDialog,
    private actividadService: ActividadService,
    private cdr: ChangeDetectorRef
  ) {}


  modalHistorialVisible = false;
  historialCedula: string = '';
  historialCargando = false;
  historialRegistros: AsistenciaResponse[] = [];
  historialError: string = '';

  historialFrecuencia: FrecuenciaAsistenciaResponse | null = null;
  historialFrecuenciaDesde: string = '';
  historialFrecuenciaHasta: string = '';
  historialFrecuenciaCargando = false;

  frecuenciaCedula: string = '';
  frecuenciaDesde: string = '';
  frecuenciaHasta: string = '';
  frecuenciaCargando = false;
  frecuenciaResultado: FrecuenciaAsistenciaResponse | null = null;
  frecuenciaError: string = '';

  abrirHistorial(): void {
    this.historialCedula = '';
    this.historialRegistros = [];
    this.historialError = '';
    this.historialFrecuencia = null;
    this.modalHistorialVisible = true;
  }

  cerrarHistorial(): void {
    this.modalHistorialVisible = false;
  }

  buscarHistorial(): void {
    const ced = this.historialCedula.trim();
    if (!ced) { this.historialError = 'Ingrese una cédula'; return; }
    this.historialError = '';
    this.historialCargando = true;
    this.historialRegistros = [];
    this.historialFrecuencia = null;

    // Rango: últimos 90 días
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - 90);
    this.historialFrecuenciaHasta = hasta.toISOString().split('T')[0];
    this.historialFrecuenciaDesde = desde.toISOString().split('T')[0];

    this.asistenciaService.historialPorCedula(ced)
      .pipe(finalize(() => this.historialCargando = false))
      .subscribe({
        next: r => {
          this.historialRegistros = r;
          if (r.length === 0) {
            this.historialError = 'No se encontraron registros para esta cédula.';
          } else {
            this.cargarFrecuenciaHistorial(ced);
          }
        },
        error: e => this.historialError = e.error?.message || 'Cédula no encontrada.'
      });
  }

  cargarFrecuenciaHistorial(cedula: string): void {
    this.historialFrecuenciaCargando = true;
    this.asistenciaService.frecuenciaPorCedula(
      cedula,
      this.historialFrecuenciaDesde,
      this.historialFrecuenciaHasta
    ).pipe(finalize(() => this.historialFrecuenciaCargando = false))
      .subscribe({
        next: r => this.historialFrecuencia = r,
        error: () => {} // silencioso, el historial ya se mostró
      });
  }

  actualizarFrecuenciaHistorial(): void {
    const ced = this.historialCedula.trim();
    if (!ced || !this.historialFrecuenciaDesde || !this.historialFrecuenciaHasta) return;
    this.cargarFrecuenciaHistorial(ced);
  }

  buscarFrecuencia(): void {
    const ced = this.frecuenciaCedula.trim();
    if (!ced || !this.frecuenciaDesde || !this.frecuenciaHasta) {
      this.frecuenciaError = 'Complete la cédula y el rango de fechas.';
      return;
    }
    this.frecuenciaError = '';
    this.frecuenciaResultado = null;
    this.frecuenciaCargando = true;
    this.asistenciaService.frecuenciaPorCedula(ced, this.frecuenciaDesde, this.frecuenciaHasta)
      .pipe(finalize(() => this.frecuenciaCargando = false))
      .subscribe({
        next: r => this.frecuenciaResultado = r,
        error: e => this.frecuenciaError = e.error?.message || 'Cédula no encontrada.'
      });
  }

  limpiarFrecuencia(): void {
    this.frecuenciaCedula = '';
    this.frecuenciaDesde = '';
    this.frecuenciaHasta = '';
    this.frecuenciaResultado = null;
    this.frecuenciaError = '';
  }

  // ── Frecuencia inline en card de niño ───────────────────────────────────
  ninioFrecuenciaSeleccionado: number | null = null;
  ninioFrecuenciaCargando = false;
  ninioFrecuenciaData: FrecuenciaAsistenciaResponse | null = null;
  ninioFrecuenciaError = '';

  toggleFrecuenciaNinio(ninio: NinioConEstado): void {
    if (this.ninioFrecuenciaSeleccionado === ninio.id) {
      this.ninioFrecuenciaSeleccionado = null;
      this.ninioFrecuenciaData = null;
      return;
    }
    this.ninioFrecuenciaSeleccionado = ninio.id;
    this.ninioFrecuenciaData = null;
    this.ninioFrecuenciaError = '';
    this.ninioFrecuenciaCargando = true;
    const hasta = new Date().toISOString().split('T')[0];
    const desdeDate = new Date();
    desdeDate.setDate(desdeDate.getDate() - 30);
    const desde = desdeDate.toISOString().split('T')[0];
    this.asistenciaService.frecuenciaPorCedula(ninio.cedula, desde, hasta)
      .pipe(finalize(() => this.ninioFrecuenciaCargando = false))
      .subscribe({
        next: r => this.ninioFrecuenciaData = r,
        error: () => this.ninioFrecuenciaError = 'sin datos'
      });
  }

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
    this.actividadService.listarActivas().subscribe({
      next: a => { this.actividades = a; this.cdr.detectChanges(); },
      error: () => {}
    });
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
    this.asistenciaService.registrarMiSalida({
      horaSalida: this.horaSalidaInput,
      fecha: this.fechaSeleccionada,
      observaciones: this.observacionesSalidaInput || undefined
    }).pipe(finalize(() => this.cargandoMiRegistro = false))
      .subscribe({
        next: r => {
          this.miRegistro = r;
          this.horaSalidaInput = '';
          this.observacionesSalidaInput = '';
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
      .pipe(finalize(() => { this.cargandoNinios = false; this.cdr.detectChanges(); }))
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
              observaciones: asis?.observaciones,
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

  abrirFormPresente(ninio: NinioConEstado): void {
    this.ninioConObsAbierta = ninio.id;
    this.horaEntradaNinioInput = this.horaActual();
    this.observacionesEntradaNinioInput = '';

    const actividadHoy = this.actividades.find(a =>
      a.fechaDesde <= this.fechaSeleccionada &&
      !!a.fechaHasta && a.fechaHasta >= this.fechaSeleccionada &&
      a.ninios?.some(n => n.id === ninio.id)
    );
  }

  cancelarFormPresente(): void {
    this.ninioConObsAbierta = null;
    this.horaEntradaNinioInput = '';
    this.observacionesEntradaNinioInput = '';
    this.actividadSeleccionadaId = null;
  }

  confirmarPresente(ninio: NinioConEstado): void {
    if (ninio.presente || ninio.cargando) return;
    ninio.cargando = true;
    this.asistenciaService.marcarAsistenciaNinio({
      fecha: this.fechaSeleccionada,
      horaEntrada: this.horaEntradaNinioInput || this.horaActual(),
      ninioId: ninio.id,
      observaciones: this.observacionesEntradaNinioInput || undefined,
      actividadId: this.actividadSeleccionadaId ?? undefined
    }).pipe(finalize(() => ninio.cargando = false))
      .subscribe({
        next: r => {
          ninio.presente = true;
          ninio.asistenciaId = r.id;
          ninio.horaEntrada = r.horaEntrada;
          ninio.horaSalida = r.horaSalida;
          ninio.observaciones = r.observaciones;
          this.ninioConObsAbierta = null;
          this.observacionesEntradaNinioInput = '';
          this.toast.show(`Asistencia de ${ninio.nombre} registrada`, 'success');
        },
        error: e => this.toast.show(e.error?.mensaje || e.error?.message || 'Error al marcar asistencia', 'error')
      });
  }

  marcarPresente(ninio: NinioConEstado): void {
    this.abrirFormPresente(ninio);
  }

  abrirSalidaNinio(ninio: NinioConEstado): void {
    this.ninioConSalidaAbierta = ninio.id;
    this.horaSalidaNinioInput = this.horaActual();
    this.observacionesSalidaNinioInput = '';
  }

  cancelarSalidaNinio(): void {
    this.ninioConSalidaAbierta = null;
    this.horaSalidaNinioInput = '';
    this.observacionesSalidaNinioInput = '';
  }

  registrarSalidaNinio(ninio: NinioConEstado): void {
    if (!ninio.asistenciaId || !this.horaSalidaNinioInput) return;
    ninio.cargando = true;
    this.asistenciaService.registrarSalidaNinio(ninio.asistenciaId, {
      horaSalida: this.horaSalidaNinioInput,
      observaciones: this.observacionesSalidaNinioInput || undefined
    }).pipe(finalize(() => ninio.cargando = false))
      .subscribe({
        next: r => {
          ninio.horaSalida = r.horaSalida;
          if (r.observaciones) ninio.observaciones = r.observaciones;
          this.ninioConSalidaAbierta = null;
          this.horaSalidaNinioInput = '';
          this.observacionesSalidaNinioInput = '';
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