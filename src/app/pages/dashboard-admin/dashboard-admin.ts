import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { AdminStats } from '../../models/models';
import { finalize } from 'rxjs/operators';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatChipsModule, MatDividerModule,
    MatListModule, MatToolbarModule, MatProgressSpinnerModule
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css'
})
export class DashboardAdminComponent implements OnInit {
  stats: AdminStats | null = null;
  cargando = true;
  nombre = '';
  ahora = new Date();

  statCards: any[] = [];

  roleHierarchy = [
    { icon: 'admin_panel_settings', label: 'Administrador/a del Sistema', color: 'primary', indent: 0 },
    { icon: 'star',                 label: 'Coordinador/a',             color: 'accent',  indent: 1 },
    { icon: 'psychology',           label: 'Equipo Técnico (5 roles)',    color: 'primary', indent: 2 },
    { icon: 'school',               label: 'Educadores y Talleristas',    color: 'accent',  indent: 3 },
    { icon: 'cleaning_services',    label: 'Auxiliar de Limpieza',        color: 'primary', indent: 4 },
  ];

  infoItems = [
    { icon: 'schedule',         color: '#1565C0', text: 'El centro opera de 7:00 a 19:00 hs de lunes a viernes' },
    { icon: 'group_work',       color: '#2E7D32', text: 'Grupos de niños organizados por rango etario' },
    { icon: 'cleaning_services',color: '#FF6F00', text: 'Auxiliares de limpieza cubren el horario completo' },
    { icon: 'supervisor_account',color:'#7B1FA2', text: 'Supervisiones cada 2 meses' },
  ];

  constructor(private dashService: DashboardService, public auth: AuthService, private cdr: ChangeDetectorRef, private toast: ToastService) {}

  ngOnInit() {
  this.nombre = this.auth.getNombre() ?? 'Administrador/a';
  this.dashService.getAdminStats().pipe(
    finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
  ).subscribe({
    next: (s) => {
      this.stats = s;
      this.statCards = [
        { icon: 'people',         label: 'Funcionarios Activos', value: s.funcionariosActivos, sub: `de ${s.funcionariosTotales} registrados`, color: '#1565C0', bg: '#E3F2FD' },
        { icon: 'child_care',     label: 'Niños Registrados',    value: s.niniosTotales,        sub: 'en el sistema',    color: '#2E7D32', bg: '#E8F5E9' },
        { icon: 'schedule',       label: 'Turnos Activos',       value: s.turnosActivos,        sub: 'asignados',        color: '#FF6F00', bg: '#FFF3E0' },
        { icon: 'groups',         label: 'Grupos Activos',       value: s.gruposActivos,        sub: 'en funcionamiento',color: '#7B1FA2', bg: '#F3E5F5' },
        { icon: 'event',          label: 'Actividades',          value: s.actividadesTotal,     sub: 'registradas',      color: '#00695C', bg: '#E0F2F1' },
      ];
    },
    error: () => { this.toast.error('Error al cargar estadísticas'); }
  });
}

  get saludoHora(): string {
    const h = this.ahora.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get fechaFormateada(): string {
    return this.ahora.toLocaleDateString('es-UY', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  get coberturaColor(): string {
    if (!this.stats) return 'primary';
    return this.stats.coberturaPorcentaje >= 80 ? 'primary' : 'warn';
  }
}