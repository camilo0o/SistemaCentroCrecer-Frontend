import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { ROL_DISPLAY } from '../../../models/models';


interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[]; 
}
 
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  encapsulation: ViewEncapsulation.None
})

export class Sidebar implements OnInit{
  currentRoute = '';
  rol: string | null = null;
  nombre: string | null = null;
  rolDisplay = '';
  initials = '';
 
  adminItems: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard-admin' },
  { label: 'Usuarios', icon: 'groups', route: '/usuarios' },
  { label: 'Turnos', icon: 'calendar_month', route: '/turnos' },
  { label: 'Reportes', icon: 'analytics', route: '/reportes' },
  ];
 
  funcionarioItems: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard-funcionario' },
  { label: 'Turnos', icon: 'calendar_month', route: '/turnos' },
  { label: 'Reportes', icon: 'analytics', route: '/reportes' },
  ];
 
  get navItems(): NavItem[] {
    return this.auth.isAdmin() ? this.adminItems : this.funcionarioItems;
  }
 
  constructor(public auth: AuthService, private router: Router) {}
 
  ngOnInit() {
    this.rol = this.auth.getRol();
    this.nombre = this.auth.getNombre();
    this.rolDisplay = ROL_DISPLAY[this.rol ?? ''] ?? this.rol ?? '';
    this.initials = this.nombre
      ? this.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';
 
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => this.currentRoute = e.urlAfterRedirects);
 
    this.currentRoute = this.router.url;
  }
 
  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }
 
  logout() { this.auth.logout(); }

}
