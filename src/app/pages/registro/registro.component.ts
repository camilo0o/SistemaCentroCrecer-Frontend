import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormArray,
  Validators, AbstractControl
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { ToastService } from '../../services/toast.service';
import {
  InscripcionService,
  NinioSolicitudRequest
} from '../../services/inscripcion.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule, MatDividerModule,
    MatCheckboxModule, MatTooltipModule, MatStepperModule
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  paso = 1; // 1 = datos responsable, 2 = datos niños
  cargando = false;
  exito = false;
  mostrarPass = false;

  responsableForm: FormGroup;
  niniosForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toast: ToastService,
    private inscripcionService: InscripcionService,
    private cdr: ChangeDetectorRef
  ) {
    this.responsableForm = this.fb.group({
      nombre:          ['', [Validators.required, Validators.minLength(2)]],
      apellido:        ['', [Validators.required, Validators.minLength(2)]],
      cedula:          ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      email:           ['', [Validators.required, Validators.email]],
      telefono:        [''],
      fechaNacimiento: [''],
      contrasenia:     ['', [Validators.required, Validators.minLength(10)]],
    });

    this.niniosForm = this.fb.group({
      ninos: this.fb.array([this.crearNinioGroup()])
    });
  }

  // ─── Paso 1 ───────────────────────────────────────────────────────────────

  avanzarPaso1() {
    if (this.responsableForm.invalid) {
      this.responsableForm.markAllAsTouched();
      return;
    }
    this.paso = 2;
  }

  // ─── Paso 2: FormArray de niños ───────────────────────────────────────────

  get ninosArray(): FormArray {
    return this.niniosForm.get('ninos') as FormArray;
  }

  crearNinioGroup(): FormGroup {
    return this.fb.group({
      nombre:          ['', [Validators.required, Validators.minLength(2)]],
      apellido:        ['', [Validators.required, Validators.minLength(2)]],
      cedula:          ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      sexo:            ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      direccion:       [''],
      observaciones:   [''],
      condiciones:     this.fb.array([])
    });
  }

  agregarNino() {
    this.ninosArray.push(this.crearNinioGroup());
  }

  eliminarNino(i: number) {
    if (this.ninosArray.length > 1) this.ninosArray.removeAt(i);
  }

  // ─── Condiciones médicas por niño ─────────────────────────────────────────

  condicionesArray(ninioIndex: number): FormArray {
    return this.ninosArray.at(ninioIndex).get('condiciones') as FormArray;
  }

  crearCondicionGroup(): FormGroup {
    return this.fb.group({
      condicion:   ['', Validators.required],
      observacion: [''],
      esCronica:   [false]
    });
  }

  agregarCondicion(ninioIndex: number) {
    this.condicionesArray(ninioIndex).push(this.crearCondicionGroup());
  }

  eliminarCondicion(ninioIndex: number, condIndex: number) {
    this.condicionesArray(ninioIndex).removeAt(condIndex);
  }

  // ─── Envío final ──────────────────────────────────────────────────────────

  registrar() {
    if (this.niniosForm.invalid) {
      this.niniosForm.markAllAsTouched();
      return;
    }
    this.cargando = true;

    const resp = { ...this.responsableForm.value };
    if (resp.fechaNacimiento) {
      resp.fechaNacimiento = this.formatDate(resp.fechaNacimiento);
    }

    const ninos: NinioSolicitudRequest[] = this.ninosArray.controls.map(ctrl => {
      const v = ctrl.value;
      return {
        cedula:           v.cedula,
        nombre:           v.nombre,
        apellido:         v.apellido,
        sexo:             v.sexo,
        fechaNacimiento:  this.formatDate(v.fechaNacimiento),
        direccion:        v.direccion || undefined,
        observaciones:    v.observaciones || undefined,
        condicionesMedicas: v.condiciones.length
          ? v.condiciones.map((c: any) => ({
              condicion:   c.condicion,
              observacion: c.observacion || undefined,
              esCronica:   c.esCronica
            }))
          : undefined
      };
    });

    this.inscripcionService.registrarResponsableConNinos({ ...resp, ninos }).subscribe({
      next: () => {
        this.cargando = false;
        this.exito = true;
        this.cdr.detectChanges();
        this.toast.success('¡Solicitud enviada! Un funcionario revisará la inscripción.');
      },
      error: (err) => {
        this.cargando = false;
        this.toast.error(err.error?.error || 'Error al enviar la solicitud. Intentá de nuevo.');
      }
    });
  }

  irLogin() { this.router.navigate(['/iniciarSesion']); }

  private formatDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    return d.toISOString().split('T')[0];
  }

  // ─── Helpers de errores ───────────────────────────────────────────────────

  getError(ctrl: AbstractControl | null, field: string): string {
    if (!ctrl) return '';
    const c = ctrl.get(field);
    if (!c?.touched || !c.invalid) return '';
    if (c.hasError('required'))  return 'Campo requerido';
    if (c.hasError('minlength')) return `Mínimo ${c.errors?.['minlength']?.requiredLength} caracteres`;
    if (c.hasError('email'))     return 'Email inválido';
    if (c.hasError('pattern'))   return 'Solo números';
    return 'Campo inválido';
  }

  respError(field: string) { return this.getError(this.responsableForm, field); }
}