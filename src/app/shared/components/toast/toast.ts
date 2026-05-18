import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, Toast } from '../../../services/toast.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="remove(toast.id)">
          <mat-icon>{{ getIcon(toast.type) }}</mat-icon>
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `
})

export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub!: Subscription;
 
  constructor(private toastService: ToastService) {}
 
  ngOnInit() {
    this.sub = this.toastService.toasts$.subscribe(toast => {
      this.toasts.push(toast);
      setTimeout(() => this.remove(toast.id), toast.duration ?? 4000);
    });
  }
 
  ngOnDestroy() { this.sub?.unsubscribe(); }
 
  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
 
  getIcon(type: string): string {
    const map: Record<string, string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return map[type] ?? 'info';
  }


}
