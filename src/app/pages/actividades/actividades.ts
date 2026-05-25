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
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { ActividadService } from '../../services/actividad.service';
import { ToastService } from '../../services/toast.service';
import {
  ActividadRequest,
  ActividadResponse,
  EmpresaExternaResponse,
  PermisoResponse
} from '../../models/models';

// ─── Dialog Crear/Editar Actividad ──────────────────────────────────────────
@Component({
  selector: 'app-actividad-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.modo === 'crear' ? 'Nueva Actividad' : 'Editar Actividad' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:24px;min-width:480px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:16px">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Salida al parque">
          @if(form.get('nombre')?.invalid && form.get('nombre')?.touched){<mat-error>Requerido</mat-error>}
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="2" placeholder="Descripción opcional"></textarea>
        </mat-form-field>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <mat-form-field appearance="outline">
            <mat-label>Fecha inicio</mat-label>
            <input matInput type="date" formControlName="fechaDesde">
            @if(form.get('fechaDesde')?.invalid && form.get('fechaDesde')?.touched){<mat-error>Requerida</mat-error>}
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha fin</mat-label>
            <input matInput type="date" formControlName="fechaHasta">
          </mat-form-field>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <mat-form-field appearance="outline">
            <mat-label>Hora inicio</mat-label>
            <input matInput type="time" formControlName="horaInicio">
            @if(form.get('horaInicio')?.invalid && form.get('horaInicio')?.touched){<mat-error>Requerida</mat-error>}
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hora salida</mat-label>
            <input matInput type="time" formControlName="horaSalida">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Lugar</mat-label>
          <input matInput formControlName="lugar" placeholder="Ej: Salón principal">
          <mat-icon matPrefix>location_on</mat-icon>
          @if(form.get('lugar')?.invalid && form.get('lugar')?.touched){<mat-error>Requerido</mat-error>}
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white" (click)="guardar()" [disabled]="guardando">
        @if(guardando){<mat-spinner diameter="18" color="accent"></mat-spinner>}@else{Guardar Actividad}
      </button>
    </div>
  `
})
export class ActividadDialogComponent {
  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<ActividadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      modo: 'crear' | 'editar';
      actividad?: ActividadResponse;
      empresas: EmpresaExternaResponse[];
    },
    private actividadService: ActividadService,
    private toast: ToastService
  ) {
    const a = data.actividad;
    this.form = this.fb.group({
      nombre:      [a?.nombre ?? '',      Validators.required],
      descripcion: [a?.descripcion ?? ''],
      fechaDesde:  [a?.fechaDesde ?? '',  Validators.required],
      fechaHasta:  [a?.fechaHasta ?? ''],
      horaInicio:  [a?.horaInicio ?? '',  Validators.required],
      horaSalida:  [a?.horaSalida ?? ''],
      lugar:       [a?.lugar ?? '',       Validators.required],
    });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const payload: ActividadRequest = this.form.value;
    const op = this.data.modo === 'crear'
      ? this.actividadService.crear(payload)
      : this.actividadService.actualizar(this.data.actividad!.id, payload);
    op.subscribe({
      next: (r) => { this.guardando = false; this.ref.close(r); },
      error: (err) => { this.guardando = false; this.toast.error(err.error?.error ?? 'Error al guardar actividad'); }
    });
  }
}

// ─── Dialog Detalle (participantes + permisos) ───────────────────────────────
@Component({
  selector: 'app-actividad-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatTabsModule, MatChipsModule
  ],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.actividad.nombre }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:24px;min-width:520px;max-height:70vh">
      <mat-tab-group>
        <!-- Participantes -->
        <mat-tab label="Participantes ({{ data.actividad.ninios?.length ?? 0 }})">
          <div style="padding:16px 0">
            @if(!data.actividad.ninios?.length){
              <div class="empty-tab"><mat-icon>group</mat-icon><p>Sin participantes asignados</p></div>
            } @else {
              <div class="participantes-list">
                @for(p of data.actividad.ninios; track p.id){
                  <div class="participante-row">
                    <div class="avatar-sm">{{ p.nombre[0].toUpperCase() }}</div>
                    <div>
                      <div class="part-nombre">{{ p.nombre }} {{ p.apellido }}</div>
                      @if(p.grupoNombre){<div class="part-grupo">{{ p.grupoNombre }}</div>}
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>

        <!-- Permisos -->
        @if(data.actividad.permisos?.length){
          <mat-tab label="Permisos ({{ data.actividad.permisos?.length ?? 0 }})">
            <div style="padding:16px 0">
              <div class="permisos-list">
                @for(p of data.actividad.permisos; track p.id){
                  <div class="permiso-row">
                    <div class="avatar-sm">{{ p.ninioNombre ? p.ninioNombre[0].toUpperCase() : '?' }}</div>
                    <div style="flex:1">
                      <div class="part-nombre">{{ p.ninioNombre ?? '—' }}</div>
                      @if(p.observaciones){<div class="part-grupo">{{ p.observaciones }}</div>}
                    </div>
                    <span class="badge" [class.badge-success]="p.autorizado" [class.badge-danger]="!p.autorizado">
                      {{ p.autorizado ? 'Autorizado' : 'No autorizado' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </mat-tab>
        }

        <!-- Info general -->
        <mat-tab label="Detalle">
          <div style="padding:16px 0;display:flex;flex-direction:column;gap:12px">
            @if(data.actividad.descripcion){
              <div class="info-row"><mat-icon>notes</mat-icon><span>{{ data.actividad.descripcion }}</span></div>
            }
            @if(data.actividad.lugar){
              <div class="info-row"><mat-icon>location_on</mat-icon><span>{{ data.actividad.lugar }}</span></div>
            }
            <div class="info-row">
              <mat-icon>event</mat-icon>
              <span>{{ data.actividad.fechaDesde }}{{ data.actividad.fechaHasta ? ' → ' + data.actividad.fechaHasta : '' }}</span>
            </div>
            <div class="info-row">
              <mat-icon>access_time</mat-icon>
              <span>{{ data.actividad.horaInicio }}{{ data.actividad.horaSalida ? ' — ' + data.actividad.horaSalida : '' }}</span>
            </div>
            @if(data.actividad.empresasExternas?.length){
              @for(e of data.actividad.empresasExternas; track e.id){
                <div class="info-row"><mat-icon>business</mat-icon><span>{{ e.nombre }}</span></div>
              }
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cerrar</button>
    </div>
  `,
  styles: [`
    .empty-tab { display:flex;flex-direction:column;align-items:center;padding:32px;color:#9AA0B9;gap:8px }
    .empty-tab mat-icon { font-size:40px;width:40px;height:40px }
    .participantes-list, .permisos-list { display:flex;flex-direction:column;gap:8px }
    .participante-row, .permiso-row { display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid #F0F1F5 }
    .avatar-sm { width:36px;height:36px;border-radius:50%;background:#1565C0;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0 }
    .part-nombre { font-weight:600;font-size:14px }
    .part-grupo { font-size:12px;color:#5C6680 }
    .info-row { display:flex;align-items:flex-start;gap:10px;font-size:14px;color:#374151 }
    .info-row mat-icon { color:#1565C0;font-size:18px;width:18px;height:18px;margin-top:2px }
  `]
})
export class ActividadDetalleDialogComponent {
  constructor(
    public ref: MatDialogRef<ActividadDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { actividad: ActividadResponse }
  ) {}
}

// ─── Componente principal ────────────────────────────────────────────────────
@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
    MatChipsModule, MatPaginatorModule
  ],
  templateUrl: './actividades.html',
  styleUrl: './actividades.css'
})
export class ActividadesComponent implements OnInit {
  actividades: ActividadResponse[] = [];
  filtrados: ActividadResponse[] = [];
  pagina: ActividadResponse[] = [];
  empresas: EmpresaExternaResponse[] = [];
  cargando = true;
  busqueda = '';
  filtroActivo: boolean | 'todos' = 'todos';
  columnas = ['nombre', 'fecha', 'hora', 'lugar', 'empresa', 'participantes', 'acciones'];
  pageSize = 10;
  pageIndex = 0;

  constructor(
    private actividadService: ActividadService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.actividadService.listarEmpresas().subscribe(e => this.empresas = e);
    this.cargarActividades();
  }

  cargarActividades() {
    this.cargando = true;
    this.actividadService.listarTodas().pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (a) => { this.actividades = a; this.aplicarFiltros(); },
      error: () => this.toast.error('Error al cargar actividades')
    });
  }

  aplicarFiltros() {
    let res = [...this.actividades];
    if (this.busqueda) {
      const b = this.busqueda.toLowerCase();
      res = res.filter(a =>
        a.nombre.toLowerCase().includes(b) ||
        a.lugar?.toLowerCase().includes(b) ||
        a.empresasExternas?.some(e => e.nombre.toLowerCase().includes(b))
      );
    }
    if (this.filtroActivo !== 'todos') {
      res = res.filter(a => a.activo === this.filtroActivo);
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

  abrirCrear() {
    const ref = this.dialog.open(ActividadDialogComponent, {
      data: { modo: 'crear', empresas: this.empresas }
    });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Actividad creada'); this.cargarActividades(); } });
  }

  abrirEditar(a: ActividadResponse) {
    const ref = this.dialog.open(ActividadDialogComponent, {
      data: { modo: 'editar', actividad: a, empresas: this.empresas }
    });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Actividad actualizada'); this.cargarActividades(); } });
  }

  verDetalle(a: ActividadResponse) {
    this.actividadService.obtenerPorId(a.id).subscribe({
      next: (detalle) => this.dialog.open(ActividadDetalleDialogComponent, { data: { actividad: detalle } }),
      error: () => this.dialog.open(ActividadDetalleDialogComponent, { data: { actividad: a } })
    });
  }

  darDeBaja(a: ActividadResponse) {
    this.actividadService.darDeBaja(a.id).subscribe({
      next: () => { this.toast.success('Actividad dada de baja'); this.cargarActividades(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al dar de baja')
    });
  }

  get totalActivas() { return this.actividades.filter(a => a.activo).length; }
  get totalInactivas() { return this.actividades.filter(a => !a.activo).length; }
}