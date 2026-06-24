import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, Sidebar, CommonModule],
  template: `
    <div style="display: flex; height: 100vh;">
      @if (mostrarSidebar()) {
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
  readonly mostrarSidebar = signal(false);

  constructor(public auth: AuthService, private router: Router) {
    this.mostrarSidebar.set(this.auth.isLoggedIn());
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.mostrarSidebar.set(this.auth.isLoggedIn()));
  }
}