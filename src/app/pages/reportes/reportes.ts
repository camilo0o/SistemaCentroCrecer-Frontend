import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { ToastService } from '../../services/toast.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { AuthService } from '../../services/auth.service';
import { ReporteService } from '../../services/reporte.service';
import { environment } from '../../../environments/environment';
import { ReporteRequest, ReporteResponse, FuncionarioResponse, NinioResponse, GrupoResponse } from '../../models/models';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

// ---- Crear Reporte Dialog ----
@Component({
  selector: 'app-reporte-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatChipsModule, MatCheckboxModule
  ],
  styles: [`
    .dialog-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px 0; }
    .dialog-title { margin:0; font-size:18px; font-weight:600; color:#1565C0; }
    .section-label { font-size:13px; font-weight:600; color:#5C6680; margin:8px 0 4px; text-transform:uppercase; letter-spacing:.5px; }
    .chips-selected { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
    .chip-item { background:#E3F2FD; color:#1565C0; border-radius:16px; padding:4px 12px; font-size:12px; font-weight:500; display:flex; align-items:center; gap:4px; }
    .chip-item mat-icon { font-size:14px; width:14px; height:14px; cursor:pointer; }
    .dialog-actions { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px; }
    .empty-sel { font-size:12px; color:#9AA0B9; font-style:italic; }
  `],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.reporte ? 'Editar Reporte' : 'Nuevo Reporte' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:16px 24px;min-width:560px;max-height:70vh;overflow-y:auto">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:12px">
        <mat-form-field appearance="outline">
          <mat-label>Título del reporte</mat-label>
          <input matInput formControlName="titulo">
          @if(form.get('titulo')?.invalid && form.get('titulo')?.touched){<mat-error>Requerido (mín. 3 caracteres)</mat-error>}
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="4" placeholder="Detallá el contenido del reporte..."></textarea>
        </mat-form-field>

        <!-- Selección de Grupos -->
        <div>
          <div class="section-label">
            <mat-icon style="font-size:16px;vertical-align:middle;margin-right:4px">groups</mat-icon>
            Grupos asociados
          </div>
          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>Seleccionar grupos</mat-label>
            <mat-select multiple [(ngModel)]="gruposSeleccionados" [ngModelOptions]="{standalone:true}">
              @for(g of grupos; track g.id){
                <mat-option [value]="g.id">{{ g.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <div class="chips-selected" *ngIf="gruposSeleccionados.length > 0">
            @for(gId of gruposSeleccionados; track gId){
              <span class="chip-item">
                <mat-icon>group</mat-icon>{{ getGrupoNombre(gId) }}
                <mat-icon (click)="quitarGrupo(gId)">close</mat-icon>
              </span>
            }
          </div>
          <p class="empty-sel" *ngIf="gruposSeleccionados.length === 0">Sin grupos seleccionados</p>
        </div>

        <!-- Selección de Niños -->
        <div>
          <div class="section-label">
            <mat-icon style="font-size:16px;vertical-align:middle;margin-right:4px">child_care</mat-icon>
            Niños asociados
          </div>
          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>Buscar y seleccionar niños</mat-label>
            <mat-select multiple [(ngModel)]="niniosSeleccionados" [ngModelOptions]="{standalone:true}">
              @for(n of niniosFiltrados; track n.id){
                <mat-option [value]="n.id">{{ n.nombre }} {{ n.apellido }}
                  @if(n.grupo){ <span style="color:#9AA0B9;font-size:11px"> · {{ n.grupo.nombre }}</span> }
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
          <div class="chips-selected" *ngIf="niniosSeleccionados.length > 0">
            @for(nId of niniosSeleccionados; track nId){
              <span class="chip-item">
                <mat-icon>face</mat-icon>{{ getNinioNombre(nId) }}
                <mat-icon (click)="quitarNinio(nId)">close</mat-icon>
              </span>
            }
          </div>
          <p class="empty-sel" *ngIf="niniosSeleccionados.length === 0">Sin niños seleccionados</p>
        </div>
      </form>
    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white" (click)="guardar()" [disabled]="guardando">
        @if(guardando){<mat-spinner diameter="18" color="accent"></mat-spinner>}
        @else{ {{ data.reporte ? 'Guardar cambios' : 'Crear Reporte' }} }
      </button>
    </div>
  `
})
export class ReporteDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  grupos: GrupoResponse[] = [];
  ninios: NinioResponse[] = [];
  niniosFiltrados: NinioResponse[] = [];
  gruposSeleccionados: number[] = [];
  niniosSeleccionados: number[] = [];

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<ReporteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { funcionarioId: number; reporte?: ReporteResponse },
    private http: HttpClient,
    private reporteService: ReporteService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      titulo: [data.reporte?.titulo ?? '', [Validators.required, Validators.minLength(3)]],
      descripcion: [data.reporte?.descripcion ?? '']
    });
  }

  ngOnInit() {
    forkJoin({
      grupos: this.http.get<GrupoResponse[]>(`${environment.apiUrl}/grupos/activos`),
      ninios: this.http.get<NinioResponse[]>(`${environment.apiUrl}/ninios`)
    }).subscribe({
      next: ({ grupos, ninios }) => {
        this.grupos = grupos;
        this.ninios = ninios.filter(n => n.activo !== false);
        this.niniosFiltrados = this.ninios;

        // Pre-cargar selecciones si estamos editando
        if (this.data.reporte) {
          this.gruposSeleccionados = (this.data.reporte.grupos ?? []).map(g => g.grupoId);
          this.niniosSeleccionados = (this.data.reporte.ninios ?? []).map(n => n.ninioId);
        }
        // Forzar detección de cambios para evitar ExpressionChangedAfterItHasBeenChecked
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Error al cargar datos')
    });
  }

  getGrupoNombre(id: number): string {
    return this.grupos.find(g => g.id === id)?.nombre ?? String(id);
  }

  getNinioNombre(id: number): string {
    const n = this.ninios.find(n => n.id === id);
    return n ? `${n.nombre} ${n.apellido}` : String(id);
  }

  quitarGrupo(id: number) { this.gruposSeleccionados = this.gruposSeleccionados.filter(g => g !== id); }
  quitarNinio(id: number) { this.niniosSeleccionados = this.niniosSeleccionados.filter(n => n !== id); }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const payload: ReporteRequest = {
      ...this.form.value,
      funcionarioId: this.data.funcionarioId,
      gruposIds: this.gruposSeleccionados,
      niniosIds: this.niniosSeleccionados
    };

    const req = this.data.reporte
      ? this.reporteService.actualizar(this.data.reporte.id, payload)
      : this.reporteService.crear(payload);

    req.subscribe({
      next: (r) => { this.guardando = false; this.ref.close(r); },
      error: (err) => { this.guardando = false; this.toast.error(err.error?.error ?? 'Error al guardar reporte'); }
    });
  }
}

// ---- Ver Detalle Dialog ----
@Component({
  selector: 'app-reporte-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatChipsModule, MatProgressSpinnerModule
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
    .meta-row { display:flex; gap:24px; font-size:13px; color:#5C6680; flex-wrap:wrap; }
    .meta-item { display:flex; flex-direction:column; gap:2px; }
    .meta-key { font-size:11px; text-transform:uppercase; letter-spacing:.4px; }
    .meta-val { font-weight:500; color:#1a2340; }
    .desc-box { background:#F5F7FA; border-radius:8px; padding:12px; font-size:13px; color:#3a4060; white-space:pre-wrap; }
    .dialog-actions { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px; }
    .generado-por { display:flex; align-items:center; gap:10px; background:#F0F4FF; border-radius:10px; padding:10px 14px; margin-bottom:16px; }
    .generado-por mat-icon { color:#1565C0; }
    .generado-por-label { font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:#5C6680; }
    .generado-por-nombre { font-size:14px; font-weight:600; color:#1a2340; }
  `],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">{{ data.reporte.titulo }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:16px 24px;min-width:520px;max-height:65vh;overflow-y:auto">

      <!-- Generado por (destacado) -->
      <div class="generado-por">
        <mat-icon>account_circle</mat-icon>
        <div>
          <div class="generado-por-label">Generado por</div>
          <div class="generado-por-nombre">{{ data.reporte.funcionario ? (data.reporte.funcionario.nombre + ' ' + data.reporte.funcionario.apellido) : (data.reporte.funcionarioNombre ?? '—') }}</div>
        </div>
      </div>

      <div class="meta-row" style="margin-bottom:16px">
        <div class="meta-item">
          <span class="meta-key">Fecha</span>
          <span class="meta-val">{{ formatFecha(data.reporte.fechaGeneracion) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-key">Estado</span>
          <span class="meta-val" [style.color]="data.reporte.activo ? '#2E7D32' : '#C62828'">
            {{ data.reporte.activo ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
      </div>

      <div class="section" *ngIf="data.reporte.descripcion">
        <div class="section-label"><mat-icon style="font-size:14px">notes</mat-icon> Descripción</div>
        <div class="desc-box">{{ data.reporte.descripcion }}</div>
      </div>

      <div class="section">
        <div class="section-label"><mat-icon style="font-size:14px">groups</mat-icon> Grupos ({{ grupos.length }})</div>
        <div class="chips-row" *ngIf="grupos.length > 0">
          <span class="chip-grupo" *ngFor="let g of grupos">{{ g.grupoNombre }}</span>
        </div>
        <p class="empty-label" *ngIf="grupos.length === 0">Sin grupos asociados</p>
      </div>

      <div class="section">
        <div class="section-label"><mat-icon style="font-size:14px">child_care</mat-icon> Niños ({{ ninios.length }})</div>
        <div class="chips-row" *ngIf="ninios.length > 0">
          <span class="chip-ninio" *ngFor="let n of ninios">{{ n.ninioNombre }} {{ n.ninioApellido }}</span>
        </div>
        <p class="empty-label" *ngIf="ninios.length === 0">Sin niños asociados</p>
      </div>

    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cerrar</button>
    </div>
  `
})
export class ReporteDetalleDialogComponent {
  constructor(
    public ref: MatDialogRef<ReporteDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reporte: ReporteResponse }
  ) {}

  get grupos() { return this.data.reporte.grupos ?? []; }
  get ninios() { return this.data.reporte.ninios ?? []; }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

// ---- Main Component ----
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, Sidebar,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatChipsModule, MatTooltipModule,
    MatProgressSpinnerModule, MatPaginatorModule, MatTabsModule, MatCardModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class ReportesComponent implements OnInit {
  reportes: ReporteResponse[] = [];
  filtrados: ReporteResponse[] = [];
  pagina: ReporteResponse[] = [];
  funcionarios: FuncionarioResponse[] = [];
  cargando = true;
  busqueda = '';
  filtroFuncionario = '';
  columnas = ['titulo', 'asociaciones', 'funcionario', 'fecha', 'estado', 'acciones'];
  pageSize = 10;
  pageIndex = 0;
  userId: number | null = null;

  constructor(
    private auth: AuthService,
    private funcionarioService: FuncionarioService,
    private reporteService: ReporteService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.userId = this.auth.getUserId();
    this.funcionarioService.listarTodos().subscribe(f => this.funcionarios = f);
    this.cargarReportes();
  }

  cargarReportes() {
    this.cargando = true;
    this.reporteService.listarTodos().pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (r) => { this.reportes = r; this.aplicarFiltros(); },
      error: () => { this.toast.error('Error al cargar reportes'); }
    });
  }

  aplicarFiltros() {
    let res = [...this.reportes];
    if (this.busqueda) {
      const b = this.busqueda.toLowerCase();
      res = res.filter(r =>
        r.titulo.toLowerCase().includes(b) ||
        r.descripcion?.toLowerCase().includes(b) ||
        (r.grupos ?? []).some(g => g.grupoNombre.toLowerCase().includes(b)) ||
        (r.ninios ?? []).some(n => `${n.ninioNombre} ${n.ninioApellido}`.toLowerCase().includes(b))
      );
    }
    if (this.filtroFuncionario) res = res.filter(r =>
      String(r.funcionario?.id ?? r.funcionarioId) === this.filtroFuncionario
    );
    this.filtrados = res;
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  actualizarPagina() {
    const s = this.pageIndex * this.pageSize;
    this.pagina = this.filtrados.slice(s, s + this.pageSize);
  }

  onPage(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.actualizarPagina(); }

  abrirCrear() {
    const ref = this.dialog.open(ReporteDialogComponent, {
      data: { funcionarioId: this.userId ?? 0 },
      width: '640px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Reporte creado'); this.cargarReportes(); } });
  }

  abrirEditar(reporte: ReporteResponse) {
    const ref = this.dialog.open(ReporteDialogComponent, {
      data: { funcionarioId: this.userId ?? 0, reporte },
      width: '640px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Reporte actualizado'); this.cargarReportes(); } });
  }

  verDetalle(reporte: ReporteResponse) {
    this.dialog.open(ReporteDetalleDialogComponent, {
      data: { reporte },
      width: '600px',
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
        a.href = url; a.download = `reporte-${id}.pdf`; a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('PDF descargado');
      },
      error: () => this.toast.error('No se pudo exportar el PDF')
    });
  }

  darDeBaja(id: number) {
    this.reporteService.darDeBaja(id).subscribe({
      next: () => { this.toast.success('Reporte dado de baja'); this.cargarReportes(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error')
    });
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getFuncionarioNombre(r: ReporteResponse): string {
    if (r.funcionario) return `${r.funcionario.nombre} ${r.funcionario.apellido}`;
    if (r.funcionarioNombre) return r.funcionarioNombre;
    if (r.funcionarioId) {
      const f = this.funcionarios.find(fu => fu.id === r.funcionarioId);
      return f ? `${f.nombre} ${f.apellido}` : '—';
    }
    return '—';
  }

  getGruposResumen(r: ReporteResponse): string {
    const gs = r.grupos ?? [];
    if (gs.length === 0) return '';
    if (gs.length <= 2) return gs.map(g => g.grupoNombre).join(', ');
    return `${gs[0].grupoNombre}, ${gs[1].grupoNombre} +${gs.length - 2}`;
  }

  getNiniosResumen(r: ReporteResponse): string {
    const ns = r.ninios ?? [];
    if (ns.length === 0) return '';
    if (ns.length <= 2) return ns.map(n => `${n.ninioNombre} ${n.ninioApellido}`).join(', ');
    return `${ns[0].ninioNombre}, ${ns[1].ninioNombre} +${ns.length - 2}`;
  }

  get totalActivos() { return this.reportes.filter(r => r.activo).length; }
}
