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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { AgendaService } from '../../services/agenda.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import {
  AgendaRequest, AgendaResponse, TipoAgendaResponse,
  DetalleAgendaRequest, DetalleAgendaResponse, SubtipoAgendaResponse
} from '../../models/models';

@Component({
  selector: 'app-agenda-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.modo === 'crear' ? 'Nueva anotación' : 'Editar anotación' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:24px;min-width:460px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:16px">

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="3"
            placeholder="Anotá lo que querés recordar..."></textarea>
          @if(form.get('descripcion')?.invalid && form.get('descripcion')?.touched){
            <mat-error>La descripción es obligatoria</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="tipoId">
            @for(t of data.tipos; track t.id){
              <mat-option [value]="t.id">{{ t.tipo }}</mat-option>
            }
          </mat-select>
          @if(form.get('tipoId')?.invalid && form.get('tipoId')?.touched){
            <mat-error>Seleccioná un tipo</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fecha</mat-label>
          <input matInput [matDatepicker]="pickerFecha" formControlName="fecha" placeholder="dd/mm/aaaa" readonly>
          <mat-datepicker-toggle matIconSuffix [for]="pickerFecha"></mat-datepicker-toggle>
          <mat-datepicker #pickerFecha></mat-datepicker>
          @if(form.get('fecha')?.invalid && form.get('fecha')?.touched){
            <mat-error>La fecha es obligatoria</mat-error>
          }
        </mat-form-field>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <mat-form-field appearance="outline">
            <mat-label>Hora inicio</mat-label>
            <input matInput type="time" formControlName="horaInicio">
            @if(form.get('horaInicio')?.invalid && form.get('horaInicio')?.touched){
              <mat-error>Obligatoria</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hora fin</mat-label>
            <input matInput type="time" formControlName="horaFin">
            @if(form.get('horaFin')?.invalid && form.get('horaFin')?.touched){
              <mat-error>Obligatoria</mat-error>
            }
          </mat-form-field>
        </div>

      </form>
      @if(sugerencias.length > 0){
        <div style="margin-top:16px;padding:12px;background:#E3F2FD;border-radius:8px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1565C0">
            Horarios disponibles sugeridos:
          </p>
          @for(s of sugerencias; track s.horaInicio){
            <button mat-stroked-button style="margin:4px;font-size:12px"
              (click)="aplicarSugerencia(s)">
              {{ s.horaInicio }} — {{ s.horaFin }}
            </button>
          }
        </div>
      }
    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white"
        (click)="guardar()" [disabled]="guardando">
        @if(guardando){<mat-spinner diameter="18" color="accent"></mat-spinner>}
        @else { Guardar }
      </button>
    </div>
  `
})
export class AgendaDialogComponent {
  form: FormGroup;
  guardando = false;
  sugerencias: AgendaResponse[] = [];
  
  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<AgendaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      modo: 'crear' | 'editar';
      agenda?: AgendaResponse;
      tipos: TipoAgendaResponse[];
      funcionarioId: number;
    },
    private agendaService: AgendaService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    const a = data.agenda;
    this.form = this.fb.group({
      descripcion: [a?.descripcion ?? '', Validators.required],
      tipoId:      [a?.tipoId ?? null,    Validators.required],
      fecha:       [a?.fecha ? new Date(a.fecha + 'T00:00:00') : null, Validators.required],
      horaInicio:  [a?.horaInicio ?? '',   Validators.required],
      horaFin:     [a?.horaFin ?? '',      Validators.required],
    });
  }

  guardar() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.guardando = true;
  this.sugerencias = [];
  const v = this.form.value;
  const payload: AgendaRequest = {
    ...v,
    fecha: v.fecha instanceof Date ? v.fecha.toISOString().split('T')[0] : v.fecha,
    funcionarioId: this.data.funcionarioId,
  };
  const op = this.data.modo === 'crear'
    ? this.agendaService.crear(payload)
    : this.agendaService.actualizar(this.data.agenda!.id, payload);

  op.subscribe({
    next: (r) => { this.guardando = false; this.ref.close(r); },
    error: (err) => {
      this.guardando = false;
      const msg = err.error?.mensaje ?? err.error?.error ?? '';
      if (msg.includes('ya tiene un evento')) {
        console.log('Pidiendo sugerencias para:', payload.funcionarioId, payload.fecha, payload.horaInicio, payload.horaFin);
        this.agendaService.sugerirReprogramacion(
          payload.funcionarioId,
          payload.fecha,
          payload.horaInicio,
          payload.horaFin
        ).subscribe({
          next: s => {
            console.log('Sugerencias recibidas:', s);
            this.sugerencias = s;
            this.cdr.detectChanges();
          },
          error: e => console.error('Error en sugerencias:', e)
        });
        this.toast.error('Horario ocupado. Ver sugerencias abajo.');
      } else {
        this.toast.error(msg || 'Error al guardar');
      }
    }
  });
  }

  aplicarSugerencia(s: AgendaResponse) {
    this.form.patchValue({ horaInicio: s.horaInicio, horaFin: s.horaFin });
    this.sugerencias = [];
  }
}

@Component({
  selector: 'app-detalle-agenda-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatCheckboxModule, MatDividerModule
  ],
  styles: [`
    .detalles-list { display:flex; flex-direction:column; gap:12px; margin-bottom:16px; }
    .detalle-item  { border:1px solid #E0E4EC; border-radius:10px; padding:14px 16px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .detalle-item.inactivo { opacity:0.5; }
    .detalle-info  { flex:1; }
    .detalle-desc  { font-size:14px; font-weight:600; color:#1A1A2E; margin:0 0 4px; }
    .detalle-meta  { font-size:12px; color:#5C6680; display:flex; gap:8px; flex-wrap:wrap; }
    .subtipo-badge { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600; background:#EDE7F6; color:#512DA8; }
    .participantes-badge { display:inline-flex; align-items:center; gap:3px; font-size:11px; color:#1565C0; }
    .detalle-actions { display:flex; gap:2px; flex-shrink:0; }
    .empty-detalles { text-align:center; padding:32px; color:#9AA0B9; }
    .empty-detalles mat-icon { font-size:40px; width:40px; height:40px; display:block; margin:0 auto 8px; }
    .form-section { border-top:1px solid #E0E4EC; padding-top:16px; margin-top:4px; }
    .form-section h4 { font-family:'Poppins',sans-serif; font-size:14px; font-weight:700; color:#1A1A2E; margin:0 0 12px; }
  `],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">Detalles de la anotación</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:24px;min-width:520px;max-width:600px">

      <div style="background:#F4F6FB;border-radius:10px;padding:12px 16px;margin-bottom:20px">
        <div style="font-size:13px;font-weight:600;color:#1A1A2E;margin-bottom:4px">{{ data.agenda.descripcion }}</div>
        <div style="font-size:12px;color:#5C6680;display:flex;gap:12px;flex-wrap:wrap">
          <span><mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle">calendar_today</mat-icon> {{ formatFecha(data.agenda.fecha) }}</span>
          <span><mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle">access_time</mat-icon> {{ data.agenda.horaInicio }}{{ data.agenda.horaFin ? ' — ' + data.agenda.horaFin : '' }}</span>
          <span class="subtipo-badge">{{ data.agenda.tipoNombre }}</span>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <span style="font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;color:#1A1A2E">
          Detalles ({{ detalles.length }})
        </span>
        @if(!mostrarForm){
          <button mat-flat-button style="background:#1565C0;color:white;font-size:12px;height:32px"
            (click)="mostrarForm = true">
            <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon> Agregar detalle
          </button>
        }
      </div>

      @if(cargando){
        <div style="text-align:center;padding:32px">
          <mat-spinner diameter="32" style="margin:0 auto"></mat-spinner>
        </div>
      } @else if(detalles.length === 0 && !mostrarForm){
        <div class="empty-detalles">
          <mat-icon>list_alt</mat-icon>
          <p style="margin:0;font-size:14px">No hay detalles registrados</p>
          <button mat-stroked-button style="margin-top:12px" (click)="mostrarForm = true">
            Agregar primer detalle
          </button>
        </div>
      } @else {
        <div class="detalles-list">
          @for(d of detalles; track d.id){
            <div class="detalle-item" [class.inactivo]="!d.activo">
              <div class="detalle-info">
                <p class="detalle-desc">{{ d.descripcionEspecifica }}</p>
                <div class="detalle-meta">
                  <span class="subtipo-badge">{{ d.subtipoNombre }}</span>
                  @if(d.requiereParticipantes){
                    <span class="participantes-badge">
                      <mat-icon style="font-size:12px;width:12px;height:12px">group</mat-icon>
                      Requiere participantes
                    </span>
                  }
                  @if(!d.activo){
                    <span style="color:#C62828;font-size:11px;font-weight:600">● Dado de baja</span>
                  }
                </div>
              </div>
              <div class="detalle-actions">
                @if(d.activo){
                  <button mat-icon-button matTooltip="Editar" (click)="editarDetalle(d)">
                    <mat-icon style="color:#1565C0;font-size:18px">edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Dar de baja" (click)="darDeBajaDetalle(d.id)">
                    <mat-icon style="color:#C62828;font-size:18px">cancel</mat-icon>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      @if(mostrarForm){
        <div class="form-section">
          <h4>{{ detalleEditando ? 'Editar detalle' : 'Nuevo detalle' }}</h4>
          <form [formGroup]="formDetalle" style="display:flex;flex-direction:column;gap:14px">

            <mat-form-field appearance="outline">
              <mat-label>Descripción específica</mat-label>
              <textarea matInput formControlName="descripcionEspecifica" rows="2"
                placeholder="Describí el detalle de esta anotación..."></textarea>
              @if(formDetalle.get('descripcionEspecifica')?.invalid && formDetalle.get('descripcionEspecifica')?.touched){
                <mat-error>La descripción es obligatoria</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Subtipo</mat-label>
              <mat-select formControlName="subtipoAgendaId">
                @for(s of data.subtipos; track s.subtipoId){
                  <mat-option [value]="s.subtipoId">{{ s.subtipo }}</mat-option>
                }
              </mat-select>
              @if(formDetalle.get('subtipoAgendaId')?.invalid && formDetalle.get('subtipoAgendaId')?.touched){
                <mat-error>Seleccioná un subtipo</mat-error>
              }
            </mat-form-field>

            <mat-checkbox formControlName="requiereParticipantes" color="primary">
              Requiere participantes
            </mat-checkbox>

            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button mat-stroked-button type="button" (click)="cancelarForm()">Cancelar</button>
              <button mat-flat-button style="background:#1565C0;color:white"
                type="button" (click)="guardarDetalle()" [disabled]="guardandoDetalle">
                @if(guardandoDetalle){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
                @else { {{ detalleEditando ? 'Actualizar' : 'Guardar' }} }
              </button>
            </div>
          </form>
        </div>
      }
    </mat-dialog-content>

    <div class="dialog-actions">
      <button mat-flat-button style="background:#1565C0;color:white" (click)="ref.close(true)">
        Cerrar
      </button>
    </div>
  `
})
export class DetalleAgendaDialogComponent implements OnInit {
  detalles: DetalleAgendaResponse[] = [];
  cargando = false;
  guardandoDetalle = false;
  mostrarForm = false;
  detalleEditando: DetalleAgendaResponse | null = null;

  formDetalle: FormGroup;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<DetalleAgendaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      agenda: AgendaResponse;
      subtipos: SubtipoAgendaResponse[];
    },
    private agendaService: AgendaService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.formDetalle = this.fb.group({
      descripcionEspecifica: ['', Validators.required],
      subtipoAgendaId:       [null, Validators.required],
      requiereParticipantes: [false],
    });
  }

  ngOnInit() {
    this.cargarDetalles();
  }

  cargarDetalles() {
    this.cargando = true;
    this.agendaService.listarDetallesPorAgenda(this.data.agenda.id).pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (d) => this.detalles = d,
      error: () => this.toast.error('Error al cargar los detalles')
    });
  }

  editarDetalle(d: DetalleAgendaResponse) {
    this.detalleEditando = d;
    this.formDetalle.patchValue({
      descripcionEspecifica: d.descripcionEspecifica,
      subtipoAgendaId:       d.subtipoId,
      requiereParticipantes: d.requiereParticipantes,
    });
    this.mostrarForm = true;
  }

  cancelarForm() {
    this.mostrarForm = false;
    this.detalleEditando = null;
    this.formDetalle.reset({ requiereParticipantes: false });
  }

  guardarDetalle() {
    if (this.formDetalle.invalid) { this.formDetalle.markAllAsTouched(); return; }
    this.guardandoDetalle = true;
    const v = this.formDetalle.value;
    const payload: DetalleAgendaRequest = {
      descripcionEspecifica: v.descripcionEspecifica,
      subtipoAgendaId:       v.subtipoAgendaId,
      requiereParticipantes: v.requiereParticipantes ?? false,
      agendaId:              this.data.agenda.id,
    };

    const op = this.detalleEditando
      ? this.agendaService.actualizarDetalle(this.detalleEditando.id, payload)
      : this.agendaService.crearDetalle(payload);

    op.subscribe({
      next: () => {
        this.guardandoDetalle = false;
        this.toast.success(this.detalleEditando ? 'Detalle actualizado' : 'Detalle agregado');
        this.cancelarForm();
        this.cargarDetalles();
      },
      error: (err) => {
        this.guardandoDetalle = false;
        this.toast.error(err.error?.error ?? 'Error al guardar el detalle');
      }
    });
  }

  darDeBajaDetalle(id: number) {
    this.agendaService.darDeBajaDetalle(id).subscribe({
      next: () => { this.toast.success('Detalle dado de baja'); this.cargarDetalles(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al dar de baja')
    });
  }

  formatFecha(f?: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule, FormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDialogModule, MatTooltipModule,
    MatProgressSpinnerModule, MatChipsModule, MatDatepickerModule, MatNativeDateModule, MatPaginatorModule
  ],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class AgendaComponent implements OnInit {
  anotaciones: AgendaResponse[] = [];
  filtradas: AgendaResponse[]   = [];
  pagina: AgendaResponse[]      = [];
  tipos: TipoAgendaResponse[]   = [];
  subtipos: SubtipoAgendaResponse[] = [];

  cargando     = true;
  busqueda     = '';
  filtroActivo: boolean | 'todos' = 'todos';
  filtroTipo   = 0;

  columnas = ['descripcion', 'tipo', 'fecha', 'hora', 'estado', 'acciones'];
  pageSize  = 10;
  pageIndex = 0;

  funcionarioId = 0;

  constructor(
    private agendaService: AgendaService,
    private authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const uid = this.authService.getUserId();
    this.funcionarioId = uid ?? 0;
    this.agendaService.listarTipos().subscribe(t => this.tipos = t);
    this.agendaService.listarSubtipos().subscribe(s => this.subtipos = s);
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.agendaService.listarPorFuncionario(this.funcionarioId).pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (data) => { this.anotaciones = data; this.aplicarFiltros(); },
      error: () => this.toast.error('Error al cargar la agenda')
    });
  }

  aplicarFiltros() {
    let res = [...this.anotaciones];
    if (this.busqueda) {
      const b = this.busqueda.toLowerCase();
      res = res.filter(a =>
        a.descripcion?.toLowerCase().includes(b) ||
        a.tipoNombre?.toLowerCase().includes(b)
      );
    }
    if (this.filtroActivo !== 'todos') {
      res = res.filter(a => a.activo === this.filtroActivo);
    }
    if (this.filtroTipo) {
      res = res.filter(a => a.tipoId === this.filtroTipo);
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
    const ref = this.dialog.open(AgendaDialogComponent, {
      data: { modo: 'crear', tipos: this.tipos, funcionarioId: this.funcionarioId },
      width: '560px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.toast.success('Anotación creada'); this.cargar(); }
    });
  }

  abrirEditar(a: AgendaResponse) {
    const ref = this.dialog.open(AgendaDialogComponent, {
      data: { modo: 'editar', agenda: a, tipos: this.tipos, funcionarioId: this.funcionarioId },
      width: '560px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.toast.success('Anotación actualizada'); this.cargar(); }
    });
  }

  abrirDetalles(a: AgendaResponse) {
    this.dialog.open(DetalleAgendaDialogComponent, {
      data: { agenda: a, subtipos: this.subtipos },
      width: '600px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true,
      maxHeight: '90vh'
    });
  }

  darDeBaja(a: AgendaResponse) {
    this.agendaService.darDeBaja(a.id).subscribe({
      next: () => { this.toast.success('Anotación dada de baja'); this.cargar(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al dar de baja')
    });
  }

  darDeAlta(a: AgendaResponse) {
    this.agendaService.darDeAlta(a.id).subscribe({
      next: () => { this.toast.success('Anotación reactivada'); this.cargar(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al reactivar')
    });
  }

  get totalActivas()   { return this.anotaciones.filter(a => a.activo).length; }
  get totalInactivas() { return this.anotaciones.filter(a => !a.activo).length; }

  formatFecha(f?: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
