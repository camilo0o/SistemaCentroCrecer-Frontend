import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NinioService } from '../../services/ninio.service';
import { GrupoService } from '../../services/grupo.service';
import { ToastService } from '../../services/toast.service';
import { NinioResponse, GrupoResponse } from '../../models/models';
import { finalize } from 'rxjs/operators';

// ─── Dialog: Crear / Editar niño ────────────────────────────────────────────
@Component({
  selector: 'app-ninio-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="dlg-header">
      <h2 class="dlg-title">{{ data.modo === 'crear' ? 'Registrar Niño' : 'Editar Niño' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:24px;min-width:520px;max-height:70vh;overflow-y:auto">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:14px">

        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre">
            @if(form.get('nombre')?.invalid && form.get('nombre')?.touched){
              <mat-error>Requerido (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="apellido">
            @if(form.get('apellido')?.invalid && form.get('apellido')?.touched){
              <mat-error>Requerido (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Cédula</mat-label>
          <input matInput formControlName="cedula" placeholder="Solo números, máx. 8 dígitos">
          @if(form.get('cedula')?.invalid && form.get('cedula')?.touched){
            <mat-error>Cédula inválida (solo números, máx. 8)</mat-error>
          }
        </mat-form-field>

        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Fecha de nacimiento</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fechaNacimiento">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if(form.get('fechaNacimiento')?.invalid && form.get('fechaNacimiento')?.touched){
              <mat-error>Requerida</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Sexo</mat-label>
            <mat-select formControlName="sexo">
              <mat-option value="MASCULINO">Masculino</mat-option>
              <mat-option value="FEMENINO">Femenino</mat-option>
            </mat-select>
            @if(form.get('sexo')?.invalid && form.get('sexo')?.touched){
              <mat-error>Requerido</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Grupo</mat-label>
          <mat-select formControlName="grupoId">
            @if(cargandoGrupos){
              <mat-option disabled>Cargando grupos...</mat-option>
            }
            @for(g of grupos; track g.id){
              <mat-option [value]="g.id">
                {{ g.nombre }}
                @if(g.rangoEdad){ <span style="color:#9AA0B9"> · {{ g.rangoEdad }} años</span> }
              </mat-option>
            }
          </mat-select>
          @if(form.get('grupoId')?.invalid && form.get('grupoId')?.touched){
            <mat-error>Seleccione un grupo</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="3"></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <div style="display:flex;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #F0F2F7">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white"
              (click)="guardar()" [disabled]="guardando">
        @if(guardando){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
        @else { {{ data.modo === 'crear' ? 'Registrar' : 'Guardar Cambios' }} }
      </button>
    </div>
  `
})
export class NinioDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  grupos: GrupoResponse[] = [];
  cargandoGrupos = true;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<NinioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modo: 'crear' | 'editar'; ninio?: NinioResponse },
    private ninioService: NinioService,
    private grupoService: GrupoService,
    private toast: ToastService
  ) {
    const n = data.ninio;
    const fechaInicial = n?.fechaNacimiento ? new Date(n.fechaNacimiento + 'T00:00:00') : null;

    this.form = this.fb.group({
      nombre:         [n?.nombre ?? '',   [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido:       [n?.apellido ?? '',  [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cedula:         [n?.cedula ?? '',   [Validators.required, Validators.pattern('^[0-9]{1,8}$')]],
      fechaNacimiento:[fechaInicial,       Validators.required],
      sexo:           [n?.sexo ?? '',     Validators.required],
      grupoId:        [n?.grupo?.id ?? null, Validators.required],
      direccion:      [n?.direccion ?? ''],
      observaciones:  [n?.observaciones ?? ''],
    });
  }

  ngOnInit() {
    this.grupoService.listarActivos().pipe(
      finalize(() => this.cargandoGrupos = false)
    ).subscribe({
      next: (gs) => this.grupos = gs,
      error: () => this.toast.error('Error al cargar grupos')
    });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const v = this.form.value;

    const fecha = v.fechaNacimiento instanceof Date
      ? v.fechaNacimiento.toISOString().split('T')[0]
      : v.fechaNacimiento;

    const payload = {
      nombre:         v.nombre,
      apellido:       v.apellido,
      cedula:         v.cedula,
      fechaNacimiento: fecha,
      sexo:           v.sexo,
      direccion:      v.direccion || null,
      observaciones:  v.observaciones || null,
      activo:         true,
      grupo:          { id: v.grupoId }
    };

    const op$ = this.data.modo === 'crear'
      ? this.ninioService.crear(payload)
      : this.ninioService.actualizar(this.data.ninio!.id, payload);

    op$.subscribe({
      next: (n) => { this.guardando = false; this.ref.close(n); },
      error: (err) => {
        this.guardando = false;
        this.toast.error(err.error?.message ?? err.error?.error ?? 'Error al guardar');
      }
    });
  }
}

// ─── Componente principal ────────────────────────────────────────────────────
@Component({
  selector: 'app-ninios',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatToolbarModule, MatCardModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatButtonModule, MatDialogModule, MatTooltipModule
  ],
  templateUrl: './ninios.html',
  styleUrls: ['./ninios.css']
})
export class NiniosComponent implements OnInit {
  ninios: NinioResponse[] = [];
  filtrados: NinioResponse[] = [];
  cargando = true;
  busqueda = '';

  constructor(
    private ninioService: NinioService,
    private toast: ToastService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargarNinios(); }

  cargarNinios() {
    this.cargando = true;
    this.ninioService.listarTodos().pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (data) => { this.ninios = data; this.aplicarFiltros(); },
      error: () => this.toast.error('Error al cargar los niños')
    });
  }

  aplicarFiltros() {
    const texto = this.busqueda.trim().toLowerCase();
    this.filtrados = this.ninios.filter(n => {
      if (!texto) return true;
      const target = [
        `${n.nombre} ${n.apellido}`,
        n.cedula,
        n.direccion ?? '',
        n.observaciones ?? '',
        n.grupo?.nombre ?? '',
        n.grupo?.rangoEdad ?? ''
      ].join(' ').toLowerCase();
      return target.includes(texto);
    });
  }

  abrirCrear() {
    const ref = this.dialog.open(NinioDialogComponent, {
      data: { modo: 'crear' },
      disableClose: false
    });
    ref.afterClosed().subscribe(n => {
      if (n) { this.toast.success('Niño registrado correctamente'); this.cargarNinios(); }
    });
  }

  abrirEditar(ninio: NinioResponse) {
    const ref = this.dialog.open(NinioDialogComponent, {
      data: { modo: 'editar', ninio },
      disableClose: false
    });
    ref.afterClosed().subscribe(n => {
      if (n) { this.toast.success('Niño actualizado correctamente'); this.cargarNinios(); }
    });
  }

  darDeBaja(ninio: NinioResponse) {
    if (!confirm(`¿Dar de baja a ${ninio.nombre} ${ninio.apellido}?`)) return;
    this.ninioService.darDeBaja(ninio.id).subscribe({
      next: () => { this.toast.success('Niño dado de baja'); this.cargarNinios(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al dar de baja')
    });
  }

  getNombreCompleto(ninio: NinioResponse) {
    return `${ninio.nombre} ${ninio.apellido}`;
  }

  displaySexo(sexo?: string) {
    if (!sexo) return '—';
    const s = sexo.toUpperCase();
    return s === 'MASCULINO' ? 'Masculino' : s === 'FEMENINO' ? 'Femenino' : sexo;
  }

  formatDate(fecha?: string) {
    if (!fecha) return '—';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-UY', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  calcularEdad(fechaNacimiento?: string): string {
    if (!fechaNacimiento) return '—';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento + 'T00:00:00');
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    const meses = hoy.getMonth() - nacimiento.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
      anios--;
    }
    const mesesRestantes = ((hoy.getMonth() - nacimiento.getMonth()) + 12) % 12;
    if (anios === 0) return `${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`;
    if (mesesRestantes === 0) return `${anios} año${anios !== 1 ? 's' : ''}`;
    return `${anios} año${anios !== 1 ? 's' : ''} y ${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`;
  }

  get totalActivos(): number  { return this.ninios.filter(n => n.activo).length; }
  get totalInactivos(): number { return this.ninios.filter(n => !n.activo).length; }
}