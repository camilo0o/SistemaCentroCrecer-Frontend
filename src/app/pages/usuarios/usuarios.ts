import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { FuncionarioService } from '../../services/funcionario.service';
import { RolService } from '../../services/rol.service';
import { ToastService } from '../../services/toast.service';
import { FuncionarioResponse, FuncionarioRequest, Rol, ROL_DISPLAY } from '../../models/models';
import { finalize } from 'rxjs/operators';

// Dialog Funcionario
@Component({
  selector: 'app-funcionario-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, Sidebar,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDialogTitle, MatDialogContent, MatDialogActions,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.modo === 'crear' ? 'Nuevo Funcionario' : 'Editar Funcionario' }}</h2>

    <mat-dialog-content style="min-width:520px; max-width:580px; padding-top:16px">
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre">
          @if(form.get('nombre')?.invalid && form.get('nombre')?.touched){<mat-error>Requerido</mat-error>}
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Apellido</mat-label>
          <input matInput formControlName="apellido">
          @if(form.get('apellido')?.invalid && form.get('apellido')?.touched){<mat-error>Requerido</mat-error>}
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cédula</mat-label>
          <input matInput formControlName="cedula">
          @if(form.get('cedula')?.invalid && form.get('cedula')?.touched){<mat-error>Requerida</mat-error>}
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" placeholder="+598 99 000 000">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fecha de Nacimiento</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="fechaNacimiento">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
          @if(form.get('email')?.invalid && form.get('email')?.touched){<mat-error>Email inválido</mat-error>}
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="rolId">
            @for(rol of roles; track rol.id){
              <mat-option [value]="rol.id">{{ getRolDisplay(rol.nombre) }}</mat-option>
            }
          </mat-select>
          @if(form.get('rolId')?.invalid && form.get('rolId')?.touched){<mat-error>Seleccioná un rol</mat-error>}
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>{{ data.modo === 'crear' ? 'Contraseña' : 'Nueva contraseña (vacío = sin cambios)' }}</mat-label>
          <input matInput [type]="showPass ? 'text' : 'password'" formControlName="contrasenia">
          <button mat-icon-button matSuffix type="button" (click)="showPass=!showPass">
            <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if(form.get('contrasenia')?.invalid && form.get('contrasenia')?.touched){
            <mat-error>Mínimo 8 caracteres</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="guardando">
        @if(guardando){ <mat-spinner diameter="18"></mat-spinner> }
        @else { {{ data.modo === 'crear' ? 'Crear' : 'Guardar' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px} .full{grid-column:1/-1}`]
})
export class FuncionarioDialogComponent {
  form: FormGroup;
  showPass = false;
  guardando = false;
  roles: Rol[] = [];

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<FuncionarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modo: 'crear'|'editar'; funcionario?: FuncionarioResponse; roles: Rol[] },
    private funcionarioService: FuncionarioService,
    private toast: ToastService
  ) {
    this.roles = data.roles.filter(r => r.nombre !== 'ADMINISTRADOR_SISTEMA');
    const f = data.funcionario;
    this.form = this.fb.group({
      nombre:      [f?.nombre   ?? '', Validators.required],
      apellido:    [f?.apellido ?? '', Validators.required],
      cedula:      [f?.cedula   ?? '', Validators.required],
      email:       [f?.email    ?? '', [Validators.required, Validators.email]],
      telefono:    [f?.telefono ?? ''],
      fechaNacimiento: [f?.fechaNacimiento ? new Date(f.fechaNacimiento) : null],
      rolId:       [f?.rol?.id  ?? null, Validators.required],
      contrasenia: ['', data.modo === 'crear' ? [Validators.required, Validators.minLength(8)] : [Validators.minLength(8)]]
    });
  }

  getRolDisplay(nombre: string) { return ROL_DISPLAY[nombre] ?? nombre; }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const v = this.form.value;
    const payload: FuncionarioRequest = {
      nombre: v.nombre, apellido: v.apellido, cedula: v.cedula,
      email: v.email, telefono: v.telefono, rolId: v.rolId,
      ...(v.fechaNacimiento ? { fechaNacimiento: (v.fechaNacimiento as Date).toISOString().split('T')[0] } : {}),
      ...(v.contrasenia ? { contrasenia: v.contrasenia } : {})
    };
    const op = this.data.modo === 'crear'
      ? this.funcionarioService.crear(payload)
      : this.funcionarioService.actualizar(this.data.funcionario!.id, payload);
    op.subscribe({
      next: (res) => { this.guardando = false; this.ref.close(res); },
      error: (err) => { this.guardando = false; this.toast.error(err.error?.error ?? 'Error al guardar'); }
    });
  }
}

// Dialog Password
@Component({
  selector: 'app-password-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, Sidebar,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogTitle, MatDialogContent, MatDialogActions
  ],
  template: `
    <h2 mat-dialog-title>Cambiar Contraseña</h2>
    <mat-dialog-content style="min-width:380px; padding-top:12px">
      <p style="color:#5C6680;font-size:13px;margin-bottom:16px">
        Funcionario: <strong>{{ data.nombre }}</strong>
      </p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Nueva contraseña</mat-label>
          <input matInput [type]="show ? 'text' : 'password'" formControlName="pass">
          <button mat-icon-button matSuffix type="button" (click)="show=!show">
            <mat-icon>{{ show ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if(form.get('pass')?.invalid && form.get('pass')?.touched){
            <mat-error>Mínimo 8 caracteres</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="cambiar()" [disabled]="guardando">
        @if(guardando){ <mat-spinner diameter="18"></mat-spinner> }@else{ Cambiar }
      </button>
    </mat-dialog-actions>
  `
})
export class PasswordDialogComponent {
  form: FormGroup;
  show = false;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<PasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number; nombre: string },
    private funcionarioService: FuncionarioService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({ pass: ['', [Validators.required, Validators.minLength(8)]] });
  }

  cambiar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    this.funcionarioService.cambiarPassword(this.data.id, this.form.value.pass).subscribe({
      next: () => { this.guardando = false; this.toast.success('Contraseña actualizada'); this.ref.close(true); },
      error: (err) => { this.guardando = false; this.toast.error(err.error?.error ?? 'Error'); }
    });
  }
}

// Main
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDialogModule, MatChipsModule,
    MatTooltipModule, MatProgressSpinnerModule, MatPaginatorModule,
    MatToolbarModule, MatCardModule
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  funcionarios: FuncionarioResponse[] = [];
  filtrados:    FuncionarioResponse[] = [];
  pagina:       FuncionarioResponse[] = [];
  roles:        Rol[] = [];
  cargando = true;
  busqueda     = '';
  filtroRol    = '';
  filtroEstado = 'todos';
  columnas = ['nombre', 'cedula', 'telefono', 'rol', 'estado', 'acciones'];
  pageSize  = 10;
  pageIndex = 0;

  constructor(
    private funcionarioService: FuncionarioService,
    private rolService: RolService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.rolService.listarActivos().subscribe(r => this.roles = r);
    this.cargarFuncionarios();
  }

  cargarFuncionarios() {
    this.cargando = true;
    this.funcionarioService.listarTodos().pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (f) => { this.funcionarios = f; this.aplicarFiltros(); },
      error: () => { this.toast.error('Error al cargar funcionarios'); }
    });
  }

  aplicarFiltros() {
    let res = [...this.funcionarios];
    if (this.busqueda) {
      const b = this.busqueda.toLowerCase();
      res = res.filter(f =>
        f.nombre.toLowerCase().includes(b) || f.apellido.toLowerCase().includes(b) ||
        f.email.toLowerCase().includes(b)  || f.cedula.includes(b)
      );
    }
    if (this.filtroRol)                    res = res.filter(f => f.rol?.nombre === this.filtroRol);
    if (this.filtroEstado === 'activos')    res = res.filter(f => f.activo);
    if (this.filtroEstado === 'inactivos')  res = res.filter(f => !f.activo);
    this.filtrados = res;
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  actualizarPagina() {
    const s = this.pageIndex * this.pageSize;
    this.pagina = this.filtrados.slice(s, s + this.pageSize);
  }

  onPage(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.actualizarPagina(); }

  abrirCrear() {
    this.dialog.open(FuncionarioDialogComponent, { data: { modo: 'crear', roles: this.roles } })
      .afterClosed().subscribe(r => { if (r) { this.toast.success('Funcionario creado'); this.cargarFuncionarios(); } });
  }

  abrirEditar(f: FuncionarioResponse) {
    this.dialog.open(FuncionarioDialogComponent, { data: { modo: 'editar', funcionario: f, roles: this.roles } })
      .afterClosed().subscribe(r => { if (r) { this.toast.success('Funcionario actualizado'); this.cargarFuncionarios(); } });
  }

  abrirPassword(f: FuncionarioResponse) {
    this.dialog.open(PasswordDialogComponent, { data: { id: f.id, nombre: `${f.nombre} ${f.apellido}` } });
  }

  toggleEstado(f: FuncionarioResponse) {
    const op = f.activo ? this.funcionarioService.darDeBaja(f.id) : this.funcionarioService.darDeAlta(f.id);
    op.subscribe({
      next: () => { this.toast.success(f.activo ? 'Dado de baja' : 'Dado de alta'); this.cargarFuncionarios(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error')
    });
  }

  limpiarFiltros() { this.busqueda = ''; this.filtroRol = ''; this.filtroEstado = 'todos'; this.aplicarFiltros(); }
  getRolDisplay(nombre: string) { return ROL_DISPLAY[nombre] ?? nombre; }
  iniciales(f: FuncionarioResponse) { return (f.nombre[0] + f.apellido[0]).toUpperCase(); }

  get totalActivos()   { return this.funcionarios.filter(f => f.activo).length; }
  get totalInactivos() { return this.funcionarios.filter(f => !f.activo).length; }
}