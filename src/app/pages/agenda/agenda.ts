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
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { AgendaService } from '../../services/agenda.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AgendaRequest, AgendaResponse, TipoAgendaResponse } from '../../models/models';

// ─── Dialog Crear/Editar ─────────────────────────────────────────────────────
@Component({
  selector: 'app-agenda-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule
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
          <input matInput type="date" formControlName="fecha">
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
    private toast: ToastService
  ) {
    const a = data.agenda;
    this.form = this.fb.group({
      descripcion: [a?.descripcion ?? '', Validators.required],
      tipoId:      [a?.tipoId ?? null,    Validators.required],
      fecha:       [a?.fecha ?? '',        Validators.required],
      horaInicio:  [a?.horaInicio ?? '',   Validators.required],
      horaFin:     [a?.horaFin ?? '',      Validators.required],
    });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const payload: AgendaRequest = {
      ...this.form.value,
      funcionarioId: this.data.funcionarioId,
    };
    const op = this.data.modo === 'crear'
      ? this.agendaService.crear(payload)
      : this.agendaService.actualizar(this.data.agenda!.id, payload);
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
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule, FormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDialogModule, MatTooltipModule,
    MatProgressSpinnerModule, MatChipsModule, MatPaginatorModule
  ],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class AgendaComponent implements OnInit {
  anotaciones: AgendaResponse[] = [];
  filtradas: AgendaResponse[]   = [];
  pagina: AgendaResponse[]      = [];
  tipos: TipoAgendaResponse[]   = [];

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
      data: { modo: 'crear', tipos: this.tipos, funcionarioId: this.funcionarioId }
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.toast.success('Anotación creada'); this.cargar(); }
    });
  }

  abrirEditar(a: AgendaResponse) {
    const ref = this.dialog.open(AgendaDialogComponent, {
      data: { modo: 'editar', agenda: a, tipos: this.tipos, funcionarioId: this.funcionarioId }
    });
    ref.afterClosed().subscribe(r => {
      if (r) { this.toast.success('Anotación actualizada'); this.cargar(); }
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
}