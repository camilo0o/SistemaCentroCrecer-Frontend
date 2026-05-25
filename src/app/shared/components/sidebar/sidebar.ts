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
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  encapsulation: ViewEncapsulation.None
})
export class Sidebar implements OnInit {
  currentRoute = '';
  rol: string | null = null;
  nombre: string | null = null;
  rolDisplay = '';
  initials = '';
  fotoPerfil: string | null = null;

  adminItems: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard',     route: '/admin/dashboard' },
  { label: 'Usuarios',  icon: 'groups',         route: '/admin/usuarios' },
  { label: 'Turnos',    icon: 'calendar_month', route: '/admin/turnos' },
  { label: 'Reportes',  icon: 'analytics',      route: '/admin/reportes' },
  { label: 'Niños',     icon: 'child_care',      route: '/admin/ninios' },
];

  funcionarioItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard',     route: '/dashboard/funcionario' },
    { label: 'Turnos',    icon: 'calendar_month', route: '/turnos' },
    { label: 'Reportes',  icon: 'analytics',      route: '/reportes' },
  ];

  responsableItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard/responsable' },
  ];

  get navItems(): NavItem[] {
    const rol = this.auth.getRol();
    if (rol === 'ADMINISTRADOR_SISTEMA') return this.adminItems;
    if (rol === 'RESPONSABLE')           return this.responsableItems;
    return this.funcionarioItems;
  }

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.rol     = this.auth.getRol();
    this.nombre  = this.auth.getNombre();
    this.rolDisplay = ROL_DISPLAY[this.rol ?? ''] ?? this.rol ?? '';
    this.initials = this.nombre
      ? this.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';

    // Load photo from localStorage
    this.fotoPerfil = localStorage.getItem('fotoPerfil');

    // Refresh on navigation (in case photo was updated)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentRoute = e.urlAfterRedirects;
      this.nombre = this.auth.getNombre();
      this.fotoPerfil = localStorage.getItem('fotoPerfil');
      this.initials = this.nombre
        ? this.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';
    });

    this.currentRoute = this.router.url;
  }

  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  logout() { this.auth.logout(); }
}