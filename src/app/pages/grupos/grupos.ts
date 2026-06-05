import { Component, OnInit, Inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { GrupoService } from '../../services/grupo.service';
import { NinioService } from '../../services/ninio.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { ToastService } from '../../services/toast.service';
import { CondicionMedicaResponse, GrupoResponse, GrupoRequest, NinioResponse, FuncionarioResponse, ROL_DISPLAY } from '../../models/models';
import { NinioCrearDialogComponent, NinioEditarDialogComponent, NinioDetalleDialogComponent } from '../ninios/ninios';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

type VistaGestion = 'grupos' | 'ninios';

// ─── Dialog: Todos los niños del grupo ────────────────────────────────────────
@Component({
  selector: 'app-ninios-grupo-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatChipsModule, MatTooltipModule
  ],
  styles: [`
    .dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px 0;
    }
    .dialog-title { margin: 0; font-size: 18px; font-weight: 600; }
    .dialog-subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    .search-wrap { padding: 12px 24px 0; }
    .search-input {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #e0e0e0; border-radius: 8px;
      padding: 8px 12px 8px 36px; font-size: 14px; outline: none;
      background: #f9fafb url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%239ca3af' d='M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'/%3E%3C/svg%3E") no-repeat 10px center;
    }
    .search-input:focus { border-color: #1565C0; background-color: #fff; }
    .ninios-scroll { padding: 12px 24px 8px; max-height: 60vh; overflow-y: auto; }
    .ninio-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
      border: 1px solid #f0f2f7; transition: background .15s;
    }
    .ninio-row:hover { background: #f5f7ff; }
    .ninio-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; flex-shrink: 0;
    }
    .ninio-info { flex: 1; min-width: 0; }
    .ninio-nombre { display: block; font-weight: 600; font-size: 14px; color: #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ninio-sub { display: block; font-size: 12px; color: #6b7280; }
    .ninio-status { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 12px; }
    .ninio-status.activo { background: #e8f5e9; color: #2e7d32; }
    .ninio-status.inactivo { background: #fce4e4; color: #c62828; }
    .empty-ninios { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 0; color: #9ca3af; }
    .footer { display: flex; justify-content: flex-end; padding: 12px 24px; border-top: 1px solid #f0f2f7; }
    .count-badge { background: #e3f2fd; color: #1565C0; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 12px; margin-left: 8px; }
  `],
  template: `
    <div class="dialog-header">
      <div>
        <h2 class="dialog-title" [style.color]="data.color">
          {{ data.grupo.nombre }}
          <span class="count-badge">{{ filtrados.length }} niño{{ filtrados.length !== 1 ? 's' : '' }}</span>
        </h2>
        <p class="dialog-subtitle">{{ data.rangoLabel }}</p>
      </div>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <div class="search-wrap">
      <input class="search-input" type="text" placeholder="Buscar por nombre o cédula..."
             [(ngModel)]="busqueda" (ngModelChange)="filtrar()">
    </div>

    <div class="ninios-scroll">
      @if(filtrados.length === 0){
        <div class="empty-ninios">
          <mat-icon style="font-size:36px;width:36px;height:36px">child_care</mat-icon>
          <span>{{ busqueda ? 'Sin resultados para "' + busqueda + '"' : 'Sin niños en este grupo' }}</span>
        </div>
      }
      @for(ninio of filtrados; track ninio.id){
        <div class="ninio-row">
          <div class="ninio-avatar" [style.background]="data.bg" [style.color]="data.color">
            {{ ninio.nombre[0] }}{{ ninio.apellido?.[0] ?? '' }}
          </div>
          <div class="ninio-info">
            <span class="ninio-nombre">{{ ninio.nombre }} {{ ninio.apellido }}</span>
            <span class="ninio-sub">CI: {{ ninio.cedula }} · {{ formatFecha(ninio.fechaNacimiento) }}</span>
          </div>
          <span class="ninio-status" [class.activo]="ninio.activo" [class.inactivo]="!ninio.activo">
            {{ ninio.activo ? 'Activo' : 'Inactivo' }}
          </span>
          <button mat-icon-button matTooltip="Ver detalle" (click)="verDetalle(ninio)">
            <mat-icon style="font-size:18px;color:#1565C0">info_outline</mat-icon>
          </button>
        </div>
      }
    </div>

    <div class="footer">
      <button mat-flat-button style="background:#1565C0;color:white" (click)="ref.close()">Cerrar</button>
    </div>
  `
})
export class NiniosGrupoDialogComponent {
  busqueda = '';
  filtrados: NinioResponse[];

  constructor(
    public ref: MatDialogRef<NiniosGrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      grupo: GrupoResponse;
      color: string;
      bg: string;
      rangoLabel: string;
    },
    private dialog: MatDialog
  ) {
    this.filtrados = [...(data.grupo.ninios ?? [])];
  }

  filtrar() {
    const t = this.busqueda.trim().toLowerCase();
    const ninios = this.data.grupo.ninios ?? [];
    this.filtrados = t
      ? ninios.filter(n => `${n.nombre} ${n.apellido} ${n.cedula}`.toLowerCase().includes(t))
      : [...ninios];
  }

  formatFecha(f?: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  verDetalle(ninio: NinioResponse) {
    this.dialog.open(NinioDetalleDialogComponent, {
      data: { ninio },
      width: '600px',
      maxWidth: '96vw',
      panelClass: 'detalle-dialog'
    });
  }
}

// ─── Dialog: Todos los funcionarios del grupo ─────────────────────────────────
@Component({
  selector: 'app-funcionarios-grupo-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule
  ],
  styles: [`
    .dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px 0;
    }
    .dialog-title { margin: 0; font-size: 18px; font-weight: 600; }
    .dialog-subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    .search-wrap { padding: 12px 24px 0; }
    .search-input {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #e0e0e0; border-radius: 8px;
      padding: 8px 12px 8px 36px; font-size: 14px; outline: none;
      background: #f9fafb url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%239ca3af' d='M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'/%3E%3C/svg%3E") no-repeat 10px center;
    }
    .search-input:focus { border-color: #1565C0; background-color: #fff; }
    .funcs-scroll { padding: 12px 24px 8px; max-height: 60vh; overflow-y: auto; }
    .func-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
      border: 1px solid #f0f2f7; transition: background .15s;
    }
    .func-row:hover { background: #f5f7ff; }
    .func-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: #E3F2FD; color: #1565C0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; flex-shrink: 0;
    }
    .func-info { flex: 1; min-width: 0; }
    .func-nombre { display: block; font-weight: 600; font-size: 14px; color: #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .func-rol { display: block; font-size: 12px; color: #6b7280; }
    .empty-funcs { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 0; color: #9ca3af; }
    .footer { display: flex; justify-content: flex-end; padding: 12px 24px; border-top: 1px solid #f0f2f7; }
    .count-badge { background: #e3f2fd; color: #1565C0; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 12px; margin-left: 8px; }
    .rol-badge {
      font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px;
      background: #E3F2FD; color: #1565C0; white-space: nowrap; flex-shrink: 0;
    }
  `],
  template: `
    <div class="dialog-header">
      <div>
        <h2 class="dialog-title" style="color:#1565C0">
          Responsables – {{ data.grupo.nombre }}
          <span class="count-badge">{{ filtrados.length }}</span>
        </h2>
        <p class="dialog-subtitle">{{ data.rangoLabel }}</p>
      </div>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <div class="search-wrap">
      <input class="search-input" type="text" placeholder="Buscar por nombre o rol..."
             [(ngModel)]="busqueda" (ngModelChange)="filtrar()">
    </div>

    <div class="funcs-scroll">
      @if(filtrados.length === 0){
        <div class="empty-funcs">
          <mat-icon style="font-size:36px;width:36px;height:36px">person_off</mat-icon>
          <span>{{ busqueda ? 'Sin resultados para "' + busqueda + '"' : 'Sin funcionarios asignados' }}</span>
        </div>
      }
      @for(f of filtrados; track f.id){
        <div class="func-row">
          <div class="func-avatar">{{ iniciales(f) }}</div>
          <div class="func-info">
            <span class="func-nombre">{{ f.nombre }} {{ f.apellido }}</span>
            <span class="func-rol">{{ getRolDisplay(f.rol?.nombre) }}</span>
          </div>
          <span class="rol-badge">{{ getRolDisplay(f.rol?.nombre) || 'Sin rol' }}</span>
        </div>
      }
    </div>

    <div class="footer">
      <button mat-flat-button style="background:#1565C0;color:white" (click)="ref.close()">Cerrar</button>
    </div>
  `
})
export class FuncionariosGrupoDialogComponent {
  busqueda = '';
  filtrados: FuncionarioResponse[];

  constructor(
    public ref: MatDialogRef<FuncionariosGrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      grupo: GrupoResponse;
      rangoLabel: string;
    }
  ) {
    this.filtrados = [...(data.grupo.funcionarios ?? [])];
  }

  filtrar() {
    const t = this.busqueda.trim().toLowerCase();
    const funcs = this.data.grupo.funcionarios ?? [];
    this.filtrados = t
      ? funcs.filter(f =>
          `${f.nombre} ${f.apellido} ${f.rol?.nombre ?? ''}`.toLowerCase().includes(t)
        )
      : [...funcs];
  }

  iniciales(f: { nombre: string; apellido: string }): string {
    return ((f.nombre[0] ?? '') + (f.apellido[0] ?? '')).toUpperCase();
  }

  getRolDisplay(nombre?: string): string {
    return nombre ? (ROL_DISPLAY[nombre] ?? nombre) : '';
  }
}

@Component({
  selector: 'app-grupo-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule,
    MatChipsModule
  ],
  styles: [`
    .section-label { font-size:12px;font-weight:600;color:#5C6680;text-transform:uppercase;letter-spacing:.5px;margin:4px 0 6px;display:flex;align-items:center;gap:4px }
    .chips-row { display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;min-height:28px }
    .chip-func { background:#E3F2FD;color:#1565C0;border-radius:16px;padding:4px 10px;font-size:12px;font-weight:500;display:flex;align-items:center;gap:4px;cursor:default }
    .chip-func mat-icon { font-size:14px;width:14px;height:14px;cursor:pointer;color:#1565C0 }
    .empty-sel { font-size:12px;color:#9AA0B9;font-style:italic }
  `],
  template: `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px 0">
      <h2 style="margin:0;font-size:18px;font-weight:600;color:#1565C0">{{ data.modo === 'crear' ? 'Nuevo Grupo' : 'Editar Grupo' }}</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:16px 24px;min-width:500px;max-height:72vh;overflow-y:auto">
      @if(cargandoDatos){
        <div style="display:flex;justify-content:center;padding:32px">
          <mat-spinner diameter="36"></mat-spinner>
        </div>
      } @else {
        <form [formGroup]="form" style="display:flex;flex-direction:column;gap:14px">

          <mat-form-field appearance="outline">
            <mat-label>Nombre del grupo</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej: Sala Azul">
            @if(form.get('nombre')?.invalid && form.get('nombre')?.touched){
              <mat-error>Requerido (2–100 caracteres)</mat-error>
            }
          </mat-form-field>

          @if(data.modo === 'editar'){
            <mat-form-field appearance="outline">
              <mat-label>Rango de edad</mat-label>
              <mat-select formControlName="rangoEdad">
                @for(r of rangos; track r.valor){
                  <mat-option [value]="r.valor">{{ r.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          } @else if(rangoSeleccionado){
            <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
                        background:#E3F2FD;border-radius:8px;border:1px solid #BBDEFB">
              <mat-icon style="color:#1565C0;font-size:20px">info_outline</mat-icon>
              <span style="font-size:14px;color:#1565C0">
                El grupo se creará en el rango <strong>{{ rangoSeleccionado.label }}</strong>
              </span>
            </div>
          } @else {
            <mat-form-field appearance="outline">
              <mat-label>Rango de edad</mat-label>
              <mat-select formControlName="rangoEdad">
                @for(r of rangos; track r.valor){
                  <mat-option [value]="r.valor">{{ r.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          <div style="display:flex;gap:12px">
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Hora inicio</mat-label>
              <input matInput formControlName="horaInicio" type="time">
              @if(form.get('horaInicio')?.invalid && form.get('horaInicio')?.touched){
                <mat-error>Requerido</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Hora fin</mat-label>
              <input matInput formControlName="horaFin" type="time">
              @if(form.get('horaFin')?.invalid && form.get('horaFin')?.touched){
                <mat-error>Requerido</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Selección de funcionarios responsables -->
          <div>
            <div class="section-label">
              <mat-icon style="font-size:15px">person_pin</mat-icon>
              Funcionarios responsables
            </div>
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Seleccionar funcionarios</mat-label>
              <mat-select multiple [(ngModel)]="funcionariosSeleccionados" [ngModelOptions]="{standalone:true}">
                @for(f of funcionarios; track f.id){
                  <mat-option [value]="f.id">
                    {{ f.nombre }} {{ f.apellido }}
                    <span style="font-size:11px;color:#9AA0B9;margin-left:4px">· {{ getRolDisplay(f.rol?.nombre) }}</span>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if(funcionariosSeleccionados.length > 0){
              <div class="chips-row">
                @for(fId of funcionariosSeleccionados; track fId){
                  <span class="chip-func">
                    <mat-icon>person</mat-icon>
                    {{ getFuncionarioNombre(fId) }}
                    <mat-icon (click)="quitarFuncionario(fId)">close</mat-icon>
                  </span>
                }
              </div>
            } @else {
              <p class="empty-sel">Sin funcionarios seleccionados</p>
            }
          </div>

        </form>
      }
    </mat-dialog-content>

    <div style="display:flex;justify-content:flex-end;gap:12px;padding:16px 24px">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white"
              (click)="guardar()" [disabled]="guardando || cargandoDatos">
        @if(guardando){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
        @else { {{ data.modo === 'crear' ? 'Crear Grupo' : 'Guardar Cambios' }} }
      </button>
    </div>
  `
})
export class GrupoDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  cargandoDatos = true;
  funcionarios: FuncionarioResponse[] = [];
  funcionariosSeleccionados: number[] = [];

  rangos = [
    { valor: '0-1',  label: '0 a 1 año' },
    { valor: '1-2',  label: '1 a 2 años' },
    { valor: '2-3',  label: '2 a 3 años' },
    { valor: '3-4',  label: '3 a 4 años' },
    { valor: '4-5',  label: '4 a 5 años' },
    { valor: '5-12', label: '5 a 12 años' },
  ];

  rangoSeleccionado: { valor: string; label: string } | undefined;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<GrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modo: 'crear' | 'editar'; grupo?: GrupoResponse; rangoEdad?: string },
    private grupoService: GrupoService,
    private funcionarioService: FuncionarioService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    const g = data.grupo;
    const rangoInicial = data.modo === 'crear' ? (data.rangoEdad ?? '') : (g?.rangoEdad ?? '');
    this.rangoSeleccionado = this.rangos.find(r => r.valor === rangoInicial);

    this.form = this.fb.group({
      nombre:     [g?.nombre ?? '',        [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      rangoEdad:  [rangoInicial],
      horaInicio: [g?.horaInicio ?? '07:00', Validators.required],
      horaFin:    [g?.horaFin   ?? '19:00', Validators.required],
    });
  }

  ngOnInit() {
    this.funcionarioService.listarActivos().pipe(
      finalize(() => { this.cargandoDatos = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (fs) => {
        this.funcionarios = fs;
        // Pre-cargar funcionarios seleccionados al editar
        if (this.data.modo === 'editar' && this.data.grupo?.funcionarios) {
          this.funcionariosSeleccionados = this.data.grupo.funcionarios.map(f => f.id);
        }
      },
      error: () => this.toast.error('Error al cargar funcionarios')
    });
  }

  getRolDisplay(nombre?: string): string {
    return nombre ? (ROL_DISPLAY[nombre] ?? nombre) : '';
  }

  getFuncionarioNombre(id: number): string {
    const f = this.funcionarios.find(f => f.id === id);
    return f ? `${f.nombre} ${f.apellido}` : String(id);
  }

  quitarFuncionario(id: number) {
    this.funcionariosSeleccionados = this.funcionariosSeleccionados.filter(f => f !== id);
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;

    const payload: GrupoRequest = {
      ...this.form.value,
      funcionariosIds: this.funcionariosSeleccionados,
    };

    const op$ = this.data.modo === 'crear'
      ? this.grupoService.crear(payload)
      : this.grupoService.actualizar(this.data.grupo!.id, payload);

    // FIX: finalize garantiza que guardando vuelva a false siempre,
    // incluso si ocurre un error inesperado (timeout, red, etc.)
    op$.pipe(finalize(() => { this.guardando = false; }))
      .subscribe({
        next: (g) => { this.ref.close(g); },
        error: (err) => {
          this.toast.error(err.error?.mensaje ?? err.error?.error ?? 'Error al guardar grupo');
        }
      });
  }
}

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule, MatExpansionModule,
    MatBadgeModule, MatDividerModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule
  ],
  templateUrl: './grupos.html',
  styleUrl: './grupos.css'
})
export class GruposComponent implements OnInit {
  grupos: GrupoResponse[] = [];
  ninios: NinioResponse[] = [];
  niniosFiltrados: NinioResponse[] = [];
  niniosPaginados: NinioResponse[] = [];
  vista: VistaGestion = 'grupos';
  cargandoGrupos = true;
  cargandoNinios = true;
  busqueda = '';

  // Paginación de niños
  @ViewChild('paginatorNinios') paginatorNinios!: MatPaginator;
  pageSizeNinios = 12;
  pageIndexNinios = 0;
  pageSizeOptionsNinios = [6, 12, 24, 48];

  readonly RANGOS = [
    { valor: '0-1',  label: '0 – 1 año',   icon: 'baby_changing_station', color: '#FF6F00', bg: '#FFF3E0' },
    { valor: '1-2',  label: '1 – 2 años',   icon: 'child_friendly',        color: '#7B1FA2', bg: '#F3E5F5' },
    { valor: '2-3',  label: '2 – 3 años',   icon: 'directions_run',        color: '#00695C', bg: '#E0F2F1' },
    { valor: '3-4',  label: '3 – 4 años',   icon: 'school',                color: '#1565C0', bg: '#E3F2FD' },
    { valor: '4-5',  label: '4 – 5 años',   icon: 'emoji_people',          color: '#E65100', bg: '#FBE9E7' },
    { valor: '5-12', label: '5 – 12 años',  icon: 'menu_book',             color: '#2E7D32', bg: '#E8F5E9' },
  ];

  /** Cuántos niños mostrar en la preview de la card antes del botón "Ver todos" */
  readonly PREVIEW_NINIOS = 2;

  /** Cuántos funcionarios mostrar en la preview de la card antes del botón "+" */
  readonly PREVIEW_FUNCIONARIOS = 2;

  constructor(
    private grupoService: GrupoService,
    private ninioService: NinioService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.vista = this.router.url.includes('/ninios') ? 'ninios' : 'grupos';
    this.cargarGrupos();
    this.cargarNinios();
  }

  cambiarVista(vista: VistaGestion) {
    this.vista = vista;
    this.busqueda = '';
    this.pageIndexNinios = 0;
    this.aplicarFiltrosNinios();
  }

  cargarGrupos() {
    this.cargandoGrupos = true;
    this.grupoService.listarTodos().pipe(
      finalize(() => { this.cargandoGrupos = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (g) => { this.grupos = g; },
      error: () => { this.toast.error('Error al cargar grupos'); }
    });
  }

  cargarNinios() {
    this.cargandoNinios = true;
    this.ninioService.listarTodos().pipe(
      finalize(() => { this.cargandoNinios = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (data) => { this.ninios = data; this.aplicarFiltrosNinios(); },
      error: () => this.toast.error('Error al cargar los niños')
    });
  }

  aplicarBusqueda() {
    if (this.vista === 'ninios') this.aplicarFiltrosNinios();
  }

  aplicarFiltrosNinios() {
    const texto = this.busqueda.trim().toLowerCase();
    this.niniosFiltrados = this.ninios.filter(n => {
      if (!texto) return true;
      const target = [
        `${n.nombre} ${n.apellido}`,
        n.cedula,
        n.direccion ?? '',
        n.observaciones ?? '',
        n.grupo?.nombre ?? '',
        n.grupo?.rangoEdad ?? ''
      ].join(' ').toLowerCase();
      return target.includes(texto);
    });
    this.pageIndexNinios = 0;
    this.actualizarPaginadosNinios();
  }

  actualizarPaginadosNinios() {
    const inicio = this.pageIndexNinios * this.pageSizeNinios;
    this.niniosPaginados = this.niniosFiltrados.slice(inicio, inicio + this.pageSizeNinios);
  }

  onPageChangeNinios(event: PageEvent) {
    this.pageSizeNinios  = event.pageSize;
    this.pageIndexNinios = event.pageIndex;
    this.actualizarPaginadosNinios();
  }

  gruposPorRango(rango: string): GrupoResponse[] {
    let list = this.grupos.filter(g => g.activo && g.rangoEdad === rango);
    if (this.busqueda.trim()) {
      const t = this.busqueda.trim().toLowerCase();
      list = list.filter(g => g.nombre.toLowerCase().includes(t));
    }
    return list;
  }

  gruposSinRango(): GrupoResponse[] {
    const rangosValidos = this.RANGOS.map(r => r.valor);
    let list = this.grupos.filter(g => g.activo && !rangosValidos.includes(g.rangoEdad ?? ''));
    if (this.busqueda.trim()) {
      const t = this.busqueda.trim().toLowerCase();
      list = list.filter(g => g.nombre.toLowerCase().includes(t));
    }
    return list;
  }

  get totalNinos(): number {
    return this.grupos.reduce((sum, g) => sum + (g.cantidadNinios ?? g.ninios?.length ?? 0), 0);
  }

  get totalGruposActivos(): number {
    return this.grupos.filter(g => g.activo).length;
  }

  get totalNiniosActivos(): number {
    return this.ninios.filter(n => n.activo).length;
  }

  get totalNiniosInactivos(): number {
    return this.ninios.filter(n => !n.activo).length;
  }

  abrirCrearActual() {
    if (this.vista === 'grupos') {
      this.abrirCrear();
      return;
    }
    this.abrirCrearNinio();
  }

  abrirCrear(rangoEdad?: string) {
    this.dialog.open(GrupoDialogComponent, {
      data: { modo: 'crear', rangoEdad: rangoEdad ?? '' },
      maxWidth: '580px', width: '100%'
    }).afterClosed().subscribe(g => {
      if (g) { this.toast.success('Grupo creado'); this.cargarGrupos(); }
    });
  }

  abrirEditar(grupo: GrupoResponse) {
    this.dialog.open(GrupoDialogComponent, {
      data: { modo: 'editar', grupo },
      maxWidth: '580px', width: '100%'
    }).afterClosed().subscribe(g => {
      if (g) { this.toast.success('Grupo actualizado'); this.cargarGrupos(); }
    });
  }

  darDeBaja(grupo: GrupoResponse) {
    if (!confirm(`¿Dar de baja el grupo "${grupo.nombre}"?`)) return;
    this.grupoService.darDeBaja(grupo.id).subscribe({
      next: () => { this.toast.success('Grupo dado de baja'); this.cargarGrupos(); },
      error: (err) => this.toast.error(err.error?.mensaje ?? err.error?.error ?? 'Error')
    });
  }

  abrirCrearNinio() {
    const ref = this.dialog.open(NinioCrearDialogComponent, {
      disableClose: false
    });
    ref.afterClosed().subscribe(n => {
      if (n) {
        this.toast.success('Niño registrado correctamente');
        this.cargarNinios();
        this.cargarGrupos();
      }
    });
  }

  abrirEditarNinio(ninio: NinioResponse) {
    const ref = this.dialog.open(NinioEditarDialogComponent, {
      data: { ninio },
      disableClose: false
    });
    ref.afterClosed().subscribe(n => {
      if (n) {
        this.toast.success('Niño actualizado correctamente');
        this.cargarNinios();
        this.cargarGrupos();
      }
    });
  }

  abrirDetalleNinio(ninio: NinioResponse) {
    this.dialog.open(NinioDetalleDialogComponent, {
      data: { ninio },
      width: '600px',
      maxWidth: '96vw',
      panelClass: 'detalle-dialog'
    });
  }

  darDeBajaNinio(ninio: NinioResponse) {
    if (!confirm(`¿Dar de baja a ${ninio.nombre} ${ninio.apellido}?`)) return;
    this.ninioService.darDeBaja(ninio.id).subscribe({
      next: () => {
        this.toast.success('Niño dado de baja');
        this.cargarNinios();
        this.cargarGrupos();
      },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al dar de baja')
    });
  }

  metaRango(rango: string) {
    return this.RANGOS.find(r => r.valor === rango);
  }

  abrirFuncionariosGrupo(grupo: GrupoResponse) {
    const meta = this.metaRango(grupo.rangoEdad ?? '');
    this.dialog.open(FuncionariosGrupoDialogComponent, {
      data: {
        grupo,
        rangoLabel: meta?.label ?? 'Sin rango'
      },
      width: '480px',
      maxWidth: '96vw',
      maxHeight: '90vh'
    });
  }

  abrirNiniosGrupo(grupo: GrupoResponse) {
    const meta = this.metaRango(grupo.rangoEdad ?? '');
    this.dialog.open(NiniosGrupoDialogComponent, {
      data: {
        grupo,
        color: meta?.color ?? '#1565C0',
        bg:    meta?.bg    ?? '#E3F2FD',
        rangoLabel: meta?.label ?? 'Sin rango'
      },
      width: '540px',
      maxWidth: '96vw',
      maxHeight: '90vh'
    });
  }

  formatHora(h?: string) {
    if (!h) return '—';
    return h.substring(0, 5);
  }

  formatFechaNacimiento(f?: string) {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-UY', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  iniciales(f: { nombre: string; apellido: string }): string {
    return ((f.nombre[0] ?? '') + (f.apellido[0] ?? '')).toUpperCase();
  }

  getRolDisplay(nombre?: string): string {
    return nombre ? (ROL_DISPLAY[nombre] ?? nombre) : '';
  }

  getNombreCompleto(ninio: NinioResponse) {
    return `${ninio.nombre} ${ninio.apellido}`;
  }

  displaySexo(sexo?: string) {
    if (!sexo) return '—';
    const s = sexo.toUpperCase();
    return s === 'MASCULINO' ? 'Masculino' : s === 'FEMENINO' ? 'Femenino' : sexo;
  }

  calcularEdad(fechaNacimiento?: string): string {
    if (!fechaNacimiento) return '—';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento + 'T00:00:00');
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    const meses = hoy.getMonth() - nacimiento.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
      anios--;
    }
    const mesesRestantes = ((hoy.getMonth() - nacimiento.getMonth()) + 12) % 12;
    if (anios === 0) return `${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`;
    if (mesesRestantes === 0) return `${anios} año${anios !== 1 ? 's' : ''}`;
    return `${anios} año${anios !== 1 ? 's' : ''} y ${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`;
  }

  cantidadCondiciones(ninio: NinioResponse): number {
    return ninio.condicionesMedicas?.length ?? 0;
  }

  getCondiciones(ninio: NinioResponse): CondicionMedicaResponse[] {
    return ninio.condicionesMedicas ?? [];
  }
}