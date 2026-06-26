import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { finalize, forkJoin } from 'rxjs';
import { AsistenciaService } from '../../services/asistencia.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { TurnoService } from '../../services/turno.service';
import { ToastService } from '../../services/toast.service';
import {
  AsistenciaResponse, FuncionarioResponse, TurnoResponse,
  ROL_DISPLAY, DIAS_SEMANA, EstadoPuntualidad
} from '../../models/models';

interface FuncionarioCargaHoraria {
  funcionario: FuncionarioResponse;
  turnos: TurnoResponse[];
  horasSemanalesAsignadas: number;
  diasAsignados: string[];
  asistencias: AsistenciaResponse[];
  diasAsistidos: number;
  diasAusentes: number;
  horasEfectivas: number;
  horasEsperadasPeriodo: number;
  pctCumplimiento: number;
  sobrecargado: boolean;
}

/** Margen permitido por encima de las horas esperadas antes de considerar sobrecarga (25%) */
const MARGEN_SOBRECARGA = 1.25;
/** Mínimo de horas excedentes para no marcar sobrecarga por desvíos triviales */
const MIN_HORAS_EXCEDENTES = 2;

@Component({
  selector: 'app-asistencia-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatToolbarModule, MatCardModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatProgressSpinnerModule,
    MatTooltipModule, MatChipsModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './asistencia-admin.html',
  styleUrls: ['./asistencia-admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsistenciaAdminComponent implements OnInit {

  vista: 'asistencias' | 'carga-horaria' = 'asistencias';

  fechaDesde: Date = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d; })();
  fechaHasta: Date = new Date();
  funcionarioSeleccionadoId: number | null = null;
  filtroEstado: string = '';

  funcionarios: FuncionarioResponse[] = [];
  turnos: TurnoResponse[] = [];
  asistencias: AsistenciaResponse[] = [];
  cargaHoraria: FuncionarioCargaHoraria[] = [];

  cargando = false;
  cargandoFuncionarios = true;

  readonly ROL_DISPLAY = ROL_DISPLAY;

  constructor(
    private asistenciaService: AsistenciaService,
    private funcionarioService: FuncionarioService,
    private turnoService: TurnoService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    forkJoin({
      funcionarios: this.funcionarioService.listarActivos(),
      turnos: this.turnoService.listarActivos(),
    }).pipe(
      finalize(() => { this.cargandoFuncionarios = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: ({ funcionarios, turnos }) => {
        this.funcionarios = funcionarios;
        this.turnos = turnos;
        this.buscar();
      },
      error: () => this.toast.error('Error al cargar datos iniciales')
    });
  }

  buscar() {
    if (!this.fechaDesde || !this.fechaHasta) return;
    const desde = this.toDateStr(this.fechaDesde);
    const hasta = this.toDateStr(this.fechaHasta);
    this.cargando = true;

    this.asistenciaService.listarAsistenciasFuncionariosPorRango(desde, hasta).pipe(
      finalize(() => { this.cargando = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: (data) => {
        this.asistencias = data;
        this.construirCargaHoraria(desde, hasta);
        this.verificarSobrecarga();
        this.cdr.markForCheck();
      },
      error: () => this.toast.error('Error al cargar asistencias')
    });
  }

  // ── Filtrado de la tabla de asistencias ───────────────────────────────────
  get asistenciasFiltradas(): AsistenciaResponse[] {
    return this.asistencias.filter(a => {
      if (this.funcionarioSeleccionadoId && a.funcionarioId !== this.funcionarioSeleccionadoId) return false;
      if (this.filtroEstado) {
        const match = a.estadoEntrada === this.filtroEstado || a.estadoSalida === this.filtroEstado;
        if (!match) return false;
      }
      return true;
    });
  }

  // ── Construcción de carga horaria ─────────────────────────────────────────
  private construirCargaHoraria(desde: string, hasta: string) {
    const diasRango = this.diasHabilesEnRango(desde, hasta);

    this.cargaHoraria = this.funcionarios.map(func => {
      const turnosFuncionario = this.turnos.filter(t => t.funcionarioId === func.id);
      const asistenciasFuncionario = this.asistencias.filter(a => a.funcionarioId === func.id);

      // Horas asignadas semanalmente
      const horasSemanalesAsignadas = turnosFuncionario.reduce((acc, t) => {
        const diasCount = t.dias.length;
        const horas = this.diffHoras(t.horaInicio, t.horaFin);
        return acc + horas * diasCount;
      }, 0);

      // Días asignados (nombres únicos)
      const diasAsignadosSet = new Set<string>();
      turnosFuncionario.forEach(t =>
        t.dias.forEach(d => diasAsignadosSet.add(d))
      );
      const diasAsignados = DIAS_SEMANA
        .filter(d => diasAsignadosSet.has(d.valor))
        .map(d => d.abrev);

      // Horas efectivas (suma entrada→salida de asistencias registradas)
      const horasEfectivas = asistenciasFuncionario.reduce((acc, a) => {
        if (a.horaEntrada && a.horaSalida) {
          return acc + this.diffHoras(a.horaEntrada, a.horaSalida);
        }
        return acc;
      }, 0);

      const diasAsistidos = asistenciasFuncionario.length;
      const diasAusentes = Math.max(0, diasRango - diasAsistidos);

      // Horas esperadas en el período = horasDia * diasHabiles dentro de los dias asignados
      const horasEsperadasPeriodo = this.horasEsperadasEnPeriodo(turnosFuncionario, desde, hasta);
      const pctCumplimiento = horasEsperadasPeriodo > 0
        ? Math.round((horasEfectivas / horasEsperadasPeriodo) * 100)
        : 0;

      // Sobrecarga: trabajó significativamente más de lo esperado según su turno
      const excedente = horasEfectivas - horasEsperadasPeriodo;
      const sobrecargado = turnosFuncionario.length > 0
        && horasEsperadasPeriodo > 0
        && horasEfectivas > horasEsperadasPeriodo * MARGEN_SOBRECARGA
        && excedente >= MIN_HORAS_EXCEDENTES;

      return {
        funcionario: func,
        turnos: turnosFuncionario,
        horasSemanalesAsignadas,
        diasAsignados,
        asistencias: asistenciasFuncionario,
        diasAsistidos,
        diasAusentes,
        horasEfectivas,
        horasEsperadasPeriodo,
        pctCumplimiento,
        sobrecargado,
      } as FuncionarioCargaHoraria;
    });

    // Ordenar: primero quienes tienen turno asignado, luego por % cumplimiento asc
    this.cargaHoraria.sort((a, b) => {
      if (a.turnos.length === 0 && b.turnos.length > 0) return 1;
      if (a.turnos.length > 0 && b.turnos.length === 0) return -1;
      return a.pctCumplimiento - b.pctCumplimiento;
    });
  }

  private horasEsperadasEnPeriodo(turnos: TurnoResponse[], desde: string, hasta: string): number {
    let total = 0;
    const cur = new Date(desde + 'T00:00:00');
    const fin = new Date(hasta + 'T00:00:00');
    const diasValores = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    while (cur <= fin) {
      const diaSemana = diasValores[cur.getDay()];
      turnos.forEach(t => {
        if (t.dias.includes(diaSemana as any)) {
          total += this.diffHoras(t.horaInicio, t.horaFin);
        }
      });
      cur.setDate(cur.getDate() + 1);
    }
    return total;
  }

  private diasHabilesEnRango(desde: string, hasta: string): number {
    const d = new Date(desde + 'T00:00:00');
    const h = new Date(hasta + 'T00:00:00');
    let count = 0;
    const cur = new Date(d);
    while (cur <= h) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  diffHoras(inicio: string, fin?: string): number {
    if (!fin) return 0;
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
  }

  formatHora(h?: string): string {
    if (!h) return '—';
    return h.substring(0, 5);
  }

  formatFecha(f?: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-UY', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  toDateStr(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  initials(f: FuncionarioResponse): string {
    return `${f.nombre[0] ?? ''}${f.apellido?.[0] ?? ''}`.toUpperCase();
  }

  getFuncionarioFoto(funcionarioId?: number): string | undefined {
    if (!funcionarioId) return undefined;
    return this.cargaHoraria.find(item => item.funcionario.id === funcionarioId)?.funcionario.fotoPerfil;
  }

  getAsistenciaIniciales(a: AsistenciaResponse): string {
    const funcionario = a.funcionarioId
      ? this.cargaHoraria.find(item => item.funcionario.id === a.funcionarioId)?.funcionario
      : undefined;
    if (funcionario) return this.initials(funcionario);
    return a.funcionarioNombre
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase() || '?';
  }

  estadoLabel(e?: EstadoPuntualidad): string {
    switch (e) {
      case 'EN_HORARIO': return 'En horario';
      case 'TARDE':      return 'Tarde';
      case 'TEMPRANO':   return 'Temprano';
      case 'SIN_TURNO_ASIGNADO': return 'Sin turno';
      default: return '—';
    }
  }

  estadoClass(e?: EstadoPuntualidad): string {
    switch (e) {
      case 'EN_HORARIO': return 'estado-ok';
      case 'TARDE':      return 'estado-tarde';
      case 'TEMPRANO':   return 'estado-temprano';
      case 'SIN_TURNO_ASIGNADO': return 'estado-sin';
      default: return 'estado-sin';
    }
  }

  redondear(n: number): string {
    return n % 1 === 0 ? `${n}h` : `${n.toFixed(1)}h`;
  }

  get totalRegistros(): number { return this.asistencias.length; }

  get totalTardanzas(): number {
    return this.asistencias.filter(a => a.estadoEntrada === 'TARDE').length;
  }

  get totalSinTurno(): number {
    return this.asistencias.filter(a => a.estadoEntrada === 'SIN_TURNO_ASIGNADO').length;
  }

  get funcionariosConAsistencia(): number {
    return new Set(this.asistencias.map(a => a.funcionarioId)).size;
  }

  get cargaHorariaFiltrada(): FuncionarioCargaHoraria[] {
    if (!this.funcionarioSeleccionadoId) return this.cargaHoraria;
    return this.cargaHoraria.filter(c => c.funcionario.id === this.funcionarioSeleccionadoId);
  }

  /**
   * Detecta funcionarios cuyas horas efectivamente trabajadas (según fichadas
   * de asistencia) superan significativamente las horas esperadas según su
   * turno asignado, dentro del período consultado.
   */
  verificarSobrecarga() {
    const sobrecargados = this.cargaHoraria.filter(c => c.sobrecargado);

    if (sobrecargados.length > 0) {
      const nombres = sobrecargados
        .map(c => `${c.funcionario.nombre} ${c.funcionario.apellido}`)
        .join(', ');
      this.toast.error(
        `${sobrecargados.length} funcionario(s) con sobrecarga en el período: ${nombres}`
      );
    }
  }
}