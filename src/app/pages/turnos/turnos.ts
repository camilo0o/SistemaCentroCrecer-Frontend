import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { TurnoService } from '../../services/turno.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import {
  TurnoResponse, TurnoRequest, FuncionarioResponse,
  ROL_DISPLAY, DiaSemana, DIAS_SEMANA
} from '../../models/models';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// ─── Dialog ───────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-turno-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatCheckboxModule
  ],
  styles: [`
    .dias-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 4px;
    }
    .dia-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 8px;
      border: 1.5px solid #e0e0e0;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #555;
      transition: all 0.15s;
      user-select: none;
    }
    .dia-toggle.selected {
      border-color: #1565C0;
      background: #e3f0fb;
      color: #1565C0;
    }
    .dias-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .dias-error {
      color: #C62828;
      font-size: 11px;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .semana-atajos {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .atajo-btn {
      font-size: 11px;
      padding: 2px 10px;
      border-radius: 12px;
      border: 1px solid #1565C0;
      color: #1565C0;
      background: white;
      cursor: pointer;
      font-weight: 500;
    }
    .atajo-btn:hover { background: #e3f0fb; }
  `],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.modo === 'crear' ? 'Nuevo Turno' : 'Editar Turno' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:24px;min-width:460px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:16px">

        <!-- Funcionario -->
        <mat-form-field appearance="outline">
          <mat-label>Funcionario</mat-label>
          <mat-select formControlName="funcionarioId" [disabled]="!!data.funcionarioIdFijo">
            @for(f of funcionarios; track f.id){
              <mat-option [value]="f.id">{{ f.nombre }} {{ f.apellido }} — {{ getRolDisplay(f.rol?.nombre) }}</mat-option>
            }
          </mat-select>
          @if(form.get('funcionarioId')?.invalid && form.get('funcionarioId')?.touched){
            <mat-error>Seleccioná un funcionario</mat-error>
          }
        </mat-form-field>
        @if(data.funcionarioIdFijo){
          <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#E3F2FD;border-radius:8px;border:1px solid #BBDEFB;margin-top:-8px">
            <mat-icon style="color:#1565C0;font-size:18px">lock</mat-icon>
            <span style="font-size:13px;color:#1565C0">El turno se creará a tu nombre</span>
          </div>
        }

        <!-- Horario -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <mat-form-field appearance="outline">
            <mat-label>Hora inicio</mat-label>
            <input matInput type="time" formControlName="horaInicio">
            @if(form.get('horaInicio')?.invalid && form.get('horaInicio')?.touched){
              <mat-error>Requerida</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hora fin</mat-label>
            <input matInput type="time" formControlName="horaFin">
            @if(form.get('horaFin')?.invalid && form.get('horaFin')?.touched){
              <mat-error>Requerida</mat-error>
            }
          </mat-form-field>
        </div>
        @if(horasError){
          <div style="color:#C62828;font-size:12px;display:flex;gap:6px;align-items:center;margin-top:-8px">
            <mat-icon style="font-size:16px;width:16px;height:16px">error</mat-icon>
            La hora de fin debe ser posterior a la de inicio
          </div>
        }

        <!-- Días de la semana -->
        <div>
          <div class="dias-label">Días de la semana *</div>

          <!-- Atajos rápidos -->
          <div class="semana-atajos">
            <button type="button" class="atajo-btn" (click)="seleccionarLunesViernes()">Lun – Vie</button>
            <button type="button" class="atajo-btn" (click)="seleccionarTodos()">Todos</button>
            <button type="button" class="atajo-btn" (click)="limpiarDias()">Ninguno</button>
          </div>

          <div class="dias-grid">
            @for(d of diasSemana; track d.valor){
              <div class="dia-toggle" [class.selected]="isDiaSelected(d.valor)" (click)="toggleDia(d.valor)">
                <mat-icon style="font-size:15px;width:15px;height:15px">
                  {{ isDiaSelected(d.valor) ? 'check_box' : 'check_box_outline_blank' }}
                </mat-icon>
                {{ d.etiqueta }}
              </div>
            }
          </div>

          @if(diasError){
            <div class="dias-error">
              <mat-icon style="font-size:14px;width:14px;height:14px">error</mat-icon>
              Seleccioná al menos un día
            </div>
          }
        </div>

      </form>
    </mat-dialog-content>

    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white" (click)="guardar()" [disabled]="guardando">
        @if(guardando){<mat-spinner diameter="18" color="accent"></mat-spinner>}
        @else { Guardar Turno }
      </button>
    </div>
  `
})
export class TurnoDialogComponent {
  form: FormGroup;
  guardando = false;
  diasSemana = DIAS_SEMANA;
  diasSeleccionados: Set<DiaSemana> = new Set();
  diasTocados = false;

  get horasError() {
    const hi = this.form.get('horaInicio')?.value;
    const hf = this.form.get('horaFin')?.value;
    return hi && hf && hi >= hf;
  }

  get diasError() {
    return this.diasTocados && this.diasSeleccionados.size === 0;
  }

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<TurnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      modo: 'crear' | 'editar';
      turno?: TurnoResponse;
      funcionarios: FuncionarioResponse[];
      /** Si está definido, el select de funcionario queda bloqueado con este valor */
      funcionarioIdFijo?: number | null;
    },
    private turnoService: TurnoService,
    private toast: ToastService
  ) {
    const t = data.turno;
    // Preseleccionar: en edición usar el del turno, en creación usar el fijo si existe
    const funcionarioInicial = t?.funcionarioId ?? data.funcionarioIdFijo ?? null;
    this.form = this.fb.group({
      funcionarioId: [funcionarioInicial, Validators.required],
      horaInicio: [t?.horaInicio ?? '', Validators.required],
      horaFin: [t?.horaFin ?? '', Validators.required],
    });
    if (t?.dias?.length) {
      this.diasSeleccionados = new Set(t.dias);
    }
  }

  get funcionarios() { return this.data.funcionarios; }

  getRolDisplay(n?: string) { return n ? (ROL_DISPLAY[n] ?? n) : 'Sin rol'; }

  isDiaSelected(dia: DiaSemana): boolean { return this.diasSeleccionados.has(dia); }

  toggleDia(dia: DiaSemana) {
    if (this.diasSeleccionados.has(dia)) this.diasSeleccionados.delete(dia);
    else this.diasSeleccionados.add(dia);
  }

  seleccionarLunesViernes() {
    this.diasSeleccionados = new Set<DiaSemana>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  }

  seleccionarTodos() {
    this.diasSeleccionados = new Set(DIAS_SEMANA.map(d => d.valor));
  }

  limpiarDias() { this.diasSeleccionados.clear(); }

  guardar() {
    this.diasTocados = true;
    if (this.form.invalid || this.horasError || this.diasSeleccionados.size === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const payload: TurnoRequest = {
      ...this.form.value,
      dias: Array.from(this.diasSeleccionados)
    };
    const op = this.data.modo === 'crear'
      ? this.turnoService.crear(payload)
      : this.turnoService.actualizar(this.data.turno!.id, payload);
    op.subscribe({
      next: (r) => { this.guardando = false; this.ref.close(r); },
      error: (err) => { this.guardando = false; this.toast.error(err.error?.error ?? 'Error al guardar turno'); }
    });
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
    MatChipsModule, MatPaginatorModule, MatCheckboxModule
  ],
  templateUrl: './turnos.html',
  styleUrl: './turnos.css'
})
export class TurnosComponent implements OnInit {
  turnos: TurnoResponse[] = [];
  filtrados: TurnoResponse[] = [];
  pagina: TurnoResponse[] = [];
  funcionarios: FuncionarioResponse[] = [];
  cargando = true;
  busqueda = '';
  filtroEstado = 'todos';
  filtroDia = 'todos';
  columnas = ['funcionario', 'dias', 'horaInicio', 'horaFin', 'duracion', 'estado', 'acciones'];
  pageSize = 10;
  pageIndex = 0;
  diasSemana = DIAS_SEMANA;
  vistaActual: 'semana' | 'tabla' = 'semana';

  constructor(
    private turnoService: TurnoService,
    private funcionarioService: FuncionarioService,
    private authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.funcionarioService.listarActivos().subscribe(f => this.funcionarios = f);
    this.cargarTurnos();
  }

  cargarTurnos() {
    this.cargando = true;
    this.turnoService.listarTodos().pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (t) => { this.turnos = t; this.aplicarFiltros(); },
      error: () => this.toast.error('Error al cargar turnos')
    });
  }

  aplicarFiltros() {
    let res = [...this.turnos];
    if (this.busqueda) {
      const b = this.busqueda.toLowerCase();
      res = res.filter(t => t.funcionarioNombre?.toLowerCase().includes(b));
    }
    if (this.filtroEstado === 'activos') res = res.filter(t => t.activo);
    else if (this.filtroEstado === 'inactivos') res = res.filter(t => !t.activo);
    if (this.filtroDia !== 'todos') {
      res = res.filter(t => t.dias?.includes(this.filtroDia as DiaSemana));
    }
    this.filtrados = res;
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  actualizarPagina() {
    const start = this.pageIndex * this.pageSize;
    this.pagina = this.filtrados.slice(start, start + this.pageSize);
  }

  onPage(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.actualizarPagina(); }

  /** Devuelve turnos filtrados que incluyen el día dado */
  turnosPorDia(dia: DiaSemana): TurnoResponse[] {
    return this.filtrados.filter(t => t.dias?.includes(dia));
  }

  calcularDuracion(inicio: string, fin: string): string {
    if (!inicio || !fin) return '—';
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins <= 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ' ' + m + 'm' : ''}` : `${m}m`;
  }

  /** Devuelve la abreviación del día en español */
  getDiaLabel(dia: string): string {
    return DIAS_SEMANA.find(d => d.valor === dia)?.abrev ?? dia;
  }

  /** Ordena días en orden natural de la semana */
  ordenarDias(dias: DiaSemana[]): DiaSemana[] {
    const orden = DIAS_SEMANA.map(d => d.valor);
    return [...(dias ?? [])].sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
  }

  abrirCrear() {
    // Si es un funcionario raso, solo puede crear su propio turno:
    // se le pasa la lista con solo su propio registro (o toda si es admin/coordinadora)
    const funcionariosFiltrados = this.esAdminOCoordinadora
      ? this.funcionarios
      : this.funcionarios.filter(f => f.id === this.funcionarioIdPropio);
    const preseleccionado = this.esAdminOCoordinadora ? null : this.funcionarioIdPropio;
    const ref = this.dialog.open(TurnoDialogComponent, {
      data: {
        modo: 'crear',
        funcionarios: funcionariosFiltrados,
        funcionarioIdFijo: preseleccionado
      }
    });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Turno creado'); this.cargarTurnos(); } });
  }

  abrirEditar(t: TurnoResponse) {
    if (!this.puedeGestionar(t)) {
      this.toast.error('Solo podés editar tus propios turnos');
      return;
    }
    const funcionariosFiltrados = this.esAdminOCoordinadora
      ? this.funcionarios
      : this.funcionarios.filter(f => f.id === this.funcionarioIdPropio);
    const ref = this.dialog.open(TurnoDialogComponent, {
      data: {
        modo: 'editar',
        turno: t,
        funcionarios: funcionariosFiltrados,
        funcionarioIdFijo: this.esAdminOCoordinadora ? null : this.funcionarioIdPropio
      }
    });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Turno actualizado'); this.cargarTurnos(); } });
  }

  darDeBaja(t: TurnoResponse) {
    if (!this.puedeGestionar(t)) {
      this.toast.error('Solo podés dar de baja tus propios turnos');
      return;
    }
    this.turnoService.darDeBaja(t.id).subscribe({
      next: () => { this.toast.success('Turno dado de baja'); this.cargarTurnos(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error')
    });
  }

  reactivar(t: TurnoResponse) {
    this.turnoService.reactivar(t.id).subscribe({
      next: () => { this.toast.success('Turno reactivado'); this.cargarTurnos(); },
      error: (err) => this.toast.error(err.error?.message ?? err.error?.error ?? 'Error al reactivar')
    });
  }

  /** Admin y coordinadora pueden gestionar cualquier turno; un funcionario solo puede gestionar el suyo */
  puedeGestionar(t: TurnoResponse): boolean {
    const rol = this.authService.getRol();
    if (rol === 'ADMINISTRADOR_SISTEMA' || rol === 'COORDINADORA') return true;
    return t.funcionarioId === this.authService.getUserId();
  }

  /** Mantiene compatibilidad: dar de alta solo si puede gestionar */
  puedeReactivar(t: TurnoResponse): boolean {
    return this.puedeGestionar(t);
  }

  /** True si el usuario logueado es admin o coordinadora */
  get esAdminOCoordinadora(): boolean {
    const rol = this.authService.getRol();
    return rol === 'ADMINISTRADOR_SISTEMA' || rol === 'COORDINADORA';
  }

  /** ID del funcionario logueado (null si es admin sin registro de funcionario) */
  get funcionarioIdPropio(): number | null {
    return this.authService.getUserId();
  }

  get totalActivos() { return this.turnos.filter(t => t.activo).length; }
}