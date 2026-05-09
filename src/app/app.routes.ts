import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './guards/auth-guard';


export const routes: Routes = [
  { path: '', redirectTo: '/Iniciar-Sesion', pathMatch: 'full' },
 
  {
    path: 'Iniciar-Sesion',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
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
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
 
  // Dashboard para funcionarios (coordinador, educador, auxiliar, etc)
  {
    path: 'dashboard/funcionario',
    loadComponent: () =>
      import('./pages/dashboard-funcionario/dashboard-funcionario.component').then(m => m.DashboardFuncionarioComponent),
    canActivate: [authGuard, rolGuard(['FUNCIONARIO'])]
  },
 
  // Dashboard para responsables (padres/tutores)
  {
    path: 'dashboard/responsable',
    loadComponent: () =>
      import('./pages/dashboard-responsable/dashboard-responsable.component').then(m => m.DashboardResponsableComponent),
    canActivate: [authGuard, rolGuard(['RESPONSABLE'])]
  },
 
  { path: '**', redirectTo: '/Iniciar-Sesion' }
];
 
