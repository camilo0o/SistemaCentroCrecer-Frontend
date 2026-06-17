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
import { finalize } from 'rxjs/operators';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { NinioService } from '../../services/ninio.service';
import { NinioResponse } from '../../models/models';
import { PermisoResponsableResponse } from '../../models/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ActividadService } from '../../services/actividad.service';
import {
  InscripcionService,
  InscripcionSolicitudResponse,
  NinioSolicitudRequest
} from '../../services/inscripcion.service';

type Vista = 'dashboard' | 'nueva-inscripcion' | 'mis-ninios';

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
    Sidebar, 
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

  misNinios: NinioResponse[] = [];
  cargandoNinios = false;
  ninioEditando: NinioResponse | null = null;
  editForm!: FormGroup;
  guardandoEdicion = false;

  niniosForm!: FormGroup;
  mostrarExito = false;

  permisos: PermisoResponsableResponse[] = [];
  cargandoPermisos = false;

  constructor(
    private auth: AuthService,
    private inscripcionService: InscripcionService,
    private ninioService: NinioService,
    private actividadService: ActividadService,
    private toast: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.nombre        = this.auth.getNombre() ?? '';
    this.responsableId = this.auth.getUserId();
    this.inicializarFormulario();
    this.cargarInscripciones();
    this.cargarPermisos();
  }

  cargarInscripciones() {
  if (!this.responsableId) { this.cargando = false; return; }
  this.cargando = true;
  this.inscripcionService.listarPorResponsable(this.responsableId)
    .pipe(finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
    .subscribe({
      next: data => { this.inscripciones = data; },
      error: () => { this.toast.error('No se pudieron cargar las inscripciones.'); }
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

  irAMisNinios() {
    this.vista = 'mis-ninios';
    this.cargarMisNinios();
  }

  volver() { this.vista = 'dashboard'; this.ninioEditando = null; }


  cargarMisNinios() {
    if (!this.responsableId) return;
    this.cargandoNinios = true;
    this.ninioService.misNinios(this.responsableId).subscribe({
      next: data => { this.misNinios = data; this.cargandoNinios = false; },
      error: () => { this.toast.error('No se pudieron cargar los niños.'); this.cargandoNinios = false; }
    });
  }

  abrirEdicion(ninio: NinioResponse) {
    this.ninioEditando = ninio;
    const condiciones = this.fb.array(
      (ninio.condicionesMedicas || []).map(c => this.fb.group({
        condicionId:  [c.condicionId],
        condicion:    [c.condicion,  Validators.required],
        observacion:  [c.observacion || ''],
        esCronica:    [c.esCronica ?? false]
      }))
    );
    this.editForm = this.fb.group({
      direccion:     [ninio.direccion     || ''],
      observaciones: [ninio.observaciones || ''],
      condicionesMedicas: condiciones
    });
  }

  cerrarEdicion() { this.ninioEditando = null; }

  get condicionesEditArray(): FormArray {
    return this.editForm?.get('condicionesMedicas') as FormArray;
  }

  agregarCondicionEdit() {
    this.condicionesEditArray.push(this.fb.group({
      condicionId:  [null],
      condicion:    ['', Validators.required],
      observacion:  [''],
      esCronica:    [false]
    }));
  }

  eliminarCondicionEdit(i: number) {
    this.condicionesEditArray.removeAt(i);
  }

  guardarEdicion() {
    if (!this.editForm || this.editForm.invalid) { this.editForm?.markAllAsTouched(); return; }
    if (!this.ninioEditando || !this.responsableId) return;
    this.guardandoEdicion = true;

    const v = this.editForm.value;
    const dto = {
      direccion:     v.direccion     || undefined,
      observaciones: v.observaciones || undefined,
      condicionesMedicas: (v.condicionesMedicas as any[]).map(c => ({
        condicionId:  c.condicionId || undefined,
        condicion:    c.condicion,
        observacion:  c.observacion || undefined,
        esCronica:    c.esCronica
      }))
    };

    this.ninioService.actualizarPorResponsable(this.ninioEditando.id, this.responsableId, dto).subscribe({
      next: updated => {
        const idx = this.misNinios.findIndex(n => n.id === updated.id);
        if (idx !== -1) this.misNinios[idx] = updated;
        this.ninioEditando = null;
        this.guardandoEdicion = false;
        this.toast.success('Datos del niño actualizados correctamente.');
        this.cdr.detectChanges();
      },
      error: err => {
        this.guardandoEdicion = false;
        this.toast.error(err.error?.message || 'Error al guardar los cambios.');
      }
    });
  }

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

  cargarPermisos() {
    if (!this.responsableId) return;
    this.cargandoPermisos = true;
    this.http.get<PermisoResponsableResponse[]>(
      `${environment.apiUrl}/permisos/responsable/${this.responsableId}`
    ).pipe(finalize(() => { this.cargandoPermisos = false; this.cdr.detectChanges(); }))
    .subscribe({
      next: data => { this.permisos = data; },
      error: () => {}
    });
  }

  autorizarPermiso(id: number) {
    this.actividadService.autorizarPermiso(id).subscribe({
      next: () => { this.toast.success('Permiso autorizado.'); this.cargarPermisos(); },
      error: (err) => {
        this.toast.error(err.error?.mensaje || 'Error al autorizar.');
        this.cargarPermisos();
      }
    });
  }

  rechazarPermiso(id: number) {
    this.actividadService.rechazarPermiso(id).subscribe({
      next: () => { this.toast.success('Permiso rechazado.'); this.cargarPermisos(); },
      error: (err) => {
        this.toast.error(err.error?.mensaje || 'Error al rechazar.');
        this.cargarPermisos();
      }
    });
  }


  private soloFecha(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  eventoVencido(actividad?: PermisoResponsableResponse['actividad']): boolean {
    if (!actividad) return false;
    const hoy = this.soloFecha(new Date());
    const fechaRef = actividad.fechaHasta ? new Date(actividad.fechaHasta) : new Date(actividad.fechaDesde);
    return this.soloFecha(fechaRef) < hoy;
  }

  puedeModificarPermiso(p: PermisoResponsableResponse): boolean {
    if (!p.actividad) return true;
    if (this.eventoVencido(p.actividad)) return false;
    if (p.actividad.diasLimiteModificacion == null) return true;

    const hoy = this.soloFecha(new Date());
    const limite = new Date(p.actividad.fechaDesde);
    limite.setDate(limite.getDate() - p.actividad.diasLimiteModificacion);

    return hoy <= this.soloFecha(limite);
  }

  get permisosVigentes(): PermisoResponsableResponse[] {
    return this.permisos.filter(p => !this.eventoVencido(p.actividad));
  }

  get permisosVencidos(): PermisoResponsableResponse[] {
    return this.permisos.filter(p => this.eventoVencido(p.actividad));
  }
}