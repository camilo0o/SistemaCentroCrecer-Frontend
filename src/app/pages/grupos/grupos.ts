import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { GrupoService } from '../../services/grupo.service';
import { NinioService } from '../../services/ninio.service';
import { ToastService } from '../../services/toast.service';
import { GrupoResponse, GrupoRequest, NinioResponse } from '../../models/models';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-grupo-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dlg-header">
      <h2 class="dlg-title">{{ data.modo === 'crear' ? 'Nuevo Grupo' : 'Editar Grupo' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:24px;min-width:460px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:16px">

        <mat-form-field appearance="outline">
          <mat-label>Nombre del grupo</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Sala Azul">
          @if(form.get('nombre')?.invalid && form.get('nombre')?.touched){
            <mat-error>Requerido (2–100 caracteres)</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rango de edad</mat-label>
          <mat-select formControlName="rangoEdad">
            @for(r of rangos; track r.valor){
              <mat-option [value]="r.valor">{{ r.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Hora inicio</mat-label>
            <input matInput formControlName="horaInicio" type="time">
            @if(form.get('horaInicio')?.invalid && form.get('horaInicio')?.touched){
              <mat-error>Requerido</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Hora fin</mat-label>
            <input matInput formControlName="horaFin" type="time">
            @if(form.get('horaFin')?.invalid && form.get('horaFin')?.touched){
              <mat-error>Requerido</mat-error>
            }
          </mat-form-field>
        </div>

      </form>
    </mat-dialog-content>

    <div style="display:flex;justify-content:flex-end;gap:12px;padding:16px 24px">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white"
              (click)="guardar()" [disabled]="guardando">
        @if(guardando){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
        @else { {{ data.modo === 'crear' ? 'Crear Grupo' : 'Guardar Cambios' }} }
      </button>
    </div>
  `
})
export class GrupoDialogComponent {
  form: FormGroup;
  guardando = false;

  rangos = [
    { valor: '0-1',  label: '0 a 1 año' },
    { valor: '1-2',  label: '1 a 2 años' },
    { valor: '2-3',  label: '2 a 3 años' },
    { valor: '3-4',  label: '3 a 4 años' },
    { valor: '4-5',  label: '4 a 5 años' },
    { valor: '5-12', label: '5 a 12 años' },
  ];

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<GrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modo: 'crear' | 'editar'; grupo?: GrupoResponse },
    private grupoService: GrupoService,
    private toast: ToastService
  ) {
    const g = data.grupo;
    this.form = this.fb.group({
      nombre:     [g?.nombre ?? '',        [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      rangoEdad:  [g?.rangoEdad ?? ''],
      horaInicio: [g?.horaInicio ?? '07:00', Validators.required],
      horaFin:    [g?.horaFin   ?? '19:00', Validators.required],
    });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const payload: GrupoRequest = this.form.value;

    const op$ = this.data.modo === 'crear'
      ? this.grupoService.crear(payload)
      : this.grupoService.actualizar(this.data.grupo!.id, payload);

    op$.subscribe({
      next: (g) => { this.guardando = false; this.ref.close(g); },
      error: (err) => {
        this.guardando = false;
        this.toast.error(err.error?.error ?? 'Error al guardar grupo');
      }
    });
  }
}

@Component({
  selector: 'app-agregar-ninio-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dlg-header">
      <h2 class="dlg-title">Agregar Niño al Grupo</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:24px;min-width:500px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:14px">

        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre">
            @if(form.get('nombre')?.invalid && form.get('nombre')?.touched){<mat-error>Requerido</mat-error>}
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="apellido">
            @if(form.get('apellido')?.invalid && form.get('apellido')?.touched){<mat-error>Requerido</mat-error>}
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Cédula</mat-label>
          <input matInput formControlName="cedula" placeholder="Solo números, máx. 8 dígitos">
          @if(form.get('cedula')?.invalid && form.get('cedula')?.touched){<mat-error>Cédula inválida</mat-error>}
        </mat-form-field>

        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Fecha de Nacimiento</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fechaNacimiento">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if(form.get('fechaNacimiento')?.invalid && form.get('fechaNacimiento')?.touched){<mat-error>Requerida</mat-error>}
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Sexo</mat-label>
            <mat-select formControlName="sexo">
              <mat-option value="MASCULINO">Masculino</mat-option>
              <mat-option value="FEMENINO">Femenino</mat-option>
            </mat-select>
            @if(form.get('sexo')?.invalid && form.get('sexo')?.touched){<mat-error>Requerido</mat-error>}
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="2"></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <div style="display:flex;justify-content:flex-end;gap:12px;padding:16px 24px">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#2E7D32;color:white"
              (click)="guardar()" [disabled]="guardando">
        @if(guardando){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
        @else { Agregar Niño }
      </button>
    </div>
  `
})
export class AgregarNinioDialogComponent {
  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<AgregarNinioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { grupo: GrupoResponse },
    private http: HttpClient,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      nombre:         ['', [Validators.required, Validators.minLength(2)]],
      apellido:       ['', [Validators.required, Validators.minLength(2)]],
      cedula:         ['', [Validators.required, Validators.pattern('^[0-9]{1,8}$')]],
      fechaNacimiento:[null, Validators.required],
      sexo:           ['', Validators.required],
      direccion:      [''],
      observaciones:  [''],
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
      nombre: v.nombre,
      apellido: v.apellido,
      cedula: v.cedula,
      fechaNacimiento: fecha,
      sexo: v.sexo,
      direccion: v.direccion || null,
      observaciones: v.observaciones || null,
      activo: true,
      grupo: { id: this.data.grupo.id, nombre: this.data.grupo.nombre }
    };

    this.http.post(`${environment.apiUrl}/ninios`, payload).subscribe({
      next: (n) => { this.guardando = false; this.ref.close(n); },
      error: (err) => {
        this.guardando = false;
        this.toast.error(err.error?.message ?? err.error?.error ?? 'Error al registrar niño');
      }
    });
  }
}

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule, MatExpansionModule,
    MatBadgeModule, MatDividerModule, MatDialogModule,
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './grupos.html',
  styleUrl: './grupos.css'
})
export class GruposComponent implements OnInit {
  grupos: GrupoResponse[] = [];
  cargando = true;
  busqueda = '';

  /** Rangos fijos con ícono y color */
  readonly RANGOS = [
    { valor: '0-1',  label: '0 – 1 año',   icon: 'baby_changing_station', color: '#FF6F00', bg: '#FFF3E0' },
    { valor: '1-2',  label: '1 – 2 años',   icon: 'child_friendly',        color: '#7B1FA2', bg: '#F3E5F5' },
    { valor: '2-3',  label: '2 – 3 años',   icon: 'directions_run',        color: '#00695C', bg: '#E0F2F1' },
    { valor: '3-4',  label: '3 – 4 años',   icon: 'school',                color: '#1565C0', bg: '#E3F2FD' },
    { valor: '4-5',  label: '4 – 5 años',   icon: 'emoji_people',          color: '#E65100', bg: '#FBE9E7' },
    { valor: '5-12', label: '5 – 12 años',  icon: 'menu_book',             color: '#2E7D32', bg: '#E8F5E9' },
  ];

  constructor(
    private grupoService: GrupoService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargarGrupos(); }

  cargarGrupos() {
    this.cargando = true;
    this.grupoService.listarTodos().pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (g) => { this.grupos = g; },
      error: () => { this.toast.error('Error al cargar grupos'); }
    });
  }

  gruposPorRango(rango: string): GrupoResponse[] {
    let list = this.grupos.filter(g => g.activo && g.rangoEdad === rango);
    if (this.busqueda.trim()) {
      const t = this.busqueda.trim().toLowerCase();
      list = list.filter(g => g.nombre.toLowerCase().includes(t));
    }
    return list;
  }

  gruposSinRango(): GrupoResponse[] {
    const rangosValidos = this.RANGOS.map(r => r.valor);
    let list = this.grupos.filter(g => g.activo && !rangosValidos.includes(g.rangoEdad ?? ''));
    if (this.busqueda.trim()) {
      const t = this.busqueda.trim().toLowerCase();
      list = list.filter(g => g.nombre.toLowerCase().includes(t));
    }
    return list;
  }

  get totalNinos(): number {
    return this.grupos.reduce((sum, g) => sum + (g.cantidadNinios ?? g.ninios?.length ?? 0), 0);
  }

  get totalGruposActivos(): number {
    return this.grupos.filter(g => g.activo).length;
  }

  abrirCrear() {
    const ref = this.dialog.open(GrupoDialogComponent, { data: { modo: 'crear' } });
    ref.afterClosed().subscribe(g => {
      if (g) { this.toast.success('Grupo creado'); this.cargarGrupos(); }
    });
  }

  abrirEditar(grupo: GrupoResponse) {
    const ref = this.dialog.open(GrupoDialogComponent, { data: { modo: 'editar', grupo } });
    ref.afterClosed().subscribe(g => {
      if (g) { this.toast.success('Grupo actualizado'); this.cargarGrupos(); }
    });
  }

  abrirAgregarNinio(grupo: GrupoResponse) {
    const ref = this.dialog.open(AgregarNinioDialogComponent, {
      data: { grupo },
      disableClose: false
    });
    ref.afterClosed().subscribe(n => {
      if (n) { this.toast.success('Niño registrado en el grupo'); this.cargarGrupos(); }
    });
  }

  darDeBaja(grupo: GrupoResponse) {
    if (!confirm(`¿Dar de baja el grupo "${grupo.nombre}"?`)) return;
    this.grupoService.darDeBaja(grupo.id).subscribe({
      next: () => { this.toast.success('Grupo dado de baja'); this.cargarGrupos(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error')
    });
  }

  metaRango(rango: string) {
    return this.RANGOS.find(r => r.valor === rango);
  }

  formatHora(h?: string) {
    if (!h) return '—';
    return h.substring(0, 5);
  }

  formatFechaNacimiento(f?: string) {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-UY', { day:'2-digit', month:'2-digit', year:'numeric' });
  }
}