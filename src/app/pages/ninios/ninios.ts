import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder, FormGroup,
  FormArray, AbstractControl, Validators
} from '@angular/forms';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { NinioService } from '../../services/ninio.service';
import { GrupoService } from '../../services/grupo.service';
import { ToastService } from '../../services/toast.service';
import { CondicionMedicaResponse, GrupoResponse, NinioResponse } from '../../models/models';
import { finalize } from 'rxjs/operators';

// ─── Dialog: Crear Niño (2 pasos) ───────────────────────────────────────────
@Component({
  selector: 'app-ninio-crear-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatStepperModule, MatDividerModule
  ],
  styles: [`
    .dlg-header { display:flex; justify-content:space-between; align-items:center;
                  padding:20px 24px 0; }
    .dlg-title  { font-size:1.15rem; font-weight:700; color:#1a2340; margin:0; }
    .step-label { font-size:.75rem; font-weight:600; color:#9AA0B9;
                  text-transform:uppercase; letter-spacing:.5px; margin-bottom:18px; }
    .condicion-row { border:1px solid #E8EAF0; border-radius:10px;
                     padding:14px 16px; background:#FAFBFF; margin-bottom:12px; position:relative; }
    .condicion-row .remove-btn { position:absolute; top:8px; right:8px; }
    .add-btn { margin-top:4px; }
    .cronica-row { display:flex; align-items:center; gap:8px; margin-top:6px; }
    .cronica-label { font-size:.85rem; color:#5C6680; }
    .badge-cronica { background:#FFF3E0; color:#E65100; border-radius:12px;
                     padding:2px 9px; font-size:11px; font-weight:600; }
    .badge-aguda   { background:#E8F5E9; color:#2E7D32; border-radius:12px;
                     padding:2px 9px; font-size:11px; font-weight:600; }
    .no-condiciones { text-align:center; padding:18px 0; color:#9AA0B9; font-size:.9rem; }
    .step-actions { display:flex; justify-content:space-between; align-items:center;
                    gap:12px; padding:16px 24px; border-top:1px solid #F0F2F7; }
  `],
  template: `
    <div class="dlg-header">
      <h2 class="dlg-title">Registrar Niño</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <!-- Indicador de pasos manual -->
    <div style="display:flex;align-items:center;gap:0;padding:16px 24px 0;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div [style.background]="paso===1?'#1565C0':'#E3F2FD'"
             [style.color]="paso===1?'white':'#1565C0'"
             style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;
                    justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;">1</div>
        <span style="font-size:.85rem;font-weight:600;"
              [style.color]="paso===1?'#1a2340':'#9AA0B9'">Datos del niño</span>
      </div>
      <div style="flex:1;height:2px;background:#E8EAF0;margin:0 10px;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div [style.background]="paso===2?'#1565C0':'#E3F2FD'"
             [style.color]="paso===2?'white':'#1565C0'"
             style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;
                    justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;">2</div>
        <span style="font-size:.85rem;font-weight:600;"
              [style.color]="paso===2?'#1a2340':'#9AA0B9'">Condiciones médicas</span>
      </div>
    </div>

    <!-- PASO 1: Datos del niño -->
    <mat-dialog-content *ngIf="paso===1"
        style="padding:20px 24px;min-width:520px;max-height:65vh;overflow-y:auto">

      <form [formGroup]="formDatos" style="display:flex;flex-direction:column;gap:14px">

        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre">
            @if(formDatos.get('nombre')?.invalid && formDatos.get('nombre')?.touched){
              <mat-error>Requerido (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="apellido">
            @if(formDatos.get('apellido')?.invalid && formDatos.get('apellido')?.touched){
              <mat-error>Requerido (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Cédula</mat-label>
          <input matInput formControlName="cedula" placeholder="Solo números, máx. 8 dígitos">
          @if(formDatos.get('cedula')?.invalid && formDatos.get('cedula')?.touched){
            <mat-error>Cédula inválida (solo números, máx. 8)</mat-error>
          }
        </mat-form-field>

        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Fecha de nacimiento</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fechaNacimiento">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if(formDatos.get('fechaNacimiento')?.invalid && formDatos.get('fechaNacimiento')?.touched){
              <mat-error>Requerida</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Sexo</mat-label>
            <mat-select formControlName="sexo">
              <mat-option value="MASCULINO">Masculino</mat-option>
              <mat-option value="FEMENINO">Femenino</mat-option>
            </mat-select>
            @if(formDatos.get('sexo')?.invalid && formDatos.get('sexo')?.touched){
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
          @if(formDatos.get('grupoId')?.invalid && formDatos.get('grupoId')?.touched){
            <mat-error>Seleccione un grupo</mat-error>
          }
        </mat-form-field>

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

    <!-- PASO 2: Condiciones médicas -->
    <mat-dialog-content *ngIf="paso===2"
        style="padding:20px 24px;min-width:520px;max-height:65vh;overflow-y:auto">

      <p style="color:#5C6680;font-size:.9rem;margin:0 0 16px">
        <mat-icon style="font-size:16px;vertical-align:middle;color:#1565C0">info</mat-icon>
        Podés agregar las condiciones médicas del niño ahora o hacerlo más tarde desde su ficha.
        Este paso es <strong>opcional</strong>.
      </p>

      <form [formGroup]="formCondiciones">
        <div formArrayName="condiciones">

          @if(condicionesArray.length === 0){
            <div class="no-condiciones">
              <mat-icon style="font-size:36px;color:#D0D4E3">medical_services</mat-icon>
              <p>No se cargaron condiciones médicas aún.</p>
            </div>
          }

          @for(ctrl of condicionesArray.controls; track $index){
            <div class="condicion-row" [formGroupName]="$index">
              <button mat-icon-button class="remove-btn" type="button"
                      (click)="eliminarCondicion($index)"
                      matTooltip="Eliminar condición">
                <mat-icon style="color:#C62828;font-size:18px">delete_outline</mat-icon>
              </button>

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px">
                <mat-label>Condición médica</mat-label>
                <input matInput formControlName="condicion"
                       placeholder="Ej: Asma, Alergia a la penicilina...">
                @if(ctrl.get('condicion')?.invalid && ctrl.get('condicion')?.touched){
                  <mat-error>La condición es obligatoria</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px">
                <mat-label>Observaciones</mat-label>
                <textarea matInput formControlName="observacion" rows="2"
                          placeholder="Detalles adicionales, medicación, etc."></textarea>
              </mat-form-field>

              <div class="cronica-row">
                <mat-checkbox formControlName="esCronica" color="primary"></mat-checkbox>
                <span class="cronica-label">¿Es crónica?</span>
                @if(ctrl.get('esCronica')?.value){
                  <span class="badge-cronica">Crónica</span>
                } @else {
                  <span class="badge-aguda">Aguda / Puntual</span>
                }
              </div>
            </div>
          }

        </div>

        <button mat-stroked-button class="add-btn" type="button"
                (click)="agregarCondicion()">
          <mat-icon>add_circle_outline</mat-icon>
          Agregar condición médica
        </button>
      </form>
    </mat-dialog-content>

    <!-- Acciones -->
    <div class="step-actions">
      @if(paso===1){
        <button mat-stroked-button (click)="ref.close()">Cancelar</button>
        <button mat-flat-button style="background:#1565C0;color:white"
                (click)="irPaso2()">
          Siguiente
          <mat-icon>arrow_forward</mat-icon>
        </button>
      }
      @if(paso===2){
        <button mat-stroked-button (click)="paso=1">
          <mat-icon>arrow_back</mat-icon>
          Atrás
        </button>
        <div style="display:flex;gap:10px">
          <button mat-stroked-button (click)="guardar(true)"
                  [disabled]="guardando" matTooltip="Registrar sin condiciones médicas">
            Omitir condiciones
          </button>
          <button mat-flat-button style="background:#1565C0;color:white"
                  (click)="guardar(false)" [disabled]="guardando">
            @if(guardando){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
            @else {
              <mat-icon>save</mat-icon>
              Registrar niño
            }
          </button>
        </div>
      }
    </div>
  `
})
export class NinioCrearDialogComponent implements OnInit {
  paso = 1;
  guardando = false;
  grupos: GrupoResponse[] = [];
  cargandoGrupos = true;

  formDatos: FormGroup;
  formCondiciones: FormGroup;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<NinioCrearDialogComponent>,
    private ninioService: NinioService,
    private grupoService: GrupoService,
    private toast: ToastService
  ) {
    this.formDatos = this.fb.group({
      nombre:          ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cedula:          ['', [Validators.required, Validators.pattern('^[0-9]{1,8}$')]],
      fechaNacimiento: [null, Validators.required],
      sexo:            ['', Validators.required],
      grupoId:         [null, Validators.required],
      direccion:       [''],
      observaciones:   [''],
    });

    this.formCondiciones = this.fb.group({
      condiciones: this.fb.array([])
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

  get condicionesArray(): FormArray {
    return this.formCondiciones.get('condiciones') as FormArray;
  }

  agregarCondicion() {
    this.condicionesArray.push(this.fb.group({
      condicion:   ['', Validators.required],
      observacion: [''],
      esCronica:   [false, Validators.required]
    }));
  }

  eliminarCondicion(index: number) {
    this.condicionesArray.removeAt(index);
  }

  irPaso2() {
    if (this.formDatos.invalid) {
      this.formDatos.markAllAsTouched();
      return;
    }
    this.paso = 2;
  }

  guardar(omitirCondiciones: boolean) {
    // Validar condiciones sólo si no se omiten
    if (!omitirCondiciones && this.condicionesArray.length > 0) {
      if (this.formCondiciones.invalid) {
        this.formCondiciones.markAllAsTouched();
        return;
      }
    }

    this.guardando = true;
    const v = this.formDatos.value;

    const fecha = v.fechaNacimiento instanceof Date
      ? v.fechaNacimiento.toISOString().split('T')[0]
      : v.fechaNacimiento;

    const condiciones = (!omitirCondiciones && this.condicionesArray.length > 0)
      ? this.condicionesArray.controls.map((c: AbstractControl) => ({
          condicion:   c.get('condicion')?.value,
          observacion: c.get('observacion')?.value || null,
          esCronica:   c.get('esCronica')?.value ?? false,
        }))
      : [];

    const payload = {
      nombre:              v.nombre,
      apellido:            v.apellido,
      cedula:              v.cedula,
      fechaNacimiento:     fecha,
      sexo:                v.sexo,
      direccion:           v.direccion || null,
      observaciones:       v.observaciones || null,
      activo:              true,
      grupo:               { id: v.grupoId },
      condicionesMedicas:  condiciones.length > 0 ? condiciones : null,
    };

    this.ninioService.crear(payload).subscribe({
      next: (n) => { this.guardando = false; this.ref.close(n); },
      error: (err) => {
        this.guardando = false;
        this.toast.error(err.error?.message ?? err.error?.error ?? 'Error al guardar');
      }
    });
  }
}

// ─── Dialog: Editar niño (igual que antes, sin paso de condiciones) ──────────
@Component({
  selector: 'app-ninio-editar-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px 0">
      <h2 style="font-size:1.15rem;font-weight:700;color:#1a2340;margin:0">Editar Niño</h2>
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
        @else { Guardar Cambios }
      </button>
    </div>
  `
})
export class NinioEditarDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  grupos: GrupoResponse[] = [];
  cargandoGrupos = true;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<NinioEditarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ninio: NinioResponse },
    private ninioService: NinioService,
    private grupoService: GrupoService,
    private toast: ToastService
  ) {
    const n = data.ninio;
    const fechaInicial = n?.fechaNacimiento ? new Date(n.fechaNacimiento + 'T00:00:00') : null;

    this.form = this.fb.group({
      nombre:          [n?.nombre ?? '',  [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido:        [n?.apellido ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cedula:          [n?.cedula ?? '',  [Validators.required, Validators.pattern('^[0-9]{1,8}$')]],
      fechaNacimiento: [fechaInicial,      Validators.required],
      sexo:            [n?.sexo ?? '',    Validators.required],
      grupoId:         [n?.grupo?.id ?? null, Validators.required],
      direccion:       [n?.direccion ?? ''],
      observaciones:   [n?.observaciones ?? ''],
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
      nombre:          v.nombre,
      apellido:        v.apellido,
      cedula:          v.cedula,
      fechaNacimiento: fecha,
      sexo:            v.sexo,
      direccion:       v.direccion || null,
      observaciones:   v.observaciones || null,
      activo:          true,
      grupo:           { id: v.grupoId }
    };

    this.ninioService.actualizar(this.data.ninio.id, payload).subscribe({
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
    const ref = this.dialog.open(NinioCrearDialogComponent, {
      disableClose: false
    });
    ref.afterClosed().subscribe(n => {
      if (n) { this.toast.success('Niño registrado correctamente'); this.cargarNinios(); }
    });
  }

  abrirEditar(ninio: NinioResponse) {
    const ref = this.dialog.open(NinioEditarDialogComponent, {
      data: { ninio },
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

  /** Devuelve la cantidad de condiciones médicas de un niño */
  cantidadCondiciones(ninio: NinioResponse): number {
    return ninio.condicionesMedicas?.length ?? 0;
  }

  /** Devuelve las condiciones médicas para mostrar en la tarjeta */
  getCondiciones(ninio: NinioResponse): CondicionMedicaResponse[] {
    return ninio.condicionesMedicas ?? [];
  }

  get totalActivos(): number  { return this.ninios.filter(n => n.activo).length; }
  get totalInactivos(): number { return this.ninios.filter(n => !n.activo).length; }
}