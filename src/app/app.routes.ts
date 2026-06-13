import { Routes } from '@angular/router';
import { adminGuard, authGuard, funcionarioGuard, responsableGuard } from './guards/auth-guard';
import { Home } from './pages/home/home';


export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  {
    path: 'iniciarSesion',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'home',
    component: Home
  },

  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/registro/registro.component').then(m => m.RegistroComponent)
  },

  // Redirect inteligente tras login
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // Dashboard para funcionarios (coordinador, educador, auxiliar, etc)
  {
    path: 'dashboard/funcionario',
    loadComponent: () =>
      import('./pages/dashboard-funcionario/dashboard-funcionario').then(m => m.DashboardFuncionarioComponent),
    canActivate: [funcionarioGuard]
  },

  // Dashboard para responsables (padres/tutores)
  {
    path: 'dashboard/responsable',
    loadComponent: () =>
      import('./pages/dashboard-responsable/dashboard-responsable').then(m => m.DashboardResponsableComponent),
    canActivate: [responsableGuard]
  },

  // Reportes visibles para el responsable
  {
    path: 'responsable/reportes',
    loadComponent: () =>
      import('./pages/reportes-responsable/reportes-responsable').then(m => m.ReportesResponsableComponent),
    canActivate: [responsableGuard]
  },

  // Dashboard para administradores — SOLO gestión de funcionarios del sistema
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', loadComponent: () =>
          import('./pages/dashboard-admin/dashboard-admin').then(m => m.DashboardAdminComponent) },
      { path: 'usuarios', loadComponent: () =>
          import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent) },
      { path: 'asistencia-personal', loadComponent: () =>
          import('./pages/asistencia-admin/asistencia-admin').then(m => m.AsistenciaAdminComponent) },
      { path: 'responsables', loadComponent: () =>
          import('./pages/responsables/responsables').then(m => m.ResponsablesComponent) },
    ]
  },

  // Sección de funcionarios (coordinadora, psicólogo, maestra, etc.)
  {
    path: 'funcionario',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [funcionarioGuard],
    children: [
      { path: 'gruposyninios', loadComponent: () =>
          import('./pages/grupos/grupos').then(m => m.GruposComponent) },
      { path: 'ninios', redirectTo: 'gruposyninios', pathMatch: 'full' },
      { path: 'grupos', redirectTo: 'gruposyninios', pathMatch: 'full' },
      { path: 'turnos', loadComponent: () =>
          import('./pages/turnos/turnos').then(m => m.TurnosComponent) },
      { path: 'reportes', loadComponent: () =>
          import('./pages/reportes/reportes').then(m => m.ReportesComponent) },
      { path: 'actividades', loadComponent: () =>
          import('./pages/actividades/actividades').then(m => m.ActividadesComponent) },
      { path: 'agenda', loadComponent: () =>
          import('./pages/agenda/agenda').then(m => m.AgendaComponent) },
      { path: 'agenda-limpieza', loadComponent: () =>
          import('./pages/agenda-limpieza/agenda-limpieza').then(m => m.AgendaLimpiezaComponent) },
      { path: 'asistencia', loadComponent: () =>
          import('./pages/asistencia/asistencia').then(m => m.AsistenciaComponent) },
      { path: 'responsables', loadComponent: () =>
          import('./pages/responsables/responsables').then(m => m.ResponsablesComponent) },
    ]
  },

  // Perfil de usuario (todos los tipos)
  {
    path: 'perfil',
    loadComponent: () =>
      import('./pages/perfil/perfil').then(m => m.PerfilComponent),
    canActivate: [authGuard]
  }
];