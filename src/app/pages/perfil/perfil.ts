import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { ToastService } from '../../services/toast.service';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { environment } from '../../../environments/environment';
import { throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';


@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule,
    Sidebar
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class PerfilComponent implements OnInit {
  perfilForm!: FormGroup;
  passwordForm!: FormGroup;

  userData: any = null;
  loading = true;
  savingPerfil = false;
  savingPassword = false;
  uploadingPhoto = false;

  activeTab: 'datos' | 'seguridad' = 'datos';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  /** true cuando el admin blanqueó la contraseña y el funcionario debe cambiarla obligatoriamente */
  mustChangePasswordPendiente = false;

  CLOUDINARY_CLOUD_NAME = environment.cloudinaryCloudName;
  CLOUDINARY_UPLOAD_PRESET = environment.cloudinaryUploadPreset;

  get isResponsable(): boolean {
    return this.auth.getRol() === 'RESPONSABLE';
  }

  get userId(): number {
    return this.auth.getUserId() ?? 0;
  }

  get initials(): string {
    const n = this.userData?.nombre ?? '';
    const a = this.userData?.apellido ?? '';
    return ((n[0] ?? '') + (a[0] ?? '')).toUpperCase() || 'U';
  }

  get nombreCompleto(): string {
    return `${this.userData?.nombre ?? ''} ${this.userData?.apellido ?? ''}`.trim();
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private perfilService: PerfilService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initForms();
    this.loadProfile();
    // Si el admin blanqueó la contraseña, forzar la pestaña de seguridad
    if (this.auth.mustChangePassword()) {
      this.mustChangePasswordPendiente = true;
      this.activeTab = 'seguridad';
    }
  }

  private initForms() {
    this.perfilForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      fechaNacimiento: ['']
    });

    this.passwordForm = this.fb.group({
      contraseniaActual: ['', Validators.required],
      nuevaContrasenia: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasenia: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: AbstractControl) {
    const nueva = g.get('nuevaContrasenia')?.value;
    const confirmar = g.get('confirmarContrasenia')?.value;
    return nueva === confirmar ? null : { passwordMismatch: true };
  }

  loadProfile() {
    this.loading = true;
    const req = this.isResponsable
      ? this.perfilService.obtenerResponsable(this.userId)
      : this.perfilService.obtenerFuncionario(this.userId);

    req.pipe(
      finalize(() => { this.loading = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (data) => {
        this.userData = data;
        this.perfilForm.patchValue({
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          telefono: data.telefono ?? '',
          fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento + 'T00:00:00') : null
        });
      },
      error: () => {
        this.toast.error('No se pudo cargar el perfil');
      }
    });
  }

  onSavePerfil() {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.savingPerfil = true;
    const body = {
      ...this.perfilForm.value,
      fotoPerfil: this.userData?.fotoPerfil
    };

    const req = this.isResponsable
      ? this.perfilService.actualizarPerfilResponsable(this.userId, body)
      : this.perfilService.actualizarPerfilFuncionario(this.userId, body);

    req.pipe(
      finalize(() => { this.savingPerfil = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (updated) => {
        this.userData = { ...this.userData, ...updated };
        localStorage.setItem('nombre', `${updated.nombre} ${updated.apellido}`);
        if (updated.fotoPerfil) localStorage.setItem('fotoPerfil', updated.fotoPerfil);
        this.toast.success('Perfil actualizado correctamente');
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Error al actualizar el perfil');
      }
    });
  }

  onSavePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword = true;
    const { contraseniaActual, nuevaContrasenia } = this.passwordForm.value;

    const req = this.isResponsable
      ? this.perfilService.cambiarPasswordResponsable(this.userId, { contraseniaActual, nuevaContrasenia })
      : this.perfilService.cambiarPasswordFuncionario(this.userId, { contraseniaActual, nuevaContrasenia });

    req.pipe(
      catchError(err => throwError(() => ({ error: { message: this.getPasswordErrorMessage(err) } }))),
      finalize(() => { this.savingPassword = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.toast.success('Contraseña actualizada correctamente');
        this.passwordForm.reset();
        // Limpiar el flag de cambio obligatorio en la sesión local
        this.auth.clearMustChangePassword();
        this.mustChangePasswordPendiente = false;
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? err?.error?.error ?? 'Error al cambiar la contraseña');
      }
    });
  }

  private getPasswordErrorMessage(err: any): string {
    const backendMessage = this.extractBackendMessage(err);
    if (err?.status === 400 || err?.status === 401 || err?.status === 403) {
      return backendMessage && !backendMessage.toLowerCase().includes('error al cambiar')
        ? backendMessage
        : 'La contraseña actual es incorrecta';
    }
    if (backendMessage) return backendMessage;
    return 'Error al cambiar la contraseña';
  }

  private extractBackendMessage(err: any): string {
    const body = err?.error;
    if (typeof body === 'string') return body;
    return body?.mensaje ?? body?.message ?? body?.error ?? '';
  }

  async onPhotoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('La imagen no puede superar 5 MB');
      return;
    }

    this.uploadingPhoto = true;

    try {
      const url = await this.uploadToCloudinary(file);
      this.userData = { ...this.userData, fotoPerfil: url };

      const body = {
        nombre: this.userData.nombre,
        apellido: this.userData.apellido,
        email: this.userData.email,
        telefono: this.userData.telefono,
        fechaNacimiento: (() => {
          const fn = this.perfilForm.get('fechaNacimiento')?.value;
          return fn instanceof Date ? fn.toISOString().split('T')[0] : (fn ?? this.userData.fechaNacimiento);
        })(),
        fotoPerfil: url
      };

      const req = this.isResponsable
        ? this.perfilService.actualizarPerfilResponsable(this.userId, body)
        : this.perfilService.actualizarPerfilFuncionario(this.userId, body);

      req.subscribe({
        next: () => {
          localStorage.setItem('fotoPerfil', url);
          window.dispatchEvent(new Event('storage-foto-updated'));
          this.toast.success('Foto de perfil actualizada');
          this.uploadingPhoto = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toast.error('La foto se subió pero no se guardó en el servidor');
          this.uploadingPhoto = false;
          this.cdr.detectChanges();
        }
      });
    } catch {
      this.toast.error('Error al subir la imagen a Cloudinary');
    } finally {
      this.uploadingPhoto = false;
      this.cdr.detectChanges();
    }
  }

  private uploadToCloudinary(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'centro-crecer/perfiles');

      fetch(`https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })
        .then(r => r.json())
        .then(data => {
          if (data.secure_url) resolve(data.secure_url);
          else reject(new Error('Upload failed'));
        })
        .catch(reject);
    });
  }

  triggerPhotoUpload() {
    document.getElementById('photoInput')?.click();
  }

  fieldError(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
