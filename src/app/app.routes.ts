import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';

export const routes: Routes = [
  { path: 'Iniciar-Sesion', component: LoginComponent },
  { path: 'registro', component: RegistroComponent }
];
