import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <h1>Bienvenido al Dashboard</h1>
    <p>Has iniciado sesión exitosamente</p>
    <button (click)="logout()">Cerrar Sesión</button>
  `,
  styles: []
})
export class DashboardComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/Iniciar-Sesion']);
  }
}
