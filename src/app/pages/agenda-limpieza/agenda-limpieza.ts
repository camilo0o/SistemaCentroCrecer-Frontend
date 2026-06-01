import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { AgendaLimpiezaService } from '../../services/agenda-limpieza.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import {
  AgendaLimpiezaRequest,
  AgendaLimpiezaResponse,
  EstadoLimpieza,
  ESTADO_LIMPIEZA_DISPLAY,
  SubtipoAgendaResponse
} from '../../models/models';

// ─── Dialog Crear/Editar ──────────────────────────────────────────────────────
@Component({
  selector: 'app-agenda-limpieza-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.modo === 'crear' ? 'Nueva tarea de limpieza' : 'Editar tarea' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:24px;min-width:480px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:16px">

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="3"></textarea>
          @if(form.get('descripcion')?.invalid && form.get('descripcion')?.touched){
            <mat-error>La descripción es obligatoria</mat-error>
          }
        </mat-form-field>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <mat-form-field appearance="outline">
            <mat-label>Zona</mat-label>
            <input matInput formControlName="zona" placeholder="Ej: Salón principal">
            @if(form.get('zona')?.invalid && form.get('zona')?.touched){
              <mat-error>La zona es obligatoria</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Frecuencia (días)</mat-label>
            <input matInput type="number" min="1" formControlName="frecuencia">
            @if(form.get('frecuencia')?.invalid && form.get('frecuencia')?.touched){
              <mat-error>La frecuencia es obligatoria</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Subtipo</mat-label>
          <mat-select formControlName="subtipoAgendaId">
            @for(s of data.subtipos; track s.subtipoId){
              <mat-option [value]="s.subtipoId">{{ s.subtipo }}</mat-option>
            }
          </mat-select>
          @if(form.get('subtipoAgendaId')?.invalid && form.get('subtipoAgendaId')?.touched){
            <mat-error>Seleccioná un subtipo</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fecha</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="fecha" readonly>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          @if(form.get('fecha')?.invalid && form.get('fecha')?.touched){
            <mat-error>La fecha es obligatoria</mat-error>
          }
        </mat-form-field>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <mat-form-field appearance="outline">
            <mat-label>Hora inicio</mat-label>
            <input matInput type="time" formControlName="horaInicio">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hora fin</mat-label>
            <input matInput type="time" formControlName="horaFin">
          </mat-form-field>
        </div>

      </form>
    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white"
        (click)="guardar()" [disabled]="guardando">
        @if(guardando){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
        @else { Guardar }
      </button>
    </div>
  `
})
export class AgendaLimpiezaDialogComponent {
  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<AgendaLimpiezaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      modo: 'crear' | 'editar';
      item?: AgendaLimpiezaResponse;
      subtipos: SubtipoAgendaResponse[];
      funcionarioId: number;
    },
    private service: AgendaLimpiezaService,
    private toast: ToastService
  ) {
    const i = data.item;
    this.form = this.fb.group({
      descripcion:    [i?.descripcion ?? '',          Validators.required],
      zona:           [i?.zona ?? '',                 Validators.required],
      frecuencia:     [i?.frecuencia ?? null,         Validators.required],
      subtipoAgendaId:[i?.subtipoAgendaId ?? null,    Validators.required],
      fecha:          [i?.fecha ? new Date(i.fecha + 'T00:00:00') : null, Validators.required],
      horaInicio:     [i?.horaInicio ?? ''],
      horaFin:        [i?.horaFin ?? ''],
    });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const v = this.form.value;
    const payload: AgendaLimpiezaRequest = {
      ...v,
      fecha: v.fecha instanceof Date ? v.fecha.toISOString().split('T')[0] : v.fecha,
      funcionarioId: this.data.funcionarioId,
    };
    const op = this.data.modo === 'crear'
      ? this.service.crear(payload)
      : this.service.actualizar(this.data.item!.id, payload);
    op.subscribe({
      next: (r) => { this.guardando = false; this.ref.close(r); },
      error: (err) => {
        this.guardando = false;
        this.toast.error(err.error?.error ?? 'Error al guardar');
      }
    });
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────
@Component({
  selector: 'app-agenda-limpieza',
  standalone: true,
  imports: [
    CommonModule, FormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDialogModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule, MatPaginatorModule
  ],
  templateUrl: './agenda-limpieza.html',
  styleUrl: './agenda-limpieza.css'
})
export class AgendaLimpiezaComponent implements OnInit {
  items: AgendaLimpiezaResponse[]    = [];
  filtradas: AgendaLimpiezaResponse[] = [];
  pagina: AgendaLimpiezaResponse[]   = [];
  subtipos: SubtipoAgendaResponse[]  = [];

  cargando     = true;
  busqueda     = '';
  filtroEstado: EstadoLimpieza | 'todos' = 'todos';

  estadoDisplay = ESTADO_LIMPIEZA_DISPLAY;
  estadoOpciones: EstadoLimpieza[] = ['PENDIENTE', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA'];
  columnas  = ['descripcion', 'zona', 'subtipo', 'fecha', 'hora', 'estado', 'acciones'];
  pageSize  = 10;
  pageIndex = 0;

  funcionarioId = 0;

  constructor(
    private service: AgendaLimpiezaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.funcionarioId = this.authService.getUserId() ?? 0;
    this.service.listarSubtipos().subscribe(s => this.subtipos = s);
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.service.listarPorFuncionario(this.funcionarioId).pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (data) => { this.items = data; this.aplicarFiltros(); },
      error: () => this.toast.error('Error al cargar la agenda de limpieza')
    });
  }

  aplicarFiltros() {
    let res = [...this.items];
    if (this.busqueda) {
      const b = this.busqueda.toLowerCase();
      res = res.filter(i =>
        i.descripcion?.toLowerCase().includes(b) ||
        i.zona?.toLowerCase().includes(b) ||
        i.subtipoAgendaNombre?.toLowerCase().includes(b)
      );
    }
    if (this.filtroEstado !== 'todos') {
      res = res.filter(i => i.estado === this.filtroEstado);
    }
    this.filtradas  = res;
    this.pageIndex  = 0;
    this.actualizarPagina();
  }

  actualizarPagina() {
    const start = this.pageIndex * this.pageSize;
    this.pagina = this.filtradas.slice(start, start + this.pageSize);
  }

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize  = e.pageSize;
    this.actualizarPagina();
  }

  abrirCrear() {
    const ref = this.dialog.open(AgendaLimpiezaDialogComponent, {
      data: { modo: 'crear', subtipos: this.subtipos, funcionarioId: this.funcionarioId }
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.toast.success('Tarea creada'); this.cargar(); }
    });
  }

  abrirEditar(item: AgendaLimpiezaResponse) {
    const ref = this.dialog.open(AgendaLimpiezaDialogComponent, {
      data: { modo: 'editar', item, subtipos: this.subtipos, funcionarioId: this.funcionarioId }
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.toast.success('Tarea actualizada'); this.cargar(); }
    });
  }

  cambiarEstado(item: AgendaLimpiezaResponse, estado: EstadoLimpieza) {
    this.service.cambiarEstado(item.id, estado).subscribe({
      next: () => { this.toast.success('Estado actualizado'); this.cargar(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al cambiar estado')
    });
  }

  eliminar(item: AgendaLimpiezaResponse) {
    this.service.eliminar(item.id).subscribe({
      next: () => { this.toast.success('Tarea eliminada'); this.cargar(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al eliminar')
    });
  }

  get totalPendientes()  { return this.items.filter(i => i.estado === 'PENDIENTE').length; }
  get totalEnProceso()   { return this.items.filter(i => i.estado === 'EN_PROCESO').length; }
  get totalCompletados() { return this.items.filter(i => i.estado === 'FINALIZADA').length; }
  formatFecha(f?: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  estadoClass(estado: EstadoLimpieza): string {
  return {
    PENDIENTE:  'estado-pendiente',
    EN_PROCESO: 'estado-en-proceso',
    FINALIZADA: 'estado-completado',  
    CANCELADA:  'estado-cancelado',
  }[estado] ?? '';
}
}
