import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormArray,
  Validators, AbstractControl
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import {
  InscripcionService,
  InscripcionSolicitudResponse,
  NinioSolicitudRequest
} from '../../services/inscripcion.service';

type Vista = 'dashboard' | 'nueva-inscripcion';

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: '#F59E0B', icon: 'schedule' },
  ACTIVA:     { label: 'Activa',     color: '#10B981', icon: 'check_circle' },
  FINALIZADA: { label: 'Finalizada', color: '#6366F1', icon: 'flag' },
  CANCELADA:  { label: 'Cancelada',  color: '#EF4444', icon: 'cancel' },
};

@Component({
  selector: 'app-dashboard-responsable',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatToolbarModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatCheckboxModule,
    MatTooltipModule, MatExpansionModule, MatBadgeModule,
    Sidebar
  ],
  templateUrl: './dashboard-responsable.html',
  styleUrl: './dashboard-responsable.css',
})
export class DashboardResponsableComponent implements OnInit {

  vista: Vista = 'dashboard';
  nombre = '';
  responsableId: number | null = null;

  cargando = true;
  cargandoEnvio = false;

  inscripciones: InscripcionSolicitudResponse[] = [];

  niniosForm!: FormGroup;
  mostrarExito = false;

  constructor(
    private auth: AuthService,
    private inscripcionService: InscripcionService,
    private toast: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.nombre        = this.auth.getNombre() ?? '';
    this.responsableId = this.auth.getUserId();
    this.inicializarFormulario();
    this.cargarInscripciones();
  }

  cargarInscripciones() {
    if (!this.responsableId) return;
    this.cargando = true;
    this.inscripcionService.listarPorResponsable(this.responsableId).subscribe({
      next: data => { this.inscripciones = data; this.cargando = false; },
      error: () => { this.toast.error('No se pudieron cargar las inscripciones.'); this.cargando = false; }
    });
  }

  get saludoHora(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get fechaFormateada(): string {
    return new Date().toLocaleDateString('es-UY', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  irANuevaInscripcion() {
    this.mostrarExito = false;
    this.inicializarFormulario();
    this.vista = 'nueva-inscripcion';
  }

  volver() { this.vista = 'dashboard'; }

  estadoConfig(estado: string) {
    return ESTADO_CONFIG[estado] ?? { label: estado, color: '#9CA3AF', icon: 'info' };
  }

  calcularEdad(fechaNac?: string): string {
    if (!fechaNac) return '';
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let años = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) años--;
    if (años === 0) {
      const meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + hoy.getMonth() - nac.getMonth();
      return meses + (meses !== 1 ? ' meses' : ' mes');
    }
    return años + (años !== 1 ? ' años' : ' año');
  }

  get cantidadActivas():   number { return this.inscripciones.filter(i => i.estadoInscripcion === 'ACTIVA').length; }
  get cantidadPendientes():number { return this.inscripciones.filter(i => i.estadoInscripcion === 'PENDIENTE').length; }

  // ─── Formulario ───────────────────────────────────────────────────────────

  inicializarFormulario() {
    this.niniosForm = this.fb.group({ ninos: this.fb.array([this.crearNinioGroup()]) });
  }

  get ninosArray(): FormArray { return this.niniosForm.get('ninos') as FormArray; }

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

  agregarNino() { this.ninosArray.push(this.crearNinioGroup()); }
  eliminarNino(i: number) { if (this.ninosArray.length > 1) this.ninosArray.removeAt(i); }

  condicionesArray(i: number): FormArray { return this.ninosArray.at(i).get('condiciones') as FormArray; }

  crearCondicionGroup(): FormGroup {
    return this.fb.group({ condicion: ['', Validators.required], observacion: [''], esCronica: [false] });
  }

  agregarCondicion(i: number) { this.condicionesArray(i).push(this.crearCondicionGroup()); }
  eliminarCondicion(ni: number, ci: number) { this.condicionesArray(ni).removeAt(ci); }

  enviarSolicitud() {
    if (this.niniosForm.invalid) { this.niniosForm.markAllAsTouched(); return; }
    if (!this.responsableId) return;
    this.cargandoEnvio = true;

    const ninos: NinioSolicitudRequest[] = this.ninosArray.controls.map(ctrl => {
      const v = ctrl.value;
      return {
        cedula:          v.cedula,
        nombre:          v.nombre,
        apellido:        v.apellido,
        sexo:            v.sexo,
        fechaNacimiento: this.formatDate(v.fechaNacimiento),
        direccion:       v.direccion || undefined,
        observaciones:   v.observaciones || undefined,
        condicionesMedicas: v.condiciones.length
          ? v.condiciones.map((c: any) => ({ condicion: c.condicion, observacion: c.observacion || undefined, esCronica: c.esCronica }))
          : undefined
      };
    });

    this.inscripcionService.solicitarNuevosNinos(this.responsableId, ninos).subscribe({
      next: () => {
        this.cargandoEnvio = false;
        this.mostrarExito  = true;
        this.cdr.detectChanges();
        this.cargarInscripciones();
        this.toast.success('¡Solicitud enviada! Un funcionario revisará la inscripción.');
      },
      error: (err) => {
        this.cargandoEnvio = false;
        this.toast.error(err.error?.error || 'Error al enviar la solicitud. Intentá de nuevo.');
      }
    });
  }

  volverAlDashboardDesdeExito() { this.mostrarExito = false; this.vista = 'dashboard'; }

  private formatDate(val: any): string {
    if (!val) return '';
    return new Date(val).toISOString().split('T')[0];
  }

  getError(ctrl: AbstractControl | null, field: string): string {
    if (!ctrl) return '';
    const c = ctrl.get(field);
    if (!c?.touched || !c.invalid) return '';
    if (c.hasError('required'))  return 'Campo requerido';
    if (c.hasError('minlength')) return 'Mínimo ' + c.errors?.['minlength']?.requiredLength + ' caracteres';
    if (c.hasError('pattern'))   return 'Solo números';
    return 'Campo inválido';
  }
}