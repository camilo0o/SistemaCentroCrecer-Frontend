import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ReporteService } from '../../services/reporte.service';
import { ReporteResponse } from '../../models/models';

interface ReporteResponsableItem extends ReporteResponse {
  marcandoVisto?: boolean;
}

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
    .chip-ninio { background:#E3F2FD; color:#1565C0; border-radius:16px; padding:4px 12px 4px 4px; font-size:12px; font-weight:500; display:inline-flex; align-items:center; gap:6px; }
    .chip-avatar { width:22px; height:22px; border-radius:50%; background:#1565C0; color:white; display:inline-flex; align-items:center; justify-content:center; overflow:hidden; font-size:9px; font-weight:800; flex-shrink:0; }
    .chip-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
    .meta-row { display:flex; gap:24px; font-size:13px; color:#5C6680; flex-wrap:wrap; margin-bottom:16px; }
    .meta-item { display:flex; flex-direction:column; gap:2px; }
    .meta-key { font-size:11px; text-transform:uppercase; letter-spacing:.4px; }
    .meta-val { font-weight:500; color:#1a2340; }
    .desc-box { background:#F5F7FA; border-radius:8px; padding:12px; font-size:13px; color:#3a4060; white-space:pre-wrap; }
    .generado-por { display:flex; align-items:center; gap:10px; background:#F0F4FF; border-radius:10px; padding:10px 14px; margin-bottom:16px; }
    .generado-por-avatar { width:36px; height:36px; border-radius:50%; background:#1565C0; color:white; display:flex; align-items:center; justify-content:center; overflow:hidden; font-size:12px; font-weight:800; flex-shrink:0; }
    .generado-por-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
    .generado-por-label { font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:#5C6680; }
    .generado-por-nombre { font-size:14px; font-weight:600; color:#1a2340; }
    .dialog-actions { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px; }
  `],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.reporte.titulo }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:16px 24px;width:min(520px,88vw);max-height:65vh;overflow-y:auto">

      <div class="generado-por">
        <div class="generado-por-avatar">
          @if(funcionarioFoto){
            <img [src]="funcionarioFoto" alt="Foto de perfil">
          } @else {
            {{ funcionarioIniciales }}
          }
        </div>
        <div>
          <div class="generado-por-label">Generado por</div>
          <div class="generado-por-nombre">
            {{ data.reporte.funcionario
                ? (data.reporte.funcionario.nombre + ' ' + data.reporte.funcionario.apellido)
                : (data.reporte.funcionarioNombre ?? '-') }}
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
        <div class="section-label"><mat-icon style="font-size:14px">notes</mat-icon> Descripcion</div>
        <div class="desc-box">{{ data.reporte.descripcion }}</div>
      </div>

      <div class="section" *ngIf="grupos.length > 0">
        <div class="section-label"><mat-icon style="font-size:14px">groups</mat-icon> Grupos ({{ grupos.length }})</div>
        <div class="chips-row">
          <span class="chip-grupo" *ngFor="let g of grupos">{{ g.grupoNombre }}</span>
        </div>
      </div>

      <div class="section" *ngIf="ninios.length > 0">
        <div class="section-label"><mat-icon style="font-size:14px">child_care</mat-icon> Ninos ({{ ninios.length }})</div>
        <div class="chips-row">
          <span class="chip-ninio" *ngFor="let n of ninios">
            <span class="chip-avatar">
              @if(n.fotoUrl){
                <img [src]="n.fotoUrl" alt="Foto">
              } @else {
                {{ getReporteNinioIniciales(n) }}
              }
            </span>
            {{ n.ninioNombre }} {{ n.ninioApellido }}
          </span>
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

  get funcionarioFoto(): string | undefined {
    return this.data.reporte.funcionario?.fotoPerfil;
  }

  get funcionarioIniciales(): string {
    const f = this.data.reporte.funcionario;
    if (!f) return '?';
    return `${f.nombre?.[0] ?? ''}${f.apellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  getReporteNinioIniciales(n: { ninioNombre: string; ninioApellido: string }): string {
    return `${n.ninioNombre?.[0] ?? ''}${n.ninioApellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  formatFecha(f: string): string {
    if (!f) return '-';
    return new Date(f).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

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
    :host { display:block; }
    .reportes-page { padding:24px; max-width:1200px; margin:0 auto; }
    .topbar { background:#fff; border:1px solid #E0E4EC; border-radius:14px; padding:18px 22px; display:flex; align-items:center; justify-content:space-between; gap:16px; box-shadow:0 2px 8px rgba(21,101,192,.06); margin-bottom:18px; }
    .page-title { font-size:24px; font-weight:700; color:#1A1A2E; margin:0 0 4px; display:flex; align-items:center; gap:8px; }
    .page-title mat-icon { color:#1565C0; font-size:28px; width:28px; height:28px; }
    .subtitle { font-size:13px; color:#5C6680; margin:0; }
    .topbar-badge { display:inline-flex; align-items:center; gap:6px; border-radius:999px; background:#E3F2FD; color:#1565C0; padding:7px 12px; font-size:12px; font-weight:700; white-space:nowrap; }
    .topbar-badge mat-icon { font-size:16px; width:16px; height:16px; }
    .stats-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
    .stat-card { background:#fff; border:1px solid #E0E4EC; border-radius:12px; padding:14px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .stat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon.total { background:#E3F2FD; color:#1565C0; }
    .stat-icon.unread { background:#FFEBEE; color:#C62828; }
    .stat-icon.read { background:#E8F5E9; color:#2E7D32; }
    .stat-num { font-size:22px; line-height:1; font-weight:800; color:#1A1A2E; }
    .stat-label { font-size:12px; color:#5C6680; margin-top:4px; font-weight:600; }
    .filters-card { background:#fff; border:1px solid #E0E4EC; border-radius:12px; padding:14px 16px; margin-bottom:16px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .filters-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .search-bar { flex:1; min-width:240px; margin:0; }
    .tabs-row { display:flex; gap:4px; background:#F5F7FA; border-radius:10px; padding:4px; }
    .tab-btn { border:0; background:transparent; color:#5C6680; border-radius:8px; padding:8px 12px; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; }
    .tab-btn.active { background:#1565C0; color:white; box-shadow:0 1px 3px rgba(21,101,192,.25); }
    .tab-btn mat-icon { font-size:17px; width:17px; height:17px; }
    .results-count { margin:10px 0 0; font-size:12px; color:#9AA0B9; font-weight:600; }
    .spinner-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:64px; color:#5C6680; }
    .reportes-list { display:flex; flex-direction:column; gap:12px; }
    .reporte-card { border-radius:12px !important; border:1px solid #E0E4EC !important; box-shadow:none !important; transition:box-shadow .18s,border-color .18s,transform .18s; overflow:hidden; }
    .reporte-card:hover { box-shadow:0 5px 18px rgba(21,101,192,.12) !important; border-color:#90CAF9 !important; transform:translateY(-1px); }
    .reporte-card.unread { border-left:4px solid #EF4444 !important; }
    .card-content { padding:16px !important; }
    .card-header { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; }
    .reporte-main { display:flex; align-items:flex-start; gap:12px; min-width:0; }
    .reporte-icon { width:42px; height:42px; border-radius:10px; background:#E3F2FD; color:#1565C0; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .titulo { font-size:16px; font-weight:800; color:#1A1A2E; margin:0 0 4px; word-break:break-word; }
    .desc { color:#5C6680; font-size:13px; line-height:1.35; margin:6px 0 0; }
    .fecha { display:flex; align-items:center; gap:4px; font-size:12px; color:#9AA0B9; font-weight:600; }
    .fecha mat-icon { font-size:14px; width:14px; height:14px; }
    .badge-nuevo, .badge-leido { display:inline-flex; align-items:center; gap:4px; border-radius:999px; padding:3px 8px; font-size:10px; font-weight:800; margin-left:8px; vertical-align:middle; }
    .badge-nuevo { background:#EF4444; color:white; }
    .badge-leido { background:#E8F5E9; color:#2E7D32; }
    .funcionario-row { display:flex; align-items:center; gap:8px; font-size:13px; color:#5C6680; margin-top:10px; }
    .funcionario-avatar { width:24px; height:24px; border-radius:50%; background:#E3F2FD; color:#1565C0; display:flex; align-items:center; justify-content:center; overflow:hidden; font-size:9px; font-weight:800; flex-shrink:0; }
    .funcionario-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
    .chips-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
    .chip-grupo, .chip-ninio { display:inline-flex; align-items:center; gap:4px; border-radius:999px; padding:4px 10px; font-size:11px; font-weight:700; }
    .chip-grupo { background:#E8F5E9; color:#2E7D32; }
    .chip-ninio { background:#E3F2FD; color:#1565C0; }
    .chip-grupo mat-icon { font-size:13px; width:13px; height:13px; }
    .chip-avatar { width:20px; height:20px; border-radius:50%; background:#1565C0; color:white; display:inline-flex; align-items:center; justify-content:center; overflow:hidden; font-size:9px; font-weight:800; flex-shrink:0; }
    .chip-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
    .card-actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .btn-visto { color:#2E7D32 !important; border-color:#A5D6A7 !important; height:34px !important; line-height:34px !important; font-size:12px !important; font-weight:700 !important; }
    .btn-visto mat-icon { font-size:16px; width:16px; height:16px; }
    .ver-btn { flex-shrink:0; color:#1565C0; }
    .pdf-btn { flex-shrink:0; color:#C62828; }
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px 24px; color:#9AA0B9; background:#fff; border:1px dashed #CBD5E1; border-radius:12px; }
    .empty-state mat-icon { font-size:56px; width:56px; height:56px; color:#D0D4E3; }
    @media(max-width:760px) {
      .reportes-page { padding:16px; }
      .topbar { align-items:flex-start; flex-direction:column; }
      .stats-row { grid-template-columns:1fr; }
      .filters-row { align-items:stretch; }
      .tabs-row { width:100%; overflow:auto; }
      .tab-btn { flex:1; justify-content:center; white-space:nowrap; }
      .card-header { flex-direction:column; }
      .card-actions { width:100%; justify-content:flex-end; flex-wrap:wrap; }
    }
  `],
  template: `
    <div class="reportes-page">
      <header class="topbar">
        <div>
          <h1 class="page-title">
            <mat-icon>description</mat-icon>
            Reportes
          </h1>
          <p class="subtitle">Reportes generados por los funcionarios sobre tus ninos o sus grupos</p>
        </div>
        <span class="topbar-badge">
          <mat-icon>mark_email_unread</mat-icon>
          {{ sinLeer }} sin leer
        </span>
      </header>

      <div class="stats-row" *ngIf="!cargando">
        <div class="stat-card">
          <div class="stat-icon total"><mat-icon>folder</mat-icon></div>
          <div>
            <div class="stat-num">{{ reportes.length }}</div>
            <div class="stat-label">Total reportes</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon unread"><mat-icon>fiber_new</mat-icon></div>
          <div>
            <div class="stat-num">{{ sinLeer }}</div>
            <div class="stat-label">Sin leer</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon read"><mat-icon>task_alt</mat-icon></div>
          <div>
            <div class="stat-num">{{ leidos }}</div>
            <div class="stat-label">Vistos</div>
          </div>
        </div>
      </div>

      <div class="filters-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-bar" subscriptSizing="dynamic">
            <mat-label>Buscar reporte</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="busqueda" (ngModelChange)="aplicarFiltro()" placeholder="Titulo, nino, grupo...">
          </mat-form-field>

          <div class="tabs-row">
            <button class="tab-btn" [class.active]="filtroEstado === 'todos'" (click)="setFiltroEstado('todos')">
              <mat-icon>inbox</mat-icon> Todos
            </button>
            <button class="tab-btn" [class.active]="filtroEstado === 'sinLeer'" (click)="setFiltroEstado('sinLeer')">
              <mat-icon>mark_email_unread</mat-icon> Sin leer
            </button>
            <button class="tab-btn" [class.active]="filtroEstado === 'leidos'" (click)="setFiltroEstado('leidos')">
              <mat-icon>task_alt</mat-icon> Vistos
            </button>
          </div>
        </div>
        <p class="results-count">{{ filtrados.length }} reporte{{ filtrados.length !== 1 ? 's' : '' }}</p>
      </div>

      <div class="spinner-wrap" *ngIf="cargando">
        <mat-spinner diameter="44"></mat-spinner>
        <span>Cargando reportes...</span>
      </div>

      <ng-container *ngIf="!cargando">
        <div *ngIf="filtrados.length === 0" class="empty-state">
          <mat-icon>folder_open</mat-icon>
          <p>No hay reportes disponibles con el filtro seleccionado</p>
        </div>

        <div class="reportes-list">
          <mat-card
            class="reporte-card"
            [class.unread]="!r.visto"
            *ngFor="let r of filtrados">
            <mat-card-content class="card-content">
              <div class="card-header">
                <div class="reporte-main">
                  <div class="reporte-icon"><mat-icon>description</mat-icon></div>
                  <div>
                    <div class="titulo">
                      {{ r.titulo }}
                      <span class="badge-nuevo" *ngIf="!r.visto"><mat-icon style="font-size:11px;width:11px;height:11px">fiber_new</mat-icon> NUEVO</span>
                      <span class="badge-leido" *ngIf="r.visto"><mat-icon style="font-size:11px;width:11px;height:11px">task_alt</mat-icon> VISTO</span>
                    </div>
                    <div class="fecha">
                      <mat-icon>calendar_today</mat-icon>
                      {{ formatFecha(r.fechaGeneracion) }}
                    </div>
                    <p class="desc" *ngIf="r.descripcion">{{ r.descripcion | slice:0:120 }}{{ r.descripcion.length > 120 ? '...' : '' }}</p>

                    <div class="funcionario-row">
                      <span class="funcionario-avatar">
                        @if(getFuncionarioFoto(r)){
                          <img [src]="getFuncionarioFoto(r)" alt="Foto de perfil">
                        } @else {
                          {{ getFuncionarioIniciales(r) }}
                        }
                      </span>
                      {{ getNombreFuncionario(r) }}
                    </div>
                  </div>
                </div>

                <div class="card-actions">
                  <button mat-icon-button class="pdf-btn" matTooltip="Descargar PDF"
                    (click)="exportarPDF(r.id)">
                    <mat-icon>picture_as_pdf</mat-icon>
                  </button>
                  <button mat-icon-button class="ver-btn" matTooltip="Ver detalle"
                    (click)="verDetalle(r)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </div>
              </div>

              <div class="chips-row" *ngIf="(r.grupos?.length ?? 0) + (r.ninios?.length ?? 0) > 0">
                <span class="chip-grupo" *ngFor="let g of (r.grupos ?? [])">
                  <mat-icon>groups</mat-icon> {{ g.grupoNombre }}
                </span>
                <span class="chip-ninio" *ngFor="let n of (r.ninios ?? [])">
                  <span class="chip-avatar">
                    @if(n.fotoUrl){
                      <img [src]="n.fotoUrl" alt="Foto">
                    } @else {
                      {{ getReporteNinioIniciales(n) }}
                    }
                  </span>
                  {{ n.ninioNombre }} {{ n.ninioApellido }}
                </span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </div>
  `
})
export class ReportesResponsableComponent implements OnInit {
  reportes: ReporteResponsableItem[] = [];
  filtrados: ReporteResponsableItem[] = [];
  cargando = true;
  busqueda = '';
  filtroEstado: 'todos' | 'sinLeer' | 'leidos' = 'todos';
  responsableId: number | null = null;

  constructor(
    private auth: AuthService,
    private reporteService: ReporteService,
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
    this.reporteService.listarPorResponsable(this.responsableId)
      .pipe(finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (data) => { this.reportes = data; this.aplicarFiltro(); },
        error: () => this.toast.error('Error al cargar reportes')
      });
  }

  aplicarFiltro() {
    let resultado = [...this.reportes];

    if (this.filtroEstado === 'sinLeer') {
      resultado = resultado.filter(r => !r.visto);
    }
    if (this.filtroEstado === 'leidos') {
      resultado = resultado.filter(r => r.visto);
    }

    if (!this.busqueda.trim()) {
      this.filtrados = resultado;
      return;
    }

    const b = this.busqueda.toLowerCase();
    this.filtrados = resultado.filter(r =>
      r.titulo.toLowerCase().includes(b) ||
      r.descripcion?.toLowerCase().includes(b) ||
      (r.grupos ?? []).some(g => g.grupoNombre.toLowerCase().includes(b)) ||
      (r.ninios ?? []).some(n => `${n.ninioNombre} ${n.ninioApellido}`.toLowerCase().includes(b))
    );
  }

  setFiltroEstado(filtro: 'todos' | 'sinLeer' | 'leidos') {
    this.filtroEstado = filtro;
    this.aplicarFiltro();
  }

  marcarComoVisto(r: ReporteResponsableItem, mostrarToast = true) {
    if (r.visto || r.marcandoVisto || !this.responsableId) return;
    r.marcandoVisto = true;
    this.reporteService.marcarVisto(r.id, this.responsableId).pipe(
      finalize(() => {
        r.marcandoVisto = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        r.visto = true;
        this.aplicarFiltro();
        if (mostrarToast) this.toast.success('Reporte marcado como visto');
      },
      error: () => this.toast.error('No se pudo marcar el reporte como visto')
    });
  }

  verDetalle(r: ReporteResponsableItem) {
    if (!r.visto) {
      this.marcarComoVisto(r, false);
    }
    this.dialog.open(ReporteResponsableDetalleDialogComponent, {
      data: { reporte: r },
      width: '580px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
  }

  exportarPDF(id: number) {
    this.reporteService.exportarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('PDF descargado');
      },
      error: () => this.toast.error('No se pudo exportar el PDF')
    });
  }

  getNombreFuncionario(r: ReporteResponse): string {
    if (r.funcionario) return `${r.funcionario.nombre} ${r.funcionario.apellido}`;
    return r.funcionarioNombre ?? '-';
  }

  getFuncionarioFoto(r: ReporteResponse): string | undefined {
    return r.funcionario?.fotoPerfil;
  }

  getFuncionarioIniciales(r: ReporteResponse): string {
    if (r.funcionario) return `${r.funcionario.nombre?.[0] ?? ''}${r.funcionario.apellido?.[0] ?? ''}`.toUpperCase() || '?';
    return r.funcionarioNombre
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase() || '?';
  }

  getReporteNinioIniciales(n: { ninioNombre: string; ninioApellido: string }): string {
    return `${n.ninioNombre?.[0] ?? ''}${n.ninioApellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  formatFecha(f: string): string {
    if (!f) return '-';
    return new Date(f).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get sinLeer() { return this.reportes.filter(r => !r.visto).length; }
  get leidos() { return this.reportes.filter(r => r.visto).length; }
}
