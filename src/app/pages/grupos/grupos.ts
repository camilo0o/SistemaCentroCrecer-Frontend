import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { GrupoService } from '../../services/grupo.service';
import { FuncionarioService } from '../../services/funcionario.service';
import { ToastService } from '../../services/toast.service';
import { GrupoResponse, GrupoRequest, NinioResponse, FuncionarioResponse, ROL_DISPLAY } from '../../models/models';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

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
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './grupos.html',
  styleUrl: './grupos.css'
})
export class GruposComponent implements OnInit {
  grupos: GrupoResponse[] = [];
  cargando = true;
  busqueda = '';

  readonly RANGOS = [
    { valor: '0-1',  label: '0 – 1 año',   icon: 'baby_changing_station', color: '#FF6F00', bg: '#FFF3E0' },
    { valor: '1-2',  label: '1 – 2 años',   icon: 'child_friendly',        color: '#7B1FA2', bg: '#F3E5F5' },
    { valor: '2-3',  label: '2 – 3 años',   icon: 'directions_run',        color: '#00695C', bg: '#E0F2F1' },
    { valor: '3-4',  label: '3 – 4 años',   icon: 'school',                color: '#1565C0', bg: '#E3F2FD' },
    { valor: '4-5',  label: '4 – 5 años',   icon: 'emoji_people',          color: '#E65100', bg: '#FBE9E7' },
    { valor: '5-12', label: '5 – 12 años',  icon: 'menu_book',             color: '#2E7D32', bg: '#E8F5E9' },
  ];

  constructor(
    private grupoService: GrupoService,
    private dialog: MatDialog,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargarGrupos(); }

  cargarGrupos() {
    this.cargando = true;
    this.grupoService.listarTodos().pipe(
      finalize(() => { this.cargando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (g) => { this.grupos = g; },
      error: () => { this.toast.error('Error al cargar grupos'); }
    });
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

  metaRango(rango: string) {
    return this.RANGOS.find(r => r.valor === rango);
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
}