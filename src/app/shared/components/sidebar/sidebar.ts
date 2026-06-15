import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ROL_DISPLAY } from '../../../models/models';
import { environment } from '../../../../environments/environment';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  reporteId?: number;
  reporteTitulo?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule, MatBadgeModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  encapsulation: ViewEncapsulation.None
})
export class Sidebar implements OnInit, OnDestroy {
  currentRoute = '';
  rol: string | null = null;
  nombre: string | null = null;
  rolDisplay = '';
  initials = '';
  fotoPerfil: string | null = null;

  // Notificaciones
  notificaciones: Notificacion[] = [];
  noLeidas = 0;
  panelAbierto = false;
  seleccionadas = new Set<number>();
  private pollSub?: Subscription;

  adminItems: NavItem[] = [
    { label: 'Dashboard',           icon: 'dashboard',        route: '/admin/dashboard' },
    { label: 'Usuarios',            icon: 'groups',            route: '/admin/usuarios' },
    { label: 'Responsables',        icon: 'family_restroom',   route: '/admin/responsables' },
    { label: 'Asistencia Personal', icon: 'badge',             route: '/admin/asistencia-personal' },
  ];

  funcionarioItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'dashboard',        route: '/dashboard/funcionario' },
    { label: 'Grupos y Niños', icon: 'groups',            route: '/funcionario/gruposyninios' },
    { label: 'Responsables',   icon: 'family_restroom',   route: '/funcionario/responsables' },
    { label: 'Turnos',         icon: 'calendar_month',    route: '/funcionario/turnos' },
    { label: 'Reportes',       icon: 'analytics',         route: '/funcionario/reportes' },
    { label: 'Actividades',    icon: 'event',             route: '/funcionario/actividades' },
    { label: 'Agenda',         icon: 'calendar_month',    route: '/funcionario/agenda' },
    { label: 'Asistencia',     icon: 'how_to_reg',        route: '/funcionario/asistencia' },
  ];

  auxiliarLimpiezaItems: NavItem[] = [
    { label: 'Dashboard',        icon: 'dashboard',         route: '/dashboard/funcionario' },
    { label: 'Agenda Limpieza',  icon: 'cleaning_services', route: '/funcionario/agenda-limpieza' },
    { label: 'Asistencia',       icon: 'how_to_reg',        route: '/funcionario/asistencia' },
    { label: 'Turnos',           icon: 'schedule',          route: '/funcionario/turnos' },
  ];

  responsableItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard',   route: '/dashboard/responsable' },
    { label: 'Reportes',  icon: 'description', route: '/responsable/reportes' },
  ];

  get navItems(): NavItem[] {
    const rol = this.auth.getRol();
    if (rol === 'ADMINISTRADOR_SISTEMA') return this.adminItems;
    if (rol === 'RESPONSABLE')           return this.responsableItems;
    if (rol === 'AUXILIAR_LIMPIEZA')     return this.auxiliarLimpiezaItems;
    return this.funcionarioItems;
  }

  get esFuncionario(): boolean {
    const rol = this.auth.getRol();
    return rol !== 'ADMINISTRADOR_SISTEMA' && rol !== 'RESPONSABLE' && rol !== 'AUXILIAR_LIMPIEZA';
  }

  constructor(
    public auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.rol        = this.auth.getRol();
    this.nombre     = this.auth.getNombre();
    this.rolDisplay = ROL_DISPLAY[this.rol ?? ''] ?? this.rol ?? '';
    this.initials   = this.nombre
      ? this.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';

    this.fotoPerfil = localStorage.getItem('fotoPerfil');

    window.addEventListener('storage-foto-updated', () => {
      this.fotoPerfil = localStorage.getItem('fotoPerfil');
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentRoute = e.urlAfterRedirects;
      this.nombre       = this.auth.getNombre();
      this.fotoPerfil   = localStorage.getItem('fotoPerfil');
      this.initials     = this.nombre
        ? this.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';
    });

    this.currentRoute = this.router.url;

    if (this.esFuncionario) {
      this.cargarNotificaciones();
      this.pollSub = interval(30000).subscribe(() => this.cargarNotificaciones());
    }
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  cargarNotificaciones() {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.http.get<Notificacion[]>(`${environment.apiUrl}/notificaciones/funcionario/${userId}`)
      .subscribe({
        next: (data) => {
          this.notificaciones = data;
          this.noLeidas = data.filter(n => !n.leida).length;
          // Limpiar selecciones que ya no existen como no-leídas
          this.seleccionadas.forEach(id => {
            const notif = this.notificaciones.find(n => n.id === id);
            if (!notif || notif.leida) this.seleccionadas.delete(id);
          });
        },
        error: () => {}
      });
  }

  togglePanel() {
    this.panelAbierto = !this.panelAbierto;
    if (this.panelAbierto) {
      this.cargarNotificaciones();
    } else {
      // Al cerrar: aplicar leídas localmente y limpiar selección
      this.seleccionadas.clear();
    }
  }

  cerrarPanel() {
    if (this.panelAbierto) {
      this.seleccionadas.clear();
      this.panelAbierto = false;
    }
  }

  toggleSeleccion(id: number) {
    if (this.seleccionadas.has(id)) {
      this.seleccionadas.delete(id);
    } else {
      this.seleccionadas.add(id);
    }
  }

  marcarSeleccionadas() {
    if (this.seleccionadas.size === 0) return;
    const ids = Array.from(this.seleccionadas);
    const requests = ids.map(id =>
      this.http.put(`${environment.apiUrl}/notificaciones/${id}/leida`, {})
    );
    forkJoin(requests).subscribe({
      next: () => {
        ids.forEach(id => {
          const n = this.notificaciones.find(x => x.id === id);
          if (n) n.leida = true;
        });
        this.seleccionadas.clear();
        this.noLeidas = this.notificaciones.filter(n => !n.leida).length;
      },
      error: () => {}
    });
  }

  marcarTodas() {
    const userId = this.auth.getUserId();
    if (!userId) return;
    this.http.put(`${environment.apiUrl}/notificaciones/funcionario/${userId}/leer-todas`, {})
      .subscribe({
        next: () => {
          this.notificaciones.forEach(n => n.leida = true);
          this.seleccionadas.clear();
          this.noLeidas = 0;
        },
        error: () => {}
      });
  }

  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  logout() { this.auth.logout(); }

  formatFecha(f: string): string {
    if (!f) return '';
    const d = new Date(f);
    const ahora = new Date();
    const diffMs = ahora.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    return d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' });
  }
}