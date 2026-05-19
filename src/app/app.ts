import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, Sidebar, CommonModule],
  template: `
    <div style="display: flex; height: 100vh;">
      @if (auth.isLoggedIn()) {
        <app-sidebar />
      }
      <main style="flex: 1; overflow: auto;">
        <router-outlet />
      </main>
    </div>
    <app-toast />
  `
})
export class App {
  protected readonly title = signal('SistemaCentroCrecer-Frontend');
  constructor(public auth: AuthService) {}
}