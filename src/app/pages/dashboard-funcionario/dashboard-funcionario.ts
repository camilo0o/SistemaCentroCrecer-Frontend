import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { ROL_DISPLAY } from '../../models/models';

@Component({
  selector: 'app-dashboard-funcionario',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatListModule,
    MatToolbarModule, MatProgressSpinnerModule,
    Sidebar
  ],
  templateUrl: './dashboard-funcionario.html',
  styleUrl: './dashboard-funcionario.css',
})
export class DashboardFuncionarioComponent implements OnInit {
  stats: any = null;
  cargando = true;
  nombre = '';
  rolDisplay = '';
  ahora = new Date();

  statCards: any[] = [];

  acciones = [
    { route: '/turnos',   icon: 'schedule',   label: 'Mis Turnos',  desc: 'Ver y gestionar mis horarios asignados', color: '#FF6F00' },
    { route: '/reportes', icon: 'assessment', label: 'Reportes',    desc: 'Ver reportes generados',                 color: '#7B1FA2' },
  ];

  constructor(private dashService: DashboardService, public auth: AuthService) {}

  ngOnInit() {
    this.nombre = this.auth.getNombre() ?? 'Funcionario';
    const rol = this.auth.getRol() ?? '';
    this.rolDisplay = ROL_DISPLAY[rol] ?? rol;

    this.dashService.getFuncionarioStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.statCards = [
          { icon: 'child_care', label: 'Niños registrados', value: s.niniosTotales,    bg: '#E8F5E9', color: '#2E7D32' },
          { icon: 'event',      label: 'Actividades',       value: s.actividadesTotal,  bg: '#FFF3E0', color: '#FF6F00' },
          { icon: 'groups',     label: 'Grupos activos',    value: s.gruposActivos,     bg: '#F3E5F5', color: '#7B1FA2' },
        ];
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
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
}