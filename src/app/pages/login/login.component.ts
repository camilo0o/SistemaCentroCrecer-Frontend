import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  tipoUsuario: 'funcionario' | 'responsable' = 'funcionario';
  correo = '';
  password = '';
  mostrarPassword = false;
  cargando = false;
  error = '';
 
  constructor(private authService: AuthService, private router: Router) {}
 
  seleccionarTipo(tipo: 'funcionario' | 'responsable') {
    this.tipoUsuario = tipo;
    this.error = '';
  }
 
  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }
 
  iniciarSesion() {
    if (!this.correo || !this.password) {
      this.error = 'Por favor completá todos los campos.';
      return;
    }
 
    this.cargando = true;
    this.error = '';
 
    const datos = { correo: this.correo, password: this.password };
 
    const peticion =
      this.tipoUsuario === 'funcionario'
        ? this.authService.loginFuncionario(datos)
        : this.authService.loginResponsable(datos);
 
    peticion.subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.rol === 'FUNCIONARIO') {
          this.router.navigate(['/dashboard/funcionario']);
        } else if (res.rol === 'RESPONSABLE') {
          this.router.navigate(['/dashboard/responsable']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.cargando = false;
        this.error =
          err.error?.error || 'Credenciales incorrectas. Intentá de nuevo.';
      },
    });
  }
}
 
