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
import { GrupoService } from '../../services/grupo.service';
import { DatePipe } from '@angular/common';
import {
  ActividadRequest,
  ActividadResponse,
  EmpresaExternaResponse,
  GrupoResponse,
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
            <input matInput [matDatepicker]="pickerDesde" [min]="hoyDate" formControlName="fechaDesde" placeholder="dd/mm/aaaa" readonly>
            <mat-datepicker-toggle matIconSuffix [for]="pickerDesde"></mat-datepicker-toggle>
            <mat-datepicker #pickerDesde></mat-datepicker>
            @if(form.get('fechaDesde')?.hasError('required') && form.get('fechaDesde')?.touched){<mat-error>Requerida</mat-error>}
            @if(form.get('fechaDesde')?.hasError('matDatepickerMin') && form.get('fechaDesde')?.touched){<mat-error>No puede ser anterior a hoy</mat-error>}
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha fin</mat-label>
            <input matInput [matDatepicker]="pickerHasta" [min]="fechaHastaMin" formControlName="fechaHasta" placeholder="dd/mm/aaaa" readonly>
            <mat-datepicker-toggle matIconSuffix [for]="pickerHasta"></mat-datepicker-toggle>
            <mat-datepicker #pickerHasta></mat-datepicker>
            @if(form.get('fechaHasta')?.hasError('matDatepickerMin') && form.get('fechaHasta')?.touched){<mat-error>Debe ser igual o posterior al inicio</mat-error>}
            @if(form.hasError('fechaHastaAntesDeInicio') && form.get('fechaHasta')?.touched){<mat-error>Debe ser igual o posterior al inicio</mat-error>}
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

        <mat-form-field appearance="outline">
          <mat-label>Días límite para cambiar autorización</mat-label>
          <input matInput type="number" min="0" formControlName="diasLimiteModificacion" placeholder="Ej: 2">
          <mat-icon matPrefix>event_busy</mat-icon>
          <mat-hint>Días antes de la actividad hasta los que se puede cambiar la decisión. Dejar vacío para sin límite.</mat-hint>
          @if(form.get('diasLimiteModificacion')?.invalid && form.get('diasLimiteModificacion')?.touched){
            <mat-error>Debe ser 0 o mayor</mat-error>
          }
        </mat-form-field>

        <div class="participantes-fields">
          <mat-form-field appearance="outline">
            <mat-label>Asignar grupos</mat-label>
            <mat-icon matPrefix>groups</mat-icon>
            <mat-select formControlName="grupoIds" multiple>
              @for(grupo of gruposDisponibles; track grupo.id){
                <mat-option [value]="grupo.id">
                  {{ grupo.nombre }}
                  @if(grupo.rangoEdad){ <span class="option-meta">· {{ grupo.rangoEdad }}</span> }
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Asignar niños</mat-label>
            <mat-icon matPrefix>child_care</mat-icon>
            <mat-select formControlName="ninioIds" multiple>
              @for(ninio of niniosDisponibles; track ninio.id){
                <mat-option [value]="ninio.id">
                  {{ ninio.nombre }} {{ ninio.apellido }}
                  <span class="option-meta">CI {{ ninio.cedula }}@if(ninio.grupoNombre){ · {{ ninio.grupoNombre }} }</span>
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white" (click)="guardar()" [disabled]="guardando">
        @if(guardando){<mat-spinner diameter="18" color="accent"></mat-spinner>}@else{Guardar Actividad}
      </button>
    </div>
  `,
  styles: [`
    .participantes-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .option-meta {
      color: #9CA3AF;
      font-size: 12px;
      margin-left: 4px;
    }
    @media (max-width: 640px) {
      .participantes-fields { grid-template-columns: 1fr; }
    }
  `]
})
export class ActividadDialogComponent {
  form: FormGroup;
  guardando = false;
  hoyDate = this.inicioDelDia(new Date());
  niniosDisponibles: NinioResponse[] = [];
  gruposDisponibles: GrupoResponse[] = [];

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<ActividadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      modo: 'crear' | 'editar';
      actividad?: ActividadResponse;
      empresas: EmpresaExternaResponse[];
    },
    private actividadService: ActividadService,
    private ninioService: NinioService,
    private grupoService: GrupoService,
    private toast: ToastService
  ) {
    const a = data.actividad;
    const ninioIds = a?.ninios?.map(n => n.id) ?? [];
    this.form = this.fb.group({
      nombre:      [a?.nombre ?? '',      Validators.required],
      descripcion: [a?.descripcion ?? ''],
      fechaDesde:  [a?.fechaDesde ? new Date(a.fechaDesde + 'T00:00:00') : null, Validators.required],
      fechaHasta:  [a?.fechaHasta ? new Date(a.fechaHasta + 'T00:00:00') : null],
      horaInicio:  [a?.horaInicio ?? '',  Validators.required],
      horaSalida:  [a?.horaSalida ?? ''],
      lugar:       [a?.lugar ?? '',       Validators.required],
      diasLimiteModificacion: [a?.diasLimiteModificacion ?? null, [Validators.min(0)]],
      ninioIds:    [ninioIds],
      grupoIds:    [[]],
    }, { validators: this.validarRangoFechas.bind(this) });
    this.cargarParticipantes();
    this.form.get('fechaDesde')?.valueChanges.subscribe(() => this.ajustarFechaHasta());
  }

  get fechaHastaMin(): Date {
    const fechaDesde = this.form?.get('fechaDesde')?.value;
    return fechaDesde ? this.inicioDelDia(new Date(fechaDesde)) : this.hoyDate;
  }

  private cargarParticipantes(): void {
    this.ninioService.listarTodos().subscribe({
      next: n => this.niniosDisponibles = n.filter(ninio => ninio.activo !== false),
      error: () => this.toast.error('No se pudieron cargar los niños')
    });
    this.grupoService.listarActivos().subscribe({
      next: g => this.gruposDisponibles = g,
      error: () => this.toast.error('No se pudieron cargar los grupos')
    });
  }

  private ajustarFechaHasta(): void {
    const fechaHastaCtrl = this.form.get('fechaHasta');
    const fechaHasta = fechaHastaCtrl?.value;
    if (!fechaHasta) return;
    if (this.inicioDelDia(new Date(fechaHasta)) < this.fechaHastaMin) {
      fechaHastaCtrl?.setValue(null);
      fechaHastaCtrl?.markAsTouched();
    }
  }

  private validarRangoFechas() {
    const desde = this.form?.get('fechaDesde')?.value;
    const hasta = this.form?.get('fechaHasta')?.value;
    if (!desde || !hasta) return null;
    return this.inicioDelDia(new Date(hasta)) >= this.inicioDelDia(new Date(desde))
      ? null
      : { fechaHastaAntesDeInicio: true };
  }

  private inicioDelDia(fecha: Date): Date {
    const normalizada = new Date(fecha);
    normalizada.setHours(0, 0, 0, 0);
    return normalizada;
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const v = this.form.value;
    const toISO = (d: any) => d instanceof Date ? d.toISOString().split('T')[0] : (d ?? '');
    const payload: ActividadRequest = {
      ...v,
      fechaDesde: toISO(v.fechaDesde),
      fechaHasta: v.fechaHasta ? toISO(v.fechaHasta) : null,
      ninioIds: v.ninioIds ?? [],
      grupoIds: v.grupoIds ?? [],
      diasLimiteModificacion: v.diasLimiteModificacion !== '' && v.diasLimiteModificacion !== null ? Number(v.diasLimiteModificacion) : null,
    };
    const op = this.data.modo === 'crear'
      ? this.actividadService.crear(payload)
      : this.actividadService.actualizar(this.data.actividad!.id, payload);
    op.pipe(finalize(() => this.guardando = false)).subscribe({
      next: (r) => this.ref.close(r),
      error: (err) => this.toast.error(err.error?.error ?? 'Error al guardar actividad')
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
                    <div class="avatar-sm" [class.has-photo]="p.fotoUrl">
                      @if(p.fotoUrl){
                        <img [src]="p.fotoUrl" alt="Foto">
                      } @else {
                        {{ p.nombre[0].toUpperCase() }}
                      }
                    </div>
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
                    <div class="avatar-sm"
                         [class.has-photo]="p.fotoUrl"
                         [style.background]="p.fotoUrl ? 'transparent' : (asistenciasHoy[p.id] ? '#2E7D32' : '#1565C0')">
                      @if(p.fotoUrl){
                        <img [src]="p.fotoUrl" alt="Foto">
                      } @else {
                        {{ p.nombre[0].toUpperCase() }}
                      }
                    </div>
                    <div style="flex:1">
                      <div class="part-nombre">{{ p.nombre }} {{ p.apellido }}</div>
                      @if(p.grupoNombre){<div class="part-grupo">{{ p.grupoNombre }}</div>}
                    </div>
                    @if(asistenciasHoy[p.id]){
                      <span class="badge badge-success">Presente</span>
                    } @else if(tienePermisoAutorizado(p.id)){
                      <button mat-flat-button
                              class="btn-marcar-presente-actividad"
                              style="background:#1565C0;color:white;height:32px;font-size:12px"
                              [disabled]="marcandoAsistencia[p.id]"
                              (click)="marcarAsistencia(p)">
                        @if(marcandoAsistencia[p.id]){
                          <mat-spinner diameter="14" color="accent"></mat-spinner>
                        } @else {
                          <mat-icon style="font-size:16px">check</mat-icon> Marcar presente
                        }
                      </button>
                    } @else {
                      <span class="badge badge-danger" matTooltip="Sin permiso autorizado">Sin permiso</span>
                    }
                  </div>
                }
              </div>
            }
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
    .participantes-list { display:flex;flex-direction:column;gap:8px }
    .participante-row { display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid #F0F1F5 }
    .avatar-sm { width:36px;height:36px;border-radius:50%;background:#1565C0;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;overflow:hidden }
    .avatar-sm img { width:100%;height:100%;object-fit:cover;border-radius:50%;display:block }
    .avatar-sm.has-photo { background:transparent;color:transparent }
    .part-nombre { font-weight:600;font-size:14px }
    .part-grupo { font-size:12px;color:#5C6680 }
    .info-row { display:flex;align-items:flex-start;gap:10px;font-size:14px;color:#374151 }
    .info-row mat-icon { color:#1565C0;font-size:18px;width:18px;height:18px;margin-top:2px }
    .badge { padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700 }
    .badge-success { background:#E8F5E9;color:#2E7D32 }
    .badge-danger  { background:#FFEBEE;color:#C62828 }
    .btn-marcar-presente-actividad { display:inline-flex !important;align-items:center;justify-content:center;gap:4px;padding:0 12px !important }
    .btn-marcar-presente-actividad mat-icon { display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;font-size:16px;line-height:16px;margin:0 }
    ::ng-deep .btn-marcar-presente-actividad .mdc-button__label { display:inline-flex;align-items:center;justify-content:center;gap:4px }
  `]
})
export class ActividadDetalleDialogComponent implements OnInit {
  niniosDisponibles: NinioResponse[] = [];
  ninioSeleccionadoId: number | null = null;
  agregando = false;

  permisos: PermisoResponse[] = [];
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
    this.cargarAsistenciasHoy();
  }

  cargarAsistenciasHoy() {
    const hoy = new Date().toISOString().slice(0, 10);
    const idsParticipantes = (this.data.actividad.ninios ?? []).map(n => n.id);
    if (idsParticipantes.length === 0) return;
    this.asistenciaService.listarAsistenciasPorNinios(idsParticipantes, hoy).subscribe({
      next: (asistencias) => {
        asistencias.forEach(a => {
          if (a.ninioId != null) {
            this.asistenciasHoy[a.ninioId] = true;
          }
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('[asistenciasHoy] error:', err)
    });
  }

  cargarPermisos() {
    this.actividadService.listarPermisosPorActividad(this.data.actividad.id)
      .subscribe({
        next: p => {
          this.permisos = p;
          this.cdr.detectChanges();
        },
        error: () => this.toast.error('No se pudieron cargar los permisos')
      });
  }

  agregarNinio() {
    if (!this.ninioSeleccionadoId) return;
    const idsActuales = (this.data.actividad.ninios ?? []).map(n => n.id);
    const nuevosIds = [...idsActuales, this.ninioSeleccionadoId];
    this.agregando = true;
    this.actividadService.asignarNinios(this.data.actividad.id, nuevosIds)
      .pipe(finalize(() => {
        this.agregando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
      next: (a) => {
        this.data.actividad.ninios = a.ninios;
        this.ninioSeleccionadoId = null;
        this.toast.success('Niño agregado a la actividad');
      },
      error: (err) => {
        this.toast.error(err.error?.error ?? 'Error al agregar niño');
      }
    });
  }

  formatFechaEs(f?: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  tienePermisoAutorizado(ninioId: number): boolean {
    return this.permisos.some(p => p.ninio?.id === ninioId && p.autorizado && p.activo !== false);
  }

  marcarAsistencia(ninio: ParticipanteResponse) {
    if (this.marcandoAsistencia[ninio.id]) return;
    this.marcandoAsistencia[ninio.id] = true;
    this.asistenciaService.marcarAsistenciaNinio({
      ninioId: ninio.id,
      horaEntrada: new Date().toTimeString().slice(0, 5),
      actividadId: this.data.actividad.id
    }).pipe(finalize(() => {
      this.marcandoAsistencia[ninio.id] = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: () => {
        this.asistenciasHoy[ninio.id] = true;
        this.toast.success(`Asistencia de ${ninio.nombre} registrada`);
      },
      error: (err) => {
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
