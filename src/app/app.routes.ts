import { Routes } from '@angular/router';
import { adminGuard, authGuard, rolGuard } from './guards/auth-guard';
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
    canActivate: [authGuard, rolGuard(['FUNCIONARIO'])]
  },
 
  // Dashboard para responsables (padres/tutores)
  {
    path: 'dashboard/responsable',
    loadComponent: () =>
      import('./pages/dashboard-responsable/dashboard-responsable').then(m => m.DashboardResponsableComponent),
    canActivate: [authGuard, rolGuard(['RESPONSABLE'])]
  },
  // Dashboard para administradores
  {
    path: 'dashboard/admin',
    loadComponent: () =>
      import('./pages/dashboard-admin/dashboard-admin').then(m => m.DashboardAdminComponent),
    canActivate: [adminGuard]
  },

    {
    path: 'usuarios',
    loadComponent: () =>
      import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent),
    canActivate: [adminGuard]
  },

  {
    path: 'turnos',
    loadComponent: () =>
      import('./pages/turnos/turnos').then(m => m.TurnosComponent),
    canActivate: [authGuard]
  },
 
  {
    path: 'reportes',
    loadComponent: () =>
      import('./pages/reportes/reportes').then(m => m.ReportesComponent),
    canActivate: [authGuard]
  }
 
];
 
