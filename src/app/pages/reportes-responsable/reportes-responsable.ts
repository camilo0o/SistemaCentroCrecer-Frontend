import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';
import { ReporteResponse } from '../../models/models';
import { finalize } from 'rxjs/operators';

// ---- Detalle Dialog ----
@Component({
  selector: 'app-reporte-responsable-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatChipsModule
  ],
  styles: [`
    .dialog-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px 0; }
    .dialog-title { margin:0; font-size:18px; font-weight:600; color:#1565C0; }
    .section { margin-bottom:16px; }
    .section-label { font-size:12px; font-weight:600; color:#5C6680; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; display:flex; align-items:center; gap:4px; }
    .chips-row { display:flex; flex-wrap:wrap; gap:6px; }
    .chip-grupo { background:#E8F5E9; color:#2E7D32; border-radius:16px; padding:4px 12px; font-size:12px; font-weight:500; }
    .chip-ninio { background:#E3F2FD; color:#1565C0; border-radius:16px; padding:4px 12px; font-size:12px; font-weight:500; }
    .empty-label { font-size:12px; color:#9AA0B9; font-style:italic; }
    .meta-row { display:flex; gap:24px; font-size:13px; color:#5C6680; flex-wrap:wrap; margin-bottom:16px; }
    .meta-item { display:flex; flex-direction:column; gap:2px; }
    .meta-key { font-size:11px; text-transform:uppercase; letter-spacing:.4px; }
    .meta-val { font-weight:500; color:#1a2340; }
    .desc-box { background:#F5F7FA; border-radius:8px; padding:12px; font-size:13px; color:#3a4060; white-space:pre-wrap; }
    .generado-por { display:flex; align-items:center; gap:10px; background:#F0F4FF; border-radius:10px; padding:10px 14px; margin-bottom:16px; }
    .generado-por mat-icon { color:#1565C0; }
    .generado-por-label { font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:#5C6680; }
    .generado-por-nombre { font-size:14px; font-weight:600; color:#1a2340; }
    .dialog-actions { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px; }
  `],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.reporte.titulo }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:16px 24px;min-width:480px;max-height:65vh;overflow-y:auto">

      <div class="generado-por">
        <mat-icon>account_circle</mat-icon>
        <div>
          <div class="generado-por-label">Generado por</div>
          <div class="generado-por-nombre">
            {{ data.reporte.funcionario
                ? (data.reporte.funcionario.nombre + ' ' + data.reporte.funcionario.apellido)
                : (data.reporte.funcionarioNombre ?? '—') }}
          </div>
        </div>
      </div>

      <div class="meta-row">
        <div class="meta-item">
          <span class="meta-key">Fecha</span>
          <span class="meta-val">{{ formatFecha(data.reporte.fechaGeneracion) }}</span>
        </div>
      </div>

      <div class="section" *ngIf="data.reporte.descripcion">
        <div class="section-label"><mat-icon style="font-size:14px">notes</mat-icon> Descripción</div>
        <div class="desc-box">{{ data.reporte.descripcion }}</div>
      </div>

      <div class="section" *ngIf="grupos.length > 0">
        <div class="section-label"><mat-icon style="font-size:14px">groups</mat-icon> Grupos ({{ grupos.length }})</div>
        <div class="chips-row">
          <span class="chip-grupo" *ngFor="let g of grupos">{{ g.grupoNombre }}</span>
        </div>
      </div>

      <div class="section" *ngIf="ninios.length > 0">
        <div class="section-label"><mat-icon style="font-size:14px">child_care</mat-icon> Niños ({{ ninios.length }})</div>
        <div class="chips-row">
          <span class="chip-ninio" *ngFor="let n of ninios">{{ n.ninioNombre }} {{ n.ninioApellido }}</span>
        </div>
      </div>

    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cerrar</button>
    </div>
  `
})
export class ReporteResponsableDetalleDialogComponent {
  constructor(
    public ref: MatDialogRef<ReporteResponsableDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reporte: ReporteResponse }
  ) {}

  get grupos() { return this.data.reporte.grupos ?? []; }
  get ninios() { return this.data.reporte.ninios ?? []; }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

// ---- Componente principal ----
@Component({
  selector: 'app-reportes-responsable',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatDialogModule,
    MatTooltipModule, MatInputModule, MatFormFieldModule
  ],
  styles: [`
    .page-title { font-size:24px; font-weight:700; color:#1a2340; margin:0 0 4px; display:flex; align-items:center; gap:8px; }
    .page-title mat-icon { color:#1565C0; font-size:28px; }
    .subtitle { font-size:13px; color:#5C6680; margin:0 0 24px; }
    .search-bar { margin-bottom:24px; max-width:400px; }
    .empty-state { text-align:center; padding:64px 24px; color:#9AA0B9; }
    .empty-state mat-icon { font-size:64px; width:64px; height:64px; margin-bottom:12px; }
    .reporte-card { border-radius:12px; margin-bottom:16px; border:1px solid #E5E9F2; box-shadow:none; cursor:pointer; transition:box-shadow .2s, border-color .2s; }
    .reporte-card:hover { box-shadow:0 4px 16px rgba(21,101,192,.12); border-color:#90CAF9; }
    .card-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .titulo { font-size:16px; font-weight:600; color:#1a2340; margin:0 0 4px; }
    .fecha { font-size:12px; color:#9AA0B9; }
    .funcionario-row { display:flex; align-items:center; gap:6px; font-size:13px; color:#5C6680; margin-top:8px; }
    .funcionario-row mat-icon { font-size:16px; width:16px; height:16px; color:#1565C0; }
    .chips-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .chip-grupo { background:#E8F5E9; color:#2E7D32; border-radius:16px; padding:3px 10px; font-size:11px; font-weight:500; }
    .chip-ninio { background:#E3F2FD; color:#1565C0; border-radius:16px; padding:3px 10px; font-size:11px; font-weight:500; }
    .badge-nuevo { background:#EF4444; color:white; border-radius:999px; padding:1px 7px; font-size:10px; font-weight:700; margin-left:8px; vertical-align:middle; }
    .ver-btn { flex-shrink:0; }
    .spinner-wrap { display:flex; justify-content:center; padding:64px; }
    .stats-row { display:flex; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
    .stat-card { background:white; border-radius:12px; padding:16px 24px; border:1px solid #E5E9F2; min-width:120px; text-align:center; }
    .stat-num { font-size:28px; font-weight:700; color:#1565C0; }
    .stat-label { font-size:12px; color:#5C6680; margin-top:4px; }
  `],
  template: `
    <h1 class="page-title">
      <mat-icon>description</mat-icon>
      Reportes
    </h1>
    <p class="subtitle">Reportes generados por los funcionarios sobre tus niños o su grupo</p>

    <div class="stats-row" *ngIf="!cargando">
      <div class="stat-card">
        <div class="stat-num">{{ reportes.length }}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#EF4444">{{ sinLeer }}</div>
        <div class="stat-label">Sin leer</div>
      </div>
    </div>

    <mat-form-field appearance="outline" class="search-bar">
      <mat-label>Buscar reporte</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input matInput [(ngModel)]="busqueda" (ngModelChange)="aplicarFiltro()" placeholder="Título, niño, grupo…">
    </mat-form-field>

    <div class="spinner-wrap" *ngIf="cargando">
      <mat-spinner diameter="48"></mat-spinner>
    </div>

    <ng-container *ngIf="!cargando">
      <div *ngIf="filtrados.length === 0" class="empty-state">
        <mat-icon>folder_open</mat-icon>
        <p>No hay reportes disponibles aún</p>
      </div>

      <mat-card
        class="reporte-card"
        *ngFor="let r of filtrados"
        (click)="verDetalle(r)">
        <mat-card-content style="padding:16px">
          <div class="card-header">
            <div>
              <div class="titulo">
                {{ r.titulo }}
                <span class="badge-nuevo" *ngIf="!r.visto">NUEVO</span>
              </div>
              <div class="fecha">{{ formatFecha(r.fechaGeneracion) }}</div>
            </div>
            <button mat-icon-button class="ver-btn" matTooltip="Ver detalle"
              (click)="$event.stopPropagation(); verDetalle(r)">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </div>

          <div class="funcionario-row">
            <mat-icon>account_circle</mat-icon>
            {{ getNombreFuncionario(r) }}
          </div>

          <div class="chips-row" *ngIf="(r.grupos?.length ?? 0) + (r.ninios?.length ?? 0) > 0">
            <span class="chip-grupo" *ngFor="let g of (r.grupos ?? [])">
              <mat-icon style="font-size:11px;vertical-align:middle">groups</mat-icon> {{ g.grupoNombre }}
            </span>
            <span class="chip-ninio" *ngFor="let n of (r.ninios ?? [])">
              <mat-icon style="font-size:11px;vertical-align:middle">face</mat-icon> {{ n.ninioNombre }} {{ n.ninioApellido }}
            </span>
          </div>
        </mat-card-content>
      </mat-card>
    </ng-container>
  `
})
export class ReportesResponsableComponent implements OnInit {
  reportes: ReporteResponse[] = [];
  filtrados: ReporteResponse[] = [];
  cargando = true;
  busqueda = '';
  responsableId: number | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.responsableId = this.auth.getUserId();
    this.cargar();
  }

  cargar() {
    if (!this.responsableId) return;
    this.cargando = true;
    this.http.get<ReporteResponse[]>(`${environment.apiUrl}/reportes/responsable/${this.responsableId}`)
      .pipe(finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (data) => { this.reportes = data; this.aplicarFiltro(); },
        error: () => this.toast.error('Error al cargar reportes')
      });
  }

  aplicarFiltro() {
    if (!this.busqueda.trim()) { this.filtrados = [...this.reportes]; return; }
    const b = this.busqueda.toLowerCase();
    this.filtrados = this.reportes.filter(r =>
      r.titulo.toLowerCase().includes(b) ||
      r.descripcion?.toLowerCase().includes(b) ||
      (r.grupos ?? []).some(g => g.grupoNombre.toLowerCase().includes(b)) ||
      (r.ninios ?? []).some(n => `${n.ninioNombre} ${n.ninioApellido}`.toLowerCase().includes(b))
    );
  }

  verDetalle(r: ReporteResponse) {
    const eraNoVisto = !r.visto;
    if (eraNoVisto) {
      r.visto = true; // optimista
      this.http.put(`${environment.apiUrl}/reportes/${r.id}/visto?responsableId=${this.responsableId}`, {}).subscribe({
        next: () => this.cdr.detectChanges(),
        error: () => {
          r.visto = false; // revertir si falla
          this.cdr.detectChanges();
        }
      });
    }
    this.dialog.open(ReporteResponsableDetalleDialogComponent, {
      data: { reporte: r },
      maxWidth: '580px', width: '100%'
    });
  }

  getNombreFuncionario(r: ReporteResponse): string {
    if (r.funcionario) return `${r.funcionario.nombre} ${r.funcionario.apellido}`;
    return r.funcionarioNombre ?? '—';
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get sinLeer() { return this.reportes.filter(r => !r.visto).length; }
}