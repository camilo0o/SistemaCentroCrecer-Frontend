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
import { finalize, forkJoin, catchError, of, timeout } from 'rxjs';
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

/** Un día dentro del calendario de frecuencia */
export interface CalendarioDia {
  fecha: Date;
  tipo: 'presente' | 'ausente' | 'fueraPeriodo' | 'noHabil';
  // 'presente'     = el centro abrió Y el niño asistió
  // 'ausente'      = el centro abrió Y el niño NO asistió
  // 'noHabil'      = fin de semana o fuera del período (el centro no cuenta ese día)
  // 'fueraPeriodo' = dentro del grid del mes pero fuera del rango desde/hasta
  tooltip: string;
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
  miHistorialDesde: string = '';
  miHistorialHasta: string = '';
  miHistorialRegistros: AsistenciaResponse[] = [];
  miHistorialCargando = false;
  miHistorialError = '';
  miHistorialModalVisible = false;

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
  historialNinioSeleccionadoId: number | null = null;
  historialCargando = false;
  historialRegistros: AsistenciaResponse[] = [];
  historialError: string = '';

  historialFrecuencia: FrecuenciaAsistenciaResponse | null = null;
  historialFrecuenciaDesde: string = '';
  historialFrecuenciaHasta: string = '';
  historialFrecuenciaCargando = false;

  // ── Calendario de frecuencia (modal historial) ───────────────────────────
  historialCalendarioVisible = false;
  historialCalendarioMeses: { anio: number; mes: number; label: string; dias: CalendarioDia[] }[] = [];

  frecuenciaCedula: string = '';
  frecuenciaDesde: string = '';
  frecuenciaHasta: string = '';
  frecuenciaCargando = false;
  frecuenciaResultado: FrecuenciaAsistenciaResponse | null = null;
  frecuenciaError: string = '';

  // ── Calendario de frecuencia (panel consulta standalone) ────────────────
  frecuenciaCalendarioVisible = false;
  frecuenciaCalendarioMeses: { anio: number; mes: number; label: string; dias: CalendarioDia[] }[] = [];

  abrirMiHistorial(): void {
    this.miHistorialModalVisible = true;
    this.cargarMiHistorial();
  }

  cerrarMiHistorial(): void {
    this.miHistorialModalVisible = false;
  }

  abrirHistorial(): void {
    this.historialCedula = '';
    this.historialNinioSeleccionadoId = null;
    this.historialRegistros = [];
    this.historialError = '';
    this.historialFrecuencia = null;
    this.historialCalendarioVisible = false;
    this.historialCalendarioMeses = [];
    if (this.gruposConNinios.length === 0 && !this.cargandoNinios) {
      this.cargarNinios();
    }
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
    this.historialCalendarioVisible = false;
    this.historialCalendarioMeses = [];

    // Rango: últimos 90 días
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - 90);
    this.historialFrecuenciaHasta = hasta.toISOString().split('T')[0];
    this.historialFrecuenciaDesde = desde.toISOString().split('T')[0];

    this.asistenciaService.historialPorCedula(ced)
      .pipe(
        timeout(10000),
        catchError(e => {
          if (e.name === 'TimeoutError') {
            this.historialError = 'La consulta demoro demasiado. Intenta nuevamente.';
          } else if (e.status === 403) {
            this.historialError = e.error?.message || 'No tenes permiso para consultar la asistencia de este nino.';
          } else {
            this.historialError = e.error?.message || 'Cedula no encontrada.';
          }
          return of(null as unknown as AsistenciaResponse[]);
        }),
        finalize(() => {
          this.historialCargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: r => {
          if (!r) return;
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

  seleccionarNinioHistorial(ninio: NinioConEstado): void {
    this.historialNinioSeleccionadoId = ninio.id;
    this.historialCedula = ninio.cedula;
    this.buscarHistorial();
  }

  cargarFrecuenciaHistorial(cedula: string): void {
    this.historialFrecuenciaCargando = true;
    this.historialCalendarioVisible = false;
    this.asistenciaService.frecuenciaPorCedula(
      cedula,
      this.historialFrecuenciaDesde,
      this.historialFrecuenciaHasta
    ).pipe(
      timeout(10000),
      catchError(e => {
        if (e.name === 'TimeoutError') {
          this.historialError = 'La frecuencia demoro demasiado. Intenta nuevamente.';
        } else if (e.status === 403) {
          this.historialError = e.error?.message || 'No tenes permiso para consultar la frecuencia de este nino.';
        }
        return of(null as unknown as FrecuenciaAsistenciaResponse);
      }),
      finalize(() => {
        this.historialFrecuenciaCargando = false;
        this.cdr.detectChanges();
      })
    )
      .subscribe({
        next: r => {
          if (!r) return;
          this.historialFrecuencia = r;
        },
        error: () => {} // silencioso, el historial ya se mostró
      });
  }

  actualizarFrecuenciaHistorial(): void {
    const ced = this.historialCedula.trim();
    if (!ced || !this.historialFrecuenciaDesde || !this.historialFrecuenciaHasta) return;
    this.historialCalendarioVisible = false;
    this.historialCalendarioMeses = [];
    this.cargarFrecuenciaHistorial(ced);
  }

  /** Construye el calendario para el modal de historial y lo muestra/oculta */
  toggleHistorialCalendario(): void {
    if (this.historialCalendarioVisible) {
      this.historialCalendarioVisible = false;
      return;
    }
    if (!this.historialFrecuencia) return;

    // Las fechas donde el niño asistió las sacamos de historialRegistros
    // (que está filtrado al período completo del niño, así que filtramos al rango actual)
    const fechasPresente = new Set(
      this.historialRegistros
        .filter(r => r.fecha >= this.historialFrecuenciaDesde && r.fecha <= this.historialFrecuenciaHasta)
        .map(r => r.fecha)
    );

    this.historialCalendarioMeses = this.construirCalendario(
      this.historialFrecuenciaDesde,
      this.historialFrecuenciaHasta,
      fechasPresente,
      this.historialFrecuencia.totalDiasHabiles
    );
    this.historialCalendarioVisible = true;
  }

  buscarFrecuencia(): void {
    const ced = this.frecuenciaCedula.trim();
    if (!ced || !this.frecuenciaDesde || !this.frecuenciaHasta) {
      this.frecuenciaError = 'Complete la cédula y el rango de fechas.';
      return;
    }
    this.frecuenciaError = '';
    this.frecuenciaResultado = null;
    this._frecuenciaFechasPresente = new Set();
    this.frecuenciaCargando = true;
    this.frecuenciaCalendarioVisible = false;
    this.frecuenciaCalendarioMeses = [];

    // Paso 1: buscar frecuencia. Si falla, es error real (cédula no existe, etc.)
    // Paso 2: buscar historial con catchError → si falla (niño sin asistencias previas),
    //         lo tratamos silenciosamente: el calendario simplemente no tendrá días marcados
    //         como presentes pero los stats de frecuencia sí se muestran.
    this.asistenciaService.frecuenciaPorCedula(ced, this.frecuenciaDesde, this.frecuenciaHasta)
      .pipe(finalize(() => this.frecuenciaCargando = false))
      .subscribe({
        next: frecuencia => {
          this.frecuenciaResultado = frecuencia;
          // Buscar historial por separado para poder pintar el calendario;
          // si falla (niño sin historial) no afecta los stats ya mostrados.
          this.asistenciaService.historialPorCedula(ced)
            .pipe(catchError(() => of([])))
            .subscribe(historial => {
              this._frecuenciaFechasPresente = new Set(
                historial
                  .filter(r => r.fecha >= this.frecuenciaDesde && r.fecha <= this.frecuenciaHasta)
                  .map(r => r.fecha)
              );
            });
        },
        error: e => this.frecuenciaError = e.error?.message || 'Cédula no encontrada.'
      });
  }

  // Almacén interno de fechas presentes para el calendario standalone
  private _frecuenciaFechasPresente: Set<string> = new Set();

  /** Construye el calendario para el panel standalone y lo muestra/oculta */
  toggleFrecuenciaCalendario(): void {
    if (this.frecuenciaCalendarioVisible) {
      this.frecuenciaCalendarioVisible = false;
      return;
    }
    if (!this.frecuenciaResultado) return;

    this.frecuenciaCalendarioMeses = this.construirCalendario(
      this.frecuenciaDesde,
      this.frecuenciaHasta,
      this._frecuenciaFechasPresente,
      this.frecuenciaResultado.totalDiasHabiles
    );
    this.frecuenciaCalendarioVisible = true;
  }

  limpiarFrecuencia(): void {
    this.frecuenciaCedula = '';
    this.frecuenciaDesde = '';
    this.frecuenciaHasta = '';
    this.frecuenciaResultado = null;
    this.frecuenciaError = '';
    this.frecuenciaCalendarioVisible = false;
    this.frecuenciaCalendarioMeses = [];
    this._frecuenciaFechasPresente = new Set();
  }

  construirCalendario(
    desde: string,
    hasta: string,
    fechasPresente: Set<string>,
    totalDiasHabiles: number
  ): { anio: number; mes: number; label: string; dias: CalendarioDia[] }[] {
    const desdeFecha = new Date(desde + 'T00:00:00');
    const hastaFecha = new Date(hasta + 'T00:00:00');

    // Agrupar por mes
    const mesesMap = new Map<string, { anio: number; mes: number; diasDelMes: Date[] }>();

    const cur = new Date(desdeFecha);
    while (cur <= hastaFecha) {
      const key = `${cur.getFullYear()}-${cur.getMonth()}`;
      if (!mesesMap.has(key)) {
        mesesMap.set(key, { anio: cur.getFullYear(), mes: cur.getMonth(), diasDelMes: [] });
      }
      mesesMap.get(key)!.diasDelMes.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const NOMBRES_MESES = [
      'Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
    ];

    return Array.from(mesesMap.values()).map(({ anio, mes, diasDelMes }) => {
      // Generar el grid completo del mes (lunes a domingo)
      const primerDia = new Date(anio, mes, 1);
      const ultimoDia = new Date(anio, mes + 1, 0);

      // Offset para iniciar la semana en lunes (0=lun,...,6=dom)
      const offsetInicio = (primerDia.getDay() + 6) % 7;

      const dias: CalendarioDia[] = [];

      // Días vacíos antes del 1
      for (let i = 0; i < offsetInicio; i++) {
        dias.push({ fecha: new Date(0), tipo: 'fueraPeriodo', tooltip: '' });
      }

      // Días del mes
      for (let d = 1; d <= ultimoDia.getDate(); d++) {
        const fecha = new Date(anio, mes, d);
        const fechaStr = fecha.toISOString().split('T')[0];
        const dow = fecha.getDay(); // 0=dom,6=sab

        let tipo: CalendarioDia['tipo'];
        let tooltip: string;

        if (fecha < desdeFecha || fecha > hastaFecha) {
          tipo = 'fueraPeriodo';
          tooltip = '';
        } else if (dow === 0 || dow === 6) {
          // Fin de semana — nunca cuenta como día hábil
          tipo = 'noHabil';
          tooltip = 'Fin de semana';
        } else if (fechasPresente.has(fechaStr)) {
          tipo = 'presente';
          tooltip = 'Presente';
        } else {
          // Día de semana en el rango donde el niño no asistió.
          // Puede ser: día que el centro no abrió (feriado / vacaciones) O ausencia real.
          // El backend los distingue internamente con countDiasConAsistenciaEnPeriodo,
          // pero esa info no llega por día individual al frontend.
          // Los mostramos como "ausente" (el texto del tooltip lo aclara).
          tipo = 'ausente';
          tooltip = 'Ausente o centro cerrado';
        }

        dias.push({ fecha, tipo, tooltip });
      }

      return {
        anio,
        mes,
        label: `${NOMBRES_MESES[mes]} ${anio}`,
        dias
      };
    });
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
    this.inicializarRangoMiHistorial();
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

  inicializarRangoMiHistorial(): void {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);
    this.miHistorialHasta = hasta.toISOString().split('T')[0];
    this.miHistorialDesde = desde.toISOString().split('T')[0];
  }

  cargarMiHistorial(): void {
    if (!this.miHistorialDesde || !this.miHistorialHasta) {
      this.miHistorialError = 'Seleccione el rango de fechas.';
      return;
    }

    const desde = new Date(this.miHistorialDesde + 'T00:00:00');
    const hasta = new Date(this.miHistorialHasta + 'T00:00:00');

    if (desde > hasta) {
      this.miHistorialError = 'La fecha desde no puede ser posterior a la fecha hasta.';
      return;
    }

    const dias = this.fechasEnRango(this.miHistorialDesde, this.miHistorialHasta);
    if (dias.length > 90) {
      this.miHistorialError = 'El historial permite consultar hasta 90 dias por vez.';
      return;
    }

    this.miHistorialError = '';
    this.miHistorialCargando = true;
    this.miHistorialRegistros = [];

    forkJoin(dias.map(fecha => this.asistenciaService.obtenerMiRegistroDelDia(fecha)))
      .pipe(finalize(() => {
        this.miHistorialCargando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: registros => {
          this.miHistorialRegistros = registros
            .filter((r): r is AsistenciaResponse => !!r)
            .sort((a, b) => b.fecha.localeCompare(a.fecha));
        },
        error: e => {
          this.miHistorialError = e.error?.message || 'Error al cargar tu historial de asistencia.';
        }
      });
  }

  fechasEnRango(desde: string, hasta: string): string[] {
    const fechas: string[] = [];
    const actual = new Date(desde + 'T00:00:00');
    const fin = new Date(hasta + 'T00:00:00');
    while (actual <= fin) {
      fechas.push(actual.toISOString().split('T')[0]);
      actual.setDate(actual.getDate() + 1);
    }
    return fechas;
  }

  formatHora(h?: string): string {
    return h ? h.substring(0, 5) : '-';
  }

  minutosTrabajados(registro: AsistenciaResponse): number {
    if (!registro.horaEntrada || !registro.horaSalida) return 0;
    const [he, me] = registro.horaEntrada.split(':').map(Number);
    const [hs, ms] = registro.horaSalida.split(':').map(Number);
    return Math.max(0, (hs * 60 + ms) - (he * 60 + me));
  }

  formatDuracion(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins}m`;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}m`;
  }

  get miHistorialTotalHoras(): string {
    const total = this.miHistorialRegistros.reduce((acc, r) => acc + this.minutosTrabajados(r), 0);
    return this.formatDuracion(total);
  }

  get miHistorialPendientesSalida(): number {
    return this.miHistorialRegistros.filter(r => !r.horaSalida).length;
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
    if (!this.esHoy) {
      this.toast.show('No se puede registrar asistencia fuera de fecha', 'error');
      return;
    }
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
          this.cargarMiHistorial();
          this.toast.show('Entrada registrada correctamente', 'success');
        },
        error: e => this.toast.show(e.error?.message || 'Error al registrar entrada', 'error')
      });
  }

  abrirFormSalida(): void {
    this.horaSalidaInput = this.horaActual();
  }

  registrarSalida(): void {
    if (!this.esHoy) {
      this.toast.show('No se puede registrar asistencia fuera de fecha', 'error');
      return;
    }
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
          this.cargarMiHistorial();
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
    if (!this.esHoy) {
      this.toast.show('No se puede marcar asistencia fuera de fecha', 'error');
      return;
    }
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
    if (!this.esHoy) {
      this.toast.show('No se puede marcar asistencia fuera de fecha', 'error');
      return;
    }
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
    if (!this.esHoy) {
      this.toast.show('No se puede registrar asistencia fuera de fecha', 'error');
      return;
    }
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
