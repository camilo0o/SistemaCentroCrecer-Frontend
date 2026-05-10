import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  readonly Math = Math;

  tipoUsuario: 'funcionario' | 'responsable' = 'funcionario';
  paso = 1; // 1: tipo, 2: datos, 3: éxito

  // Campos comunes
  cedula = '';
  nombre = '';
  apellido = '';
  email = '';
  telefono = '';
  contrasenia = '';
  confirmarContrasenia = '';
  fechaNacimiento = '';

  // Solo funcionario
  rolId: number | null = null;

  mostrarPassword = false;
  mostrarConfirmar = false;
  cargando = false;
  error = '';

  // Roles disponibles (id real según BD)
  roles = [
    { id: 1, nombre: 'Coordinador' },
    { id: 2, nombre: 'Educador' },
    { id: 3, nombre: 'Auxiliar' },
  ];

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  seleccionarTipo(tipo: 'funcionario' | 'responsable') {
    this.tipoUsuario = tipo;
    this.error = '';
  }

  irAlFormulario() {
    this.paso = 2;
    this.error = '';
  }

  togglePassword() { this.mostrarPassword = !this.mostrarPassword; }
  toggleConfirmar() { this.mostrarConfirmar = !this.mostrarConfirmar; }

  validar(): boolean {
    if (!this.cedula || !this.nombre || !this.apellido || !this.email || !this.contrasenia) {
      this.error = 'Completá todos los campos obligatorios.';
      return false;
    }
    if (!/^[0-9]+$/.test(this.cedula)) {
      this.error = 'La cédula solo debe contener números.';
      return false;
    }
    if (this.cedula.length > 8) {
      this.error = 'La cédula no puede superar 8 dígitos.';
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email)) {
      this.error = 'El correo electrónico no tiene un formato válido.';
      return false;
    }
    if (this.contrasenia.length < 10) {
      this.error = 'La contraseña debe tener al menos 10 caracteres.';
      return false;
    }
    if (this.contrasenia !== this.confirmarContrasenia) {
      this.error = 'Las contraseñas no coinciden.';
      return false;
    }
    if (this.tipoUsuario === 'funcionario' && !this.rolId) {
      this.error = 'Seleccioná un rol para el funcionario.';
      return false;
    }
    return true;
  }

  registrar() {
    this.error = '';
    if (!this.validar()) return;

    this.cargando = true;

    const endpointMap = {
      funcionario: `${this.apiUrl}/funcionarios`,
      responsable: `${this.apiUrl}/responsables`,
    };

    const bodyFuncionario = {
      cedula: this.cedula,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      telefono: this.telefono || undefined,
      contrasenia: this.contrasenia,
      fechaNacimiento: this.fechaNacimiento || undefined,
      rolId: this.rolId,
    };

    const bodyResponsable = {
      cedula: this.cedula,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      telefono: this.telefono || undefined,
      contrasenia: this.contrasenia,
      fecha_nacimiento: this.fechaNacimiento || undefined,
    };

    const body = this.tipoUsuario === 'funcionario' ? bodyFuncionario : bodyResponsable;

    this.http.post(endpointMap[this.tipoUsuario], body).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 3;
      },
      error: (err) => {
        this.cargando = false;
        this.error =
          err.error?.message ||
          err.error?.error ||
          'No se pudo completar el registro. Intentá de nuevo.';
      },
    });
  }

  irALogin() {
    this.router.navigate(['/Iniciar-Sesion']);
  }
}