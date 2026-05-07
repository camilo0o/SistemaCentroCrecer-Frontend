import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { Test } from './pages/test/test';

export const routes: Routes = [
  { path: '', redirectTo: '/Iniciar-Sesion', pathMatch: 'full' },
  { path: 'Iniciar-Sesion', component: LoginComponent },
  { path: 'Test', component: Test },
  { path: 'registro', component: RegistroComponent },
  { path: 'dashboard', component: DashboardComponent }
];
