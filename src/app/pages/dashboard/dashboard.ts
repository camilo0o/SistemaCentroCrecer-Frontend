import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
    template: `<p>Redirigiendo...</p>`
})
export class DashboardComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}
 
  ngOnInit() {
    const rol = this.authService.getRol();
    if (rol === 'FUNCIONARIO') {
      this.router.navigate(['/dashboard/funcionario']);
    } else if (rol === 'RESPONSABLE') {
      this.router.navigate(['/dashboard/responsable']);
    } else {
      this.authService.logout();
    }
  }

}
