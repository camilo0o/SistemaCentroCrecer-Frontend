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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { ActividadService } from '../../services/actividad.service';
import { ToastService } from '../../services/toast.service';
import { NinioResponse } from '../../models/models';
import { ParticipanteResponse } from '../../models/models';
import { NinioService } from '../../services/ninio.service';
import { AsistenciaService } from '../../services/asistencia.service';
import { DatePipe } from '@angular/common';
import {
  ActividadRequest,
  ActividadResponse,
  EmpresaExternaResponse,
  PermisoResponse
} from '../../models/models';

type Vista = 'tabla' | 'calendario';

@Component({
  selector: 'app-actividad-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule
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
            <input matInput [matDatepicker]="pickerDesde" formControlName="fechaDesde" placeholder="dd/mm/aaaa" readonly>
            <mat-datepicker-toggle matIconSuffix [for]="pickerDesde"></mat-datepicker-toggle>
            <mat-datepicker #pickerDesde></mat-datepicker>
            @if(form.get('fechaDesde')?.invalid && form.get('fechaDesde')?.touched){<mat-error>Requerida</mat-error>}
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha fin</mat-label>
            <input matInput [matDatepicker]="pickerHasta" formControlName="fechaHasta" placeholder="dd/mm/aaaa" readonly>
            <mat-datepicker-toggle matIconSuffix [for]="pickerHasta"></mat-datepicker-toggle>
            <mat-datepicker #pickerHasta></mat-datepicker>
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
      fechaDesde:  [a?.fechaDesde ? new Date(a.fechaDesde + 'T00:00:00') : null, Validators.required],
      fechaHasta:  [a?.fechaHasta ? new Date(a.fechaHasta + 'T00:00:00') : null],
      horaInicio:  [a?.horaInicio ?? '',  Validators.required],
      horaSalida:  [a?.horaSalida ?? ''],
      lugar:       [a?.lugar ?? '',       Validators.required],
    });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const v = this.form.value;
    const toISO = (d: any) => d instanceof Date ? d.toISOString().split('T')[0] : (d ?? '');
    const payload: ActividadRequest = {
      ...v,
      fechaDesde: toISO(v.fechaDesde),
      fechaHasta: v.fechaHasta ? toISO(v.fechaHasta) : '',
    };
    const op = this.data.modo === 'crear'
      ? this.actividadService.crear(payload)
      : this.actividadService.actualizar(this.data.actividad!.id, payload);
    op.subscribe({
      next: (r) => { this.guardando = false; this.ref.close(r); },
      error: (err) => { this.guardando = false; this.toast.error(err.error?.error ?? 'Error al guardar actividad'); }
    });
  }
}

@Component({
  selector: 'app-actividad-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatTabsModule, MatChipsModule,
    FormsModule, MatSelectModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.actividad.nombre }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:24px;min-width:520px;max-height:70vh">
      <mat-tab-group>
        
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
            <!-- Selector para agregar niño -->
            <div style="margin-top:16px;display:flex;gap:8px;align-items:center">
              <mat-select [(ngModel)]="ninioSeleccionadoId" placeholder="Agregar niño"
                          style="flex:1;font-size:13px">
                @for(n of niniosDisponibles; track n.id){
                  <mat-option [value]="n.id">{{ n.nombre }} {{ n.apellido }}</mat-option>
                }
              </mat-select>
              <button mat-flat-button style="background:#1565C0;color:white;height:36px"
                      (click)="agregarNinio()" [disabled]="!ninioSeleccionadoId || agregando">
                @if(agregando){<mat-spinner diameter="16" color="accent"></mat-spinner>}
                @else{<mat-icon>add</mat-icon>}
              </button>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Asistencia">
          <div style="padding:16px 0">
            @if(!data.actividad.ninios?.length){
              <div class="empty-tab">
                <mat-icon>event_busy</mat-icon>
                <p>Sin participantes asignados</p>
              </div>
            } @else {
              <div class="participantes-list">
                @for(p of data.actividad.ninios; track p.id){
                  <div class="participante-row">
                    <div class="avatar-sm" [style.background]="asistenciasHoy[p.id] ? '#2E7D32' : '#1565C0'">
                      {{ p.nombre[0].toUpperCase() }}
                    </div>
                    <div style="flex:1">
                      <div class="part-nombre">{{ p.nombre }} {{ p.apellido }}</div>
                      @if(p.grupoNombre){<div class="part-grupo">{{ p.grupoNombre }}</div>}
                    </div>
                    @if(asistenciasHoy[p.id]){
                      <span class="badge badge-success">Presente</span>
                    } @else {
                      <button mat-flat-button
                              style="background:#1565C0;color:white;height:32px;font-size:12px"
                              [disabled]="marcandoAsistencia[p.id]"
                              (click)="marcarAsistencia(p)">
                        @if(marcandoAsistencia[p.id]){
                          <mat-spinner diameter="14" color="accent"></mat-spinner>
                        } @else {
                          <mat-icon style="font-size:16px">check</mat-icon> Marcar presente
                        }
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>

        <mat-tab label="Permisos ({{ permisos.length }})">
          <div style="padding:16px 0">
            @if(!permisos.length){
              <div class="empty-tab"><mat-icon>lock</mat-icon><p>Sin permisos registrados</p></div>
            } @else {
              <div class="permisos-list">
                @for(p of permisos; track p.id){
                  <div class="permiso-row">
                    <div class=\"avatar-sm\">{{ p.ninio?.nombre ? p.ninio!.nombre[0].toUpperCase() : '?' }}</div>
                    <div style="flex:1">
                      <div class=\"part-nombre\">{{ p.ninio ? (p.ninio.nombre + ' ' + p.ninio.apellido) : '—' }}</div>
                      @if(p.observaciones){<div class="part-grupo">{{ p.observaciones }}</div>}
                    </div>
                    <span class="badge" [class.badge-success]="p.autorizado" [class.badge-danger]="!p.autorizado">
                      {{ p.autorizado ? 'Autorizado' : 'No autorizado' }}
                    </span>
                    @if(!p.autorizado){
                      <button mat-icon-button matTooltip="Autorizar"
                              (click)="autorizarPermiso(p.id)">
                        <mat-icon style="color:#2E7D32">check_circle</mat-icon>
                      </button>
                    }
                  </div>
                }
              </div>
            }
            <div style="margin-top:16px;display:flex;gap:8px;align-items:center">
              <mat-select [(ngModel)]="ninioPermisoId" placeholder="Niño para permiso"
                          style="flex:1;font-size:13px">
                @for(n of data.actividad.ninios ?? []; track n.id){
                  <mat-option [value]="n.id">{{ n.nombre }} {{ n.apellido }}</mat-option>
                }
              </mat-select>
              <button mat-flat-button style="background:#388E3C;color:white;height:36px"
                      (click)="crearPermiso()" [disabled]="!ninioPermisoId || creandoPermiso">
                @if(creandoPermiso){<mat-spinner diameter="16" color="accent"></mat-spinner>}
                @else{ Crear permiso }
              </button>
            </div>
          </div>
        </mat-tab>

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
              <span>{{ formatFechaEs(data.actividad.fechaDesde) }}{{ data.actividad.fechaHasta ? ' → ' + formatFechaEs(data.actividad.fechaHasta) : '' }}</span>
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
    .badge { padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700 }
    .badge-success { background:#E8F5E9;color:#2E7D32 }
    .badge-danger  { background:#FFEBEE;color:#C62828 }
  `]
})
export class ActividadDetalleDialogComponent implements OnInit {
  niniosDisponibles: NinioResponse[] = [];
  ninioSeleccionadoId: number | null = null;
  agregando = false;

  permisos: PermisoResponse[] = [];
  ninioPermisoId: number | null = null;
  creandoPermiso = false;
  marcandoAsistencia: { [ninioId: number]: boolean } = {};
  asistenciasHoy: { [ninioId: number]: boolean } = {}; 

  constructor(
    public ref: MatDialogRef<ActividadDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { actividad: ActividadResponse },
    private actividadService: ActividadService,
    private asistenciaService: AsistenciaService, 
    private ninioService: NinioService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.ninioService.listarTodos().subscribe(n => this.niniosDisponibles = n);
    this.cargarPermisos();
  }

  cargarPermisos() {
    this.actividadService.listarPermisosPorActividad(this.data.actividad.id)
      .subscribe(p => this.permisos = p);
  }

  agregarNinio() {
    if (!this.ninioSeleccionadoId) return;
    const idsActuales = (this.data.actividad.ninios ?? []).map(n => n.id);
    const nuevosIds = [...idsActuales, this.ninioSeleccionadoId];
    this.agregando = true;
    this.actividadService.asignarNinios(this.data.actividad.id, nuevosIds).subscribe({
      next: (a) => {
        this.data.actividad.ninios = a.ninios;
        this.ninioSeleccionadoId = null;
        this.agregando = false;
        this.toast.success('Niño agregado a la actividad');
      },
      error: (err) => {
        this.agregando = false;
        this.toast.error(err.error?.error ?? 'Error al agregar niño');
      }
    });
  }

  crearPermiso() {
    if (!this.ninioPermisoId) return;
    const ninio = this.data.actividad.ninios?.find(n => n.id === this.ninioPermisoId);
    if (!ninio) return;
    this.creandoPermiso = true;
    this.actividadService.registrarPermiso({
      ninioCedula: ninio.cedula,
      actividadId: this.data.actividad.id,
      autorizado: false,
      observaciones: ''
    }).subscribe({
      next: () => {
        this.ninioPermisoId = null;
        this.creandoPermiso = false;
        this.cargarPermisos();
        this.toast.success('Permiso creado');
      },
      error: (err) => {
        this.creandoPermiso = false;
        this.toast.error(err.error?.error ?? 'Error al crear permiso');
      }
    });
  }

  autorizarPermiso(permisoId: number) {
    this.actividadService.autorizarPermiso(permisoId).subscribe({
      next: () => { this.cargarPermisos(); this.toast.success('Permiso autorizado'); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al autorizar')
    });
  }

  formatFechaEs(f?: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  marcarAsistencia(ninio: ParticipanteResponse) {
    if (this.marcandoAsistencia[ninio.id]) return;
    this.marcandoAsistencia[ninio.id] = true;
    this.asistenciaService.marcarAsistenciaNinio({
      ninioId: ninio.id,
      horaEntrada: new Date().toTimeString().slice(0, 5),
      actividadId: this.data.actividad.id
    }).subscribe({
      next: () => {
        this.asistenciasHoy[ninio.id] = true;
        this.marcandoAsistencia[ninio.id] = false;
        this.cdr.detectChanges();
        this.toast.success(`Asistencia de ${ninio.nombre} registrada`);
      },
      error: (err) => {
        this.marcandoAsistencia[ninio.id] = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.mensaje || err.error?.message || 'Error al marcar asistencia');
      }
    });
  }

}

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
    MatChipsModule, MatPaginatorModule,
    DatePipe
  ],
  templateUrl: './actividades.html',
  styleUrl: './actividades.css'
})
export class ActividadesComponent implements OnInit {

  actividades: ActividadResponse[] = [];
  empresas: EmpresaExternaResponse[] = [];
  cargando = true;
  vista: Vista = 'tabla';

  filtrados: ActividadResponse[] = [];
  pagina: ActividadResponse[] = [];
  busqueda = '';
  filtroActivo: boolean | 'todos' = 'todos';
  columnas = ['nombre', 'fecha', 'hora', 'lugar', 'empresa', 'participantes', 'acciones'];
  pageSize = 10;
  pageIndex = 0;

  fechaActual = new Date();
  readonly diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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

  cambiarVista(v: Vista) { this.vista = v; }

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

  limitarPalabras(texto?: string, maxPalabras = 40): string {
    if (!texto) return '';
    const palabras = texto.trim().split(/\s+/);
    return palabras.length > maxPalabras
      ? `${palabras.slice(0, maxPalabras).join(' ')}...`
      : texto;
  }

  get diasDeSemana(): Date[] {
    const lunes = new Date(this.fechaActual);
    const dia = lunes.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;
    lunes.setDate(lunes.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }

  actividadesDelDia(fecha: Date): ActividadResponse[] {
    const iso = this.toISODate(fecha);
    return this.actividades
      .filter(a => {
        if (!a.activo) return false;
        const hasta = a.fechaHasta ?? a.fechaDesde;
        return iso >= a.fechaDesde && iso <= hasta;
      })
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  esMultidia(a: ActividadResponse): boolean {
    return !!a.fechaHasta && a.fechaHasta !== a.fechaDesde;
  }

  anteriorSemana() {
    const d = new Date(this.fechaActual);
    d.setDate(d.getDate() - 7);
    this.fechaActual = d;
  }

  siguienteSemana() {
    const d = new Date(this.fechaActual);
    d.setDate(d.getDate() + 7);
    this.fechaActual = d;
  }

  irHoy() { this.fechaActual = new Date(); }

  formatFecha(f?: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  esHoy(fecha: Date): boolean {
    return fecha.toDateString() === new Date().toDateString();
  }

  toISODate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  get tituloSemana(): string {
    const dias = this.diasDeSemana;
    const lunes   = dias[0].toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
    const domingo = dias[6].toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${lunes} — ${domingo}`;
  }

  get actividadesSemana(): number {
    const isos = new Set(this.diasDeSemana.map(d => this.toISODate(d)));
    return this.actividades.filter(a => {
      if (!a.activo) return false;
      const hasta = a.fechaHasta ?? a.fechaDesde;
      return [...isos].some(iso => iso >= a.fechaDesde && iso <= hasta);
    }).length;
  }

  abrirCrear() {
    const ref = this.dialog.open(ActividadDialogComponent, {
      data: { modo: 'crear', empresas: this.empresas },
      width: '580px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Actividad creada'); this.cargarActividades(); } });
  }

  abrirEditar(a: ActividadResponse) {
    const ref = this.dialog.open(ActividadDialogComponent, {
      data: { modo: 'editar', actividad: a, empresas: this.empresas },
      width: '580px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Actividad actualizada'); this.cargarActividades(); } });
  }

  verDetalle(a: ActividadResponse) {
    this.actividadService.obtenerPorId(a.id).subscribe({
      next: (detalle) => this.dialog.open(ActividadDetalleDialogComponent, {
        data: { actividad: detalle },
        width: '620px',
        maxWidth: '94vw',
        panelClass: 'app-dialog-panel',
        disableClose: true
      }),
      error: () => this.dialog.open(ActividadDetalleDialogComponent, {
        data: { actividad: a },
        width: '620px',
        maxWidth: '94vw',
        panelClass: 'app-dialog-panel',
        disableClose: true
      })
    });
  }

  darDeBaja(a: ActividadResponse) {
    this.actividadService.darDeBaja(a.id).subscribe({
      next: () => { this.toast.success('Actividad dada de baja'); this.cargarActividades(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al dar de baja')
    });
  }

  get totalActivas()   { return this.actividades.filter(a => a.activo).length; }
  get totalInactivas() { return this.actividades.filter(a => !a.activo).length; }
}
