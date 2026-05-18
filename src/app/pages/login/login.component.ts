import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule,FormBuilder,Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LoginRequest, LoginResponse } from '../../models/models';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
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
 
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]]
    });
    if (this.authService.isLoggedIn()) this.redirect(this.authService.getRol());
  }
 
  seleccionarTipo(tipo: 'funcionario' | 'responsable') {
    this.tipoUsuario = tipo;
    this.error = '';
  }
 
  togglePassword() { this.mostrarPassword = !this.mostrarPassword; }
 
  iniciarSesion() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.cargando = true;
    this.error = '';
    const datos = this.form.value;
    const peticion = this.tipoUsuario === 'funcionario'
      ? this.authService.loginFuncionario(datos)
      : this.authService.loginResponsable(datos);
    peticion.subscribe({
      next: (res) => {
        this.cargando = false;
        this.toast.success('¡Bienvenido/a, ' + res.nombreCompleto + '!');
        this.redirect(res.rol);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.error || 'Credenciales incorrectas. Intentá de nuevo.';
      }
    });
  }
 
  private redirect(rol: string | null) {
    if (rol === 'ADMINISTRADOR_SISTEMA') this.router.navigate(['/dashboard/admin']);
    else if (rol === 'RESPONSABLE') this.router.navigate(['/dashboard/responsable']);
    else this.router.navigate(['/dashboard/funcionario']);
  }
 
  get emailError() {
    const c = this.form.get('email');
    if (c?.hasError('required')) return 'El email es requerido';
    if (c?.hasError('email')) return 'Ingresá un email válido';
    return '';
  }
 
  get passError() {
    const c = this.form.get('contrasenia');
    if (c?.hasError('required')) return 'La contraseña es requerida';
    if (c?.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }
}
