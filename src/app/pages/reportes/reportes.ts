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
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { ToastService } from '../../services/toast.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { ReporteResponse, FuncionarioResponse } from '../../models/models';
import { finalize } from 'rxjs/operators';

// Crear Reporte Dialog
@Component({
  selector: 'app-reporte-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <h2 class="dialog-title">Nuevo Reporte</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>
    <mat-dialog-content style="padding:24px;min-width:500px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:16px">
        <mat-form-field appearance="outline">
          <mat-label>Título del reporte</mat-label>
          <input matInput formControlName="titulo">
          @if(form.get('titulo')?.invalid && form.get('titulo')?.touched){<mat-error>Requerido</mat-error>}
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="4" placeholder="Detallá el contenido del reporte..."></textarea>
          @if(form.get('descripcion')?.invalid && form.get('descripcion')?.touched){<mat-error>Requerida</mat-error>}
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <div class="dialog-actions">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white" (click)="guardar()" [disabled]="guardando">
        @if(guardando){<mat-spinner diameter="18" color="accent"></mat-spinner>}@else{Crear Reporte}
      </button>
    </div>
  `
})
export class ReporteDialogComponent {
  form: FormGroup;
  guardando = false;
  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<ReporteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { funcionarioId: number },
    private http: HttpClient,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }
  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const payload = { ...this.form.value, funcionarioId: this.data.funcionarioId };
    this.http.post(`${environment.apiUrl}/reportes`, payload).subscribe({
      next: (r) => { this.guardando = false; this.ref.close(r); },
      error: (err) => { this.guardando = false; this.toast.error(err.error?.error ?? 'Error al crear reporte'); }
    });
  }
}

// Main
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
  columnas = ['titulo', 'funcionario', 'fecha', 'estado', 'acciones'];
  pageSize = 10;
  pageIndex = 0;
  userId: number | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private funcionarioService: FuncionarioService,
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
    this.http.get<ReporteResponse[]>(`${environment.apiUrl}/reportes`).pipe(
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
      res = res.filter(r => r.titulo.toLowerCase().includes(b) || r.descripcion?.toLowerCase().includes(b));
    }
    if (this.filtroFuncionario) res = res.filter(r => String(r.funcionarioId) === this.filtroFuncionario);
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
    const ref = this.dialog.open(ReporteDialogComponent, { data: { funcionarioId: this.userId } });
    ref.afterClosed().subscribe(r => { if (r) { this.toast.success('Reporte creado'); this.cargarReportes(); } });
  }

  exportarPDF(id: number) {
    this.http.get(`${environment.apiUrl}/reportes/${id}/pdf`, { responseType: 'blob' }).subscribe({
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

  exportarExcel(id: number) {
    this.http.get(`${environment.apiUrl}/reportes/${id}/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `reporte-${id}.xlsx`; a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Excel descargado');
      },
      error: () => this.toast.error('No se pudo exportar el Excel')
    });
  }

  darDeBaja(id: number) {
    this.http.delete(`${environment.apiUrl}/reportes/${id}`).subscribe({
      next: () => { this.toast.success('Reporte dado de baja'); this.cargarReportes(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error')
    });
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-UY', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  getFuncionarioNombre(id: number): string {
    const f = this.funcionarios.find(fu => fu.id === id);
    return f ? `${f.nombre} ${f.apellido}` : '—';
  }

  get totalActivos() { return this.reportes.filter(r => r.activo).length; }
}