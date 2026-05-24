import { Component, OnInit, Inject, ChangeDetectorRef  } from '@angular/core';
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
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { TurnoService } from '../../services/turno.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { ToastService } from '../../services/toast.service';
import { TurnoResponse, TurnoRequest, FuncionarioResponse, ROL_DISPLAY } from '../../models/models';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Turno Dialog 
@Component({
  selector: 'app-turno-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.modo === 'crear' ? 'Nuevo Turno' : 'Editar Turno' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:24px;min-width:440px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:16px">
        <mat-form-field appearance="outline">
          <mat-label>Funcionario</mat-label>
          <mat-select formControlName="funcionarioId">
            @for(f of funcionarios; track f.id){
              <mat-option [value]="f.id">{{ f.nombre }} {{ f.apellido }} — {{ getRolDisplay(f.rol?.nombre) }}</mat-option>
            }
          </mat-select>
          @if(form.get('funcionarioId')?.invalid && form.get('funcionarioId')?.touched){<mat-error>Seleccioná un funcionario</mat-error>}
        </mat-form-field>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <mat-form-field appearance="outline">
            <mat-label>Hora inicio</mat-label>
            <input matInput type="time" formControlName="horaInicio">
            @if(form.get('horaInicio')?.invalid && form.get('horaInicio')?.touched){<mat-error>Requerida</mat-error>}
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hora fin</mat-label>
            <input matInput type="time" formControlName="horaFin">
            @if(form.get('horaFin')?.invalid && form.get('horaFin')?.touched){<mat-error>Requerida</mat-error>}
          </mat-form-field>
        </div>
        @if(horasError){
          <div style="color:#C62828;font-size:12px;display:flex;gap:6px;align-items:center">
            <mat-icon style="font-size:16px;width:16px;height:16px">error</mat-icon>
            La hora de fin debe ser posterior a la de inicio
          </div>
        }
      </form>
    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white" (click)="guardar()" [disabled]="guardando">
        @if(guardando){<mat-spinner diameter="18" color="accent"></mat-spinner>}@else{Guardar Turno}
      </button>
    </div>
  `
})
export class TurnoDialogComponent {
  form: FormGroup;
  guardando = false;
  get horasError() {
    const hi = this.form.get('horaInicio')?.value;
    const hf = this.form.get('horaFin')?.value;
    return hi && hf && hi >= hf;
  }
  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<TurnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modo: 'crear'|'editar'; turno?: TurnoResponse; funcionarios: FuncionarioResponse[] },
    private turnoService: TurnoService,
    private toast: ToastService
  ) {
    const t = data.turno;
    this.form = this.fb.group({
      funcionarioId: [t?.funcionarioId ?? null, Validators.required],
      horaInicio: [t?.horaInicio ?? '', Validators.required],
      horaFin: [t?.horaFin ?? '', Validators.required]
    });
  }
  get funcionarios(){
     return this.data.funcionarios; 
    }
  getRolDisplay(n?: string) {
    return n ? (ROL_DISPLAY[n] ?? n) : 'Sin rol';
  }
  guardar() {
    if (this.form.invalid || this.horasError) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const payload: TurnoRequest = this.form.value;
    const op = this.data.modo === 'crear'
      ? this.turnoService.crear(payload)
      : this.turnoService.actualizar(this.data.turno!.id, payload);
    op.subscribe({
      next: (r) => { this.guardando = false; this.ref.close(r); },
      error: (err) => { this.guardando = false; this.toast.error(err.error?.error ?? 'Error al guardar turno'); }
    });
  }
}

// Main
@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
    MatChipsModule, MatPaginatorModule
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
  columnas = ['funcionario', 'horaInicio', 'horaFin', 'duracion', 'estado', 'acciones'];
  pageSize = 10;
  pageIndex = 0;

  constructor(
  private turnoService: TurnoService,
  private funcionarioService: FuncionarioService,
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
    error: () => { this.toast.error('Error al cargar turnos'); }
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
    this.filtrados = res;
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  actualizarPagina() {
    const start = this.pageIndex * this.pageSize;
    this.pagina = this.filtrados.slice(start, start + this.pageSize);
  }

  onPage(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.actualizarPagina(); }

  calcularDuracion(inicio: string, fin: string): string {
    if (!inicio || !fin) return '—';
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins <= 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
  }

  abrirCrear() {
    const ref = this.dialog.open(TurnoDialogComponent, { data: { modo: 'crear', funcionarios: this.funcionarios } });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Turno creado'); this.cargarTurnos(); } });
  }

  abrirEditar(t: TurnoResponse) {
    const ref = this.dialog.open(TurnoDialogComponent, { data: { modo: 'editar', turno: t, funcionarios: this.funcionarios } });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Turno actualizado'); this.cargarTurnos(); } });
  }

  darDeBaja(t: TurnoResponse) {
    this.turnoService.darDeBaja(t.id).subscribe({
      next: () => { this.toast.success('Turno dado de baja'); this.cargarTurnos(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error')
    });
  }

  get totalActivos() { return this.turnos.filter(t => t.activo).length; }
}