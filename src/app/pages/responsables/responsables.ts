import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs/operators';
import { ResponsableResponse, ResponsableNinioResponse, ResponsableNinioRequest } from '../../models/models';
import { ResponsableService } from '../../services/responsable.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-retiro-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatProgressSpinnerModule
  ],
  styles: [`
    .dlg-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 20px 24px 0;
    }
    .dlg-title { margin: 0; font-size: 18px; font-weight: 700; color: #1565C0; }
    .dlg-subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    .dlg-body { padding: 16px 24px; }
    .ninio-info {
      background: #F0F4FF; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 12px;
    }
    .ninio-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: #1565C0; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; flex-shrink: 0; overflow: hidden;
    }
    .ninio-avatar img {
      width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;
    }
    .ninio-nombre { font-weight: 600; font-size: 14px; color: #1a2340; }
    .ninio-cedula { font-size: 12px; color: #6b7280; }
    mat-form-field { width: 100%; }
    .toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      background: #F9FAFB; border-radius: 10px; padding: 14px 16px; margin-top: 4px;
    }
    .toggle-label { font-size: 14px; font-weight: 500; color: #374151; }
    .toggle-desc { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .dlg-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 12px 24px; border-top: 1px solid #f0f2f7;
    }
    .btn-guardar-retiro { display: inline-flex !important; align-items: center; justify-content: center; gap: 6px; }
    .btn-guardar-retiro mat-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; font-size: 18px; line-height: 18px; margin: 0; }
    ::ng-deep .btn-guardar-retiro .mdc-button__label { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  `],
  template: `
    <div class="dlg-header">
      <div>
        <h2 class="dlg-title">Autorización de retiro</h2>
        <p class="dlg-subtitle">{{ data.responsable.nombre }} {{ data.responsable.apellido }}</p>
      </div>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <div class="dlg-body">
      <div class="ninio-info">
        <div class="ninio-avatar" [style.background]="data.relacion.ninio.fotoUrl ? 'transparent' : '#1565C0'">
          @if(data.relacion.ninio.fotoUrl){
            <img [src]="data.relacion.ninio.fotoUrl" alt="Foto">
          } @else {
            {{ data.relacion.ninio.nombre[0] }}{{ data.relacion.ninio.apellido[0] }}
          }
        </div>
        <div>
          <div class="ninio-nombre">{{ data.relacion.ninio.nombre }} {{ data.relacion.ninio.apellido }}</div>
          <div class="ninio-cedula">CI {{ data.relacion.ninio.cedula }}</div>
        </div>
      </div>

      <form [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de relación</mat-label>
          <mat-icon matPrefix>family_restroom</mat-icon>
          <mat-select formControlName="tipoRelacion">
            <mat-option value="PADRE">Padre</mat-option>
            <mat-option value="MADRE">Madre</mat-option>
            <mat-option value="ABUELO">Abuelo/a</mat-option>
            <mat-option value="TIO">Tío/a</mat-option>
            <mat-option value="HERMANO">Hermano/a</mat-option>
            <mat-option value="TUTOR">Tutor legal</mat-option>
            <mat-option value="OTRO">Otro</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="toggle-row">
          <div>
            <div class="toggle-label">Autorizado para retirar</div>
            <div class="toggle-desc">Permite a este responsable retirar al niño del centro</div>
          </div>
          <mat-slide-toggle formControlName="autorizadoRetiro" color="primary"></mat-slide-toggle>
        </div>
      </form>
    </div>

    <div class="dlg-footer">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button color="primary" class="btn-guardar-retiro" (click)="guardar()" [disabled]="cargando">
        @if(cargando) { <mat-spinner diameter="18"></mat-spinner> }
        @else { <mat-icon>save</mat-icon> Guardar }
      </button>
    </div>
  `
})
export class RetiroDialogComponent {
  form: FormGroup;
  cargando = false;

  constructor(
    public ref: MatDialogRef<RetiroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      relacion: ResponsableNinioResponse;
      responsable: ResponsableResponse;
    },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      tipoRelacion:     [data.relacion.tipoRelacion || '', Validators.required],
      autorizadoRetiro: [data.relacion.autorizadoRetiro ?? false]
    });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.ref.close(this.form.value);
  }
}


@Component({
  selector: 'app-responsables',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatToolbarModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatDialogModule,
    MatTooltipModule, MatDividerModule, MatExpansionModule,
    MatSlideToggleModule,
    Sidebar
  ],
  templateUrl: './responsables.html',
  styleUrl: './responsables.css'
})
export class ResponsablesComponent implements OnInit {
  responsables: ResponsableResponse[] = [];
  relaciones: ResponsableNinioResponse[] = [];
  cargando = true;
  busqueda = '';
  mostrarInactivos = false;
  esAdmin = false;        // puede activar/desactivar
  esAdminSistema = false; // ve todos (activos + inactivos)

  constructor(
    private responsableService: ResponsableService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const rol = this.authService.getRol() ?? '';
    const ROLES_GESTION = [
      'ADMINISTRADOR_SISTEMA', 'COORDINADORA', 'ASISTENTE_SOCIAL', 'PSICOLOGO'
    ];
    this.esAdmin = ROLES_GESTION.includes(rol);
    this.esAdminSistema = rol === 'ADMINISTRADOR_SISTEMA';
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    const lista$ = this.esAdminSistema
      ? this.responsableService.listarTodos()
      : this.responsableService.listarActivos();

    forkJoin({
      responsables: lista$,
      relaciones: this.responsableService.listarRelaciones()
    }).pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: ({ responsables, relaciones }) => {
        this.responsables = responsables;
        this.relaciones = relaciones;
      },
      error: () => {}
    });
  
  }

  get responsablesFiltrados(): ResponsableResponse[] {
    const q = this.busqueda.toLowerCase().trim();
    let lista = this.responsables;
    if (!this.esAdminSistema || !this.mostrarInactivos) {
      lista = lista.filter(r => r.activo);
    }
    if (!q) return lista;
    return lista.filter(r =>
      `${r.nombre} ${r.apellido}`.toLowerCase().includes(q) ||
      r.cedula.includes(q) ||
      r.email?.toLowerCase().includes(q)
    );
  }

  relacionesDe(responsableId: number): ResponsableNinioResponse[] {
    return this.relaciones.filter(rel => rel.responsable?.id === responsableId);
  }

  iniciales(r: ResponsableResponse): string {
    return `${r.nombre[0]}${r.apellido[0]}`.toUpperCase();
  }

  toggleEstado(r: ResponsableResponse) {
    const accion$ = r.activo
      ? this.responsableService.desactivar(r.id)
      : this.responsableService.activar(r.id);

    accion$.subscribe({
      next: () => {
        r.activo = !r.activo;
        const msg = r.activo ? 'Responsable activado.' : 'Responsable desactivado.';
        this.toast.success(msg);
      },
      error: err => this.toast.error(err.error?.error || 'Error al cambiar estado.')
    });
  }

  abrirEdicion(responsable: ResponsableResponse, relacion: ResponsableNinioResponse) {
    const ref = this.dialog.open(RetiroDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'app-dialog-panel',
      disableClose: true,
      data: { relacion, responsable }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const payload: ResponsableNinioRequest = {
        ninioId:         relacion.ninio.id,
        responsableId:   responsable.id,
        tipoRelacion:    result.tipoRelacion,
        autorizadoRetiro: result.autorizadoRetiro
      };
      this.responsableService.actualizarRelacion(relacion.id, payload).subscribe({
        next: updated => {
          const idx = this.relaciones.findIndex(r => r.id === relacion.id);
          if (idx !== -1) this.relaciones[idx] = updated;
          this.toast.success('Autorización actualizada correctamente.');
        },
        error: err => this.toast.error(err.error?.error || 'Error al actualizar.')
      });
    });
  }
}
