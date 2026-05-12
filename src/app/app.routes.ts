import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './guards/auth-guard';
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
 
];
 
