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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { ROL_DISPLAY } from '../../models/models';

interface AccionCard {
  route: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

interface InfoItem {
  icon: string;
  color: string;
  text: string;
}

@Component({
  selector: 'app-dashboard-funcionario',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatListModule,
    MatToolbarModule, MatProgressSpinnerModule, MatProgressBarModule,
    Sidebar
  ],
  templateUrl: './dashboard-funcionario.html',
  styleUrl: './dashboard-funcionario.css',
})
export class DashboardFuncionarioComponent implements OnInit {
  stats: any = null;
  cargando = true;
  nombre = '';
  rol = '';
  rolDisplay = '';
  ahora = new Date();

  statCards: any[] = [];
  acciones: AccionCard[] = [];
  infoItems: InfoItem[] = [];

  // ─── Configuración por rol ────────────────────────────────────────────────

  private readonly ROL_CONFIG: Record<string, {
    acciones: AccionCard[];
    infoItems: InfoItem[];
    bannerColor: string;
    bannerBg: string;
    bannerIcon: string;
    bannerDesc: string;
  }> = {

    COORDINADORA: {
      bannerColor: '#7B1FA2',
      bannerBg: '#F3E5F5',
      bannerIcon: 'star',
      bannerDesc: 'Coordinación general del centro — 40 horas semanales',
      acciones: [
        { route: '/admin/usuarios',    icon: 'manage_accounts', label: 'Gestión de Personal',   desc: 'Administrar funcionarios y roles',         color: '#1565C0', bg: '#E3F2FD' },
        { route: '/admin/grupos',      icon: 'category',         label: 'Grupos',                 desc: 'Ver y organizar grupos de niños',            color: '#7B1FA2', bg: '#F3E5F5' },
        { route: '/admin/turnos',      icon: 'schedule',         label: 'Turnos',                 desc: 'Gestionar horarios del equipo',              color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/admin/reportes',    icon: 'assessment',       label: 'Reportes',               desc: 'Supervisar reportes del sistema',             color: '#00695C', bg: '#E0F2F1' },
        { route: '/admin/actividades', icon: 'event',            label: 'Actividades',            desc: 'Planificar actividades del centro',          color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/admin/agenda',      icon: 'calendar_month',   label: 'Agenda',                 desc: 'Organizar supervisiones y reuniones',        color: '#C62828', bg: '#FFEBEE' },
      ],
      infoItems: [
        { icon: 'schedule',          color: '#1565C0', text: 'Jornada completa: 40 horas semanales' },
        { icon: 'supervisor_account',color: '#7B1FA2', text: 'Supervisiones del equipo técnico cada 2 meses' },
        { icon: 'groups',            color: '#2E7D32', text: 'Coordina todos los grupos y salas del centro' },
        { icon: 'cleaning_services', color: '#FF6F00', text: 'Supervisa auxiliares de limpieza 7:00 – 19:00 hs' },
      ]
    },

    ASISTENTE_SOCIAL: {
      bannerColor: '#1565C0',
      bannerBg: '#E3F2FD',
      bannerIcon: 'social_distance',
      bannerDesc: 'Equipo técnico — 20 horas semanales',
      acciones: [
        { route: '/admin/ninios',   icon: 'child_care', label: 'Niños',      desc: 'Ver información de niños registrados',  color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/admin/grupos',   icon: 'category',   label: 'Grupos',     desc: 'Consultar grupos del centro',           color: '#7B1FA2', bg: '#F3E5F5' },
        { route: '/admin/reportes', icon: 'assessment', label: 'Reportes',   desc: 'Generar y ver reportes sociales',       color: '#1565C0', bg: '#E3F2FD' },
        { route: '/admin/agenda',   icon: 'calendar_month', label: 'Agenda', desc: 'Mi agenda de atenciones',              color: '#FF6F00', bg: '#FFF3E0' },
      ],
      infoItems: [
        { icon: 'schedule',    color: '#1565C0', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'family_restroom', color: '#2E7D32', text: 'Seguimiento de situaciones familiares' },
        { icon: 'description', color: '#7B1FA2', text: 'Informes periódicos al equipo de coordinación' },
      ]
    },

    PSICOLOGO: {
      bannerColor: '#6A1B9A',
      bannerBg: '#EDE7F6',
      bannerIcon: 'psychology',
      bannerDesc: 'Equipo técnico — 20 horas semanales',
      acciones: [
        { route: '/admin/ninios',   icon: 'child_care',    label: 'Niños',       desc: 'Seguimiento de niños',               color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/admin/reportes', icon: 'assessment',    label: 'Reportes',    desc: 'Informes psicológicos',              color: '#6A1B9A', bg: '#EDE7F6' },
        { route: '/admin/agenda',   icon: 'calendar_month',label: 'Agenda',      desc: 'Sesiones y reuniones programadas',   color: '#FF6F00', bg: '#FFF3E0' },
      ],
      infoItems: [
        { icon: 'schedule',     color: '#6A1B9A', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'psychology',   color: '#7B1FA2', text: 'Evaluaciones y seguimiento psicológico' },
        { icon: 'group_work',   color: '#2E7D32', text: 'Participación en reuniones de equipo técnico' },
      ]
    },

    PSICOMOTRICISTA: {
      bannerColor: '#00695C',
      bannerBg: '#E0F2F1',
      bannerIcon: 'directions_run',
      bannerDesc: 'Equipo técnico — 20 horas semanales',
      acciones: [
        { route: '/admin/grupos',      icon: 'category',      label: 'Grupos',      desc: 'Grupos donde trabajo',              color: '#00695C', bg: '#E0F2F1' },
        { route: '/admin/actividades', icon: 'event',         label: 'Actividades', desc: 'Sesiones de psicomotricidad',       color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/admin/reportes',    icon: 'assessment',    label: 'Reportes',    desc: 'Reportes de seguimiento',           color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'schedule',        color: '#00695C', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'directions_run',  color: '#00695C', text: 'Trabaja el desarrollo motor de los niños' },
        { icon: 'group_work',      color: '#2E7D32', text: 'Coordina con el equipo pedagógico' },
      ]
    },

    MAESTRA: {
      bannerColor: '#1565C0',
      bannerBg: '#E3F2FD',
      bannerIcon: 'school',
      bannerDesc: 'Equipo técnico — 20 horas semanales · Parte pedagógica',
      acciones: [
        { route: '/admin/grupos',      icon: 'category',      label: 'Mis Grupos',   desc: 'Grupos a mi cargo',                 color: '#1565C0', bg: '#E3F2FD' },
        { route: '/admin/ninios',      icon: 'child_care',    label: 'Niños',        desc: 'Ver niños registrados',             color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/admin/actividades', icon: 'event',         label: 'Actividades',  desc: 'Planificación pedagógica',          color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/admin/reportes',    icon: 'assessment',    label: 'Reportes',     desc: 'Informes de avance',               color: '#7B1FA2', bg: '#F3E5F5' },
      ],
      infoItems: [
        { icon: 'schedule',    color: '#1565C0', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'school',      color: '#1565C0', text: 'Responsable de la parte pedagógica del grupo' },
        { icon: 'menu_book',   color: '#2E7D32', text: 'Planificación de actividades educativas' },
      ]
    },

    ADMINISTRATIVO: {
      bannerColor: '#37474F',
      bannerBg: '#ECEFF1',
      bannerIcon: 'admin_panel_settings',
      bannerDesc: 'Equipo técnico — 20 horas semanales',
      acciones: [
        { route: '/admin/usuarios',    icon: 'manage_accounts', label: 'Usuarios',    desc: 'Gestión administrativa',            color: '#37474F', bg: '#ECEFF1' },
        { route: '/admin/turnos',      icon: 'schedule',        label: 'Turnos',      desc: 'Control de horarios',              color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/admin/reportes',    icon: 'assessment',      label: 'Reportes',    desc: 'Documentación y reportes',         color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'schedule',           color: '#37474F', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'admin_panel_settings',color: '#37474F', text: 'Gestión de documentación y administración' },
      ]
    },

    EDUCADOR: {
      bannerColor: '#2E7D32',
      bannerBg: '#E8F5E9',
      bannerIcon: 'face',
      bannerDesc: 'Educador/a — Por debajo del equipo técnico',
      acciones: [
        { route: '/admin/grupos',      icon: 'category',      label: 'Mis Grupos',    desc: 'Niños a mi cargo',                 color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/admin/actividades', icon: 'event',         label: 'Actividades',   desc: 'Actividades programadas',          color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/admin/reportes',    icon: 'assessment',    label: 'Reportes',      desc: 'Reportes de mi sala',             color: '#1565C0', bg: '#E3F2FD' },
        { route: '/admin/agenda',      icon: 'calendar_month',label: 'Agenda',        desc: 'Mi agenda diaria',                color: '#7B1FA2', bg: '#F3E5F5' },
      ],
      infoItems: [
        { icon: 'group_work',  color: '#2E7D32', text: 'Trabaja directamente con los niños en sala' },
        { icon: 'school',      color: '#1565C0', text: 'Coordina con maestra en la parte pedagógica' },
      ]
    },

    TALLERISTA_PLASTICA: {
      bannerColor: '#E64A19',
      bannerBg: '#FBE9E7',
      bannerIcon: 'palette',
      bannerDesc: 'Tallerista de Expresión Plástica',
      acciones: [
        { route: '/admin/actividades', icon: 'palette',     label: 'Talleres',     desc: 'Mis talleres de expresión plástica', color: '#E64A19', bg: '#FBE9E7' },
        { route: '/admin/grupos',      icon: 'category',    label: 'Grupos',       desc: 'Grupos que atiendo',                color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/admin/reportes',    icon: 'assessment',  label: 'Reportes',     desc: 'Reportes de taller',                color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'palette',   color: '#E64A19', text: 'Talleres de expresión artística y plástica' },
        { icon: 'group_work',color: '#2E7D32', text: 'Trabaja con distintos grupos del centro' },
      ]
    },

    TALLERISTA_CERAMICA: {
      bannerColor: '#5D4037',
      bannerBg: '#EFEBE9',
      bannerIcon: 'architecture',
      bannerDesc: 'Tallerista de Cerámica',
      acciones: [
        { route: '/admin/actividades', icon: 'architecture', label: 'Talleres',    desc: 'Mis talleres de cerámica',          color: '#5D4037', bg: '#EFEBE9' },
        { route: '/admin/grupos',      icon: 'category',     label: 'Grupos',      desc: 'Grupos que atiendo',               color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/admin/reportes',    icon: 'assessment',   label: 'Reportes',    desc: 'Reportes de taller',               color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'architecture',color: '#5D4037', text: 'Talleres de modelado y cerámica' },
        { icon: 'group_work',  color: '#2E7D32', text: 'Trabaja con distintos grupos del centro' },
      ]
    },

    TALLERISTA_CORPORAL: {
      bannerColor: '#1565C0',
      bannerBg: '#E3F2FD',
      bannerIcon: 'self_improvement',
      bannerDesc: 'Tallerista de Expresión Corporal',
      acciones: [
        { route: '/admin/actividades', icon: 'self_improvement', label: 'Talleres',  desc: 'Mis talleres corporales',           color: '#1565C0', bg: '#E3F2FD' },
        { route: '/admin/grupos',      icon: 'category',          label: 'Grupos',    desc: 'Grupos que atiendo',               color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/admin/reportes',    icon: 'assessment',        label: 'Reportes',  desc: 'Reportes de taller',               color: '#7B1FA2', bg: '#F3E5F5' },
      ],
      infoItems: [
        { icon: 'self_improvement', color: '#1565C0', text: 'Talleres de expresión corporal y movimiento' },
        { icon: 'group_work',       color: '#2E7D32', text: 'Trabaja con distintos grupos del centro' },
      ]
    },

    AUXILIAR_LIMPIEZA: {
      bannerColor: '#FF6F00',
      bannerBg: '#FFF3E0',
      bannerIcon: 'cleaning_services',
      bannerDesc: 'Auxiliar de Limpieza — Turnos rotativos 7:00 – 19:00 hs',
      acciones: [
        { route: '/admin/turnos',  icon: 'schedule',   label: 'Mis Turnos',  desc: 'Ver mis horarios asignados',         color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/admin/agenda',  icon: 'calendar_month', label: 'Agenda', desc: 'Novedades y comunicados del día',     color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'schedule',          color: '#FF6F00', text: 'El centro opera 7:00 – 19:00 hs de lunes a viernes' },
        { icon: 'cleaning_services', color: '#FF6F00', text: 'Turno 1: 7:00 – 11:00 hs · Turno 2: 11:00 – 15:00 hs · Turno 3: 15:00 – 19:00 hs' },
        { icon: 'group',             color: '#2E7D32', text: 'Coincidencia de turnos en el cierre del centro (desde las 15:00)' },
        { icon: 'info',              color: '#1565C0', text: 'Se cubren 8 horas diarias sumando los turnos asignados' },
      ]
    },

  };

  // Fallback para roles no configurados explícitamente
  private readonly DEFAULT_CONFIG = {
    bannerColor: '#1565C0',
    bannerBg: '#E3F2FD',
    bannerIcon: 'badge',
    bannerDesc: 'Funcionario del Centro Crecer',
    acciones: [
      { route: '/admin/turnos',  icon: 'schedule',  label: 'Mis Turnos', desc: 'Ver mis horarios',            color: '#FF6F00', bg: '#FFF3E0' },
      { route: '/admin/reportes',icon: 'assessment',label: 'Reportes',   desc: 'Generar y ver reportes',      color: '#7B1FA2', bg: '#F3E5F5' },
    ],
    infoItems: [
      { icon: 'schedule', color: '#1565C0', text: 'El centro opera de lunes a viernes, 7:00 – 19:00 hs' },
    ]
  };

  get rolConfig() {
    return this.ROL_CONFIG[this.rol] ?? this.DEFAULT_CONFIG;
  }

  constructor(private dashService: DashboardService, public auth: AuthService) {}

  ngOnInit() {
    this.nombre = this.auth.getNombre() ?? 'Funcionario';
    this.rol = this.auth.getRol() ?? '';
    this.rolDisplay = ROL_DISPLAY[this.rol] ?? this.rol;

    this.dashService.getFuncionarioStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.statCards = [
          { icon: 'child_care', label: 'Niños registrados', value: s.niniosTotales,   bg: '#E8F5E9', color: '#2E7D32' },
          { icon: 'event',      label: 'Actividades',       value: s.actividadesTotal, bg: '#FFF3E0', color: '#FF6F00' },
          { icon: 'groups',     label: 'Grupos activos',    value: s.gruposActivos,    bg: '#F3E5F5', color: '#7B1FA2' },
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

  get esCoordinadora(): boolean { return this.rol === 'COORDINADORA'; }
  get esAuxiliar(): boolean { return this.rol === 'AUXILIAR_LIMPIEZA'; }
}