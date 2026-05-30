import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  form: FormGroup;
  tipoUsuario: 'funcionario' | 'responsable' = 'funcionario';
  mostrarPassword = false;
  cargando = false;
  error = '';

  stats = [
    { icon: 'admin_panel_settings', num: '12',   label: 'Roles'   },
    { icon: 'groups',               num: '5',    label: 'Grupos'  },
    { icon: 'monitoring',           num: '360°', label: 'Gestión' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      email:      ['', [Validators.required, Validators.email]],
      contrasenia:['', [Validators.required, Validators.minLength(6)]]
    });
    if (this.authService.isLoggedIn()) this.redirect(this.authService.getRol());
  }

  seleccionarTipo(tipo: 'funcionario' | 'responsable') { this.tipoUsuario = tipo; this.error = ''; }
  togglePassword() { this.mostrarPassword = !this.mostrarPassword; }

  iniciarSesion() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.cargando = true;
  this.error = '';

  this.authService.loginFuncionario(this.form.value).subscribe({
    next: (res) => {
      this.cargando = false;
      this.toast.success('¡Bienvenido/a, ' + res.nombreCompleto + '!');
      if (res.mustChangePassword) {
        setTimeout(() => this.router.navigate(['/perfil']), 0);
        return;
      }
      setTimeout(() => this.redirect(res.rol), 0);
    },
    error: () => {
      this.authService.loginResponsable(this.form.value).subscribe({
        next: (res) => {
          this.cargando = false;
          this.toast.success('¡Bienvenido/a, ' + res.nombreCompleto + '!');
          setTimeout(() => this.redirect(res.rol), 0);
        },
        error: () => {
          this.cargando = false;
          this.error = 'Credenciales incorrectas. Intentá de nuevo.';
        }
      });
    }
  });
}

  private redirect(rol: string | null) {
    if (rol === 'ADMINISTRADOR_SISTEMA') this.router.navigate(['/admin/dashboard']);
    else if (rol === 'RESPONSABLE')      this.router.navigate(['/dashboard/responsable']);
    else                                 this.router.navigate(['/dashboard/funcionario']);
  }

  get emailError() {
    const c = this.form.get('email');
    if (c?.hasError('required')) return 'El email es requerido';
    if (c?.hasError('email'))    return 'Ingresá un email válido';
    return '';
  }

  get passError() {
    const c = this.form.get('contrasenia');
    if (c?.hasError('required'))  return 'La contraseña es requerida';
    if (c?.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }
}
