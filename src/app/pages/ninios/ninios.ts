import { Component, OnInit, Inject, ChangeDetectorRef, ViewChild, ElementRef, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import {
  FormsModule, ReactiveFormsModule, FormBuilder, FormGroup,
  FormArray, AbstractControl, Validators
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { NinioService } from '../../services/ninio.service';
import { GrupoService } from '../../services/grupo.service';
import { ToastService } from '../../services/toast.service';
import { CondicionMedicaResponse, GrupoResponse, NinioResponse, ResponsableResumen } from '../../models/models';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// ─── Dialog: Ver detalle del niño ───────────────────────────────────────────
@Component({
  selector: 'app-ninio-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatChipsModule, MatDividerModule
  ],
  styles: [`
    .dlg-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 24px 24px 0;
    }
    .header-left { display: flex; gap: 16px; align-items: flex-start; }
    .avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; overflow: hidden;
    }
    .avatar mat-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    .header-info { display: flex; flex-direction: column; gap: 4px; }
    .nombre-completo { font-size: 1.2rem; font-weight: 700; color: #1a2340; margin: 0; }
    .grupo-label {
      font-size: 0.85rem; color: #5C6680; display: flex; align-items: center; gap: 4px;
    }
    .grupo-label mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-pill {
      display: inline-flex; align-items: center; gap: 4px;
      border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 600;
    }
    .status-activo   { background: #E8F5E9; color: #2E7D32; }
    .status-inactivo { background: #FFEBEE; color: #C62828; }
    .section-title {
      font-size: 11px; font-weight: 700; color: #9AA0B9;
      text-transform: uppercase; letter-spacing: 0.7px;
      margin: 0 0 12px; display: flex; align-items: center; gap: 6px;
    }
    .section-title mat-icon { font-size: 15px; width: 15px; height: 15px; color: #1565C0; }
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    }
    .info-item { display: flex; flex-direction: column; gap: 3px; }
    .info-item.full { grid-column: 1 / -1; }
    .info-key { font-size: 11px; color: #9AA0B9; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-val { font-size: 0.9rem; font-weight: 500; color: #1a2340; }
    .info-val.muted { color: #9AA0B9; font-style: italic; font-weight: 400; }
    .edad-badge { display: flex; align-items: center; gap: 6px; }
    .rango-tag {
      background: #E3F2FD; color: #1565C0; border-radius: 12px;
      padding: 2px 9px; font-size: 11px; font-weight: 600;
    }
    .section-sep { border: none; border-top: 1px solid #F0F2F7; margin: 18px 0; }
    .condicion-card {
      background: #F7F9FF; border: 1px solid #E8EAF0; border-radius: 10px;
      padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
    }
    .condicion-top {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .condicion-nombre { font-size: 0.9rem; font-weight: 600; color: #1a2340; }
    .condicion-obs { font-size: 0.82rem; color: #5C6680; margin: 0; line-height: 1.45; }
    .tag-cronica {
      background: #FFF3E0; color: #E65100; border-radius: 10px;
      padding: 2px 9px; font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .tag-aguda {
      background: #E8F5E9; color: #2E7D32; border-radius: 10px;
      padding: 2px 9px; font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .actions-bar {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px; border-top: 1px solid #F0F2F7;
    }
    .resp-card {
      background: #F7F9FF; border: 1px solid #E8EAF0; border-radius: 10px;
      padding: 12px 14px; display: flex; align-items: center; gap: 12px;
    }
    .resp-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    }
    .resp-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .resp-nombre { font-size: 0.9rem; font-weight: 600; color: #1a2340; }
    .resp-sub { font-size: 0.8rem; color: #5C6680; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .resp-relacion {
      background: #E3F2FD; color: #1565C0; border-radius: 10px;
      padding: 2px 9px; font-size: 11px; font-weight: 600; flex-shrink: 0;
    }
    .resp-retiro-ok  { background: #E8F5E9; color: #2E7D32; border-radius: 10px; padding: 2px 9px; font-size: 11px; font-weight: 600; }
    .resp-retiro-no  { background: #FFEBEE; color: #C62828; border-radius: 10px; padding: 2px 9px; font-size: 11px; font-weight: 600; }
    .resp-contact { display: flex; flex-direction: column; gap: 2px; text-align: right; flex-shrink: 0; }
    .resp-tel { font-size: 12px; color: #1565C0; font-weight: 500; }
    .resp-mail { font-size: 11px; color: #9AA0B9; }
    .no-responsables {
      text-align: center; padding: 16px 0; color: #9AA0B9; font-size: 0.88rem;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .no-responsables mat-icon { font-size: 32px; width: 32px; height: 32px; color: #D0D4E3; }
    .responsables-grid { display: flex; flex-direction: column; gap: 10px; }
    .no-condiciones {
      text-align: center; padding: 20px 0; color: #9AA0B9; font-size: 0.88rem;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .no-condiciones mat-icon { font-size: 32px; width: 32px; height: 32px; color: #D0D4E3; }
    .condiciones-grid { display: flex; flex-direction: column; gap: 10px; }
    .badge-count {
      background: #1565C0; color: white; border-radius: 10px;
      padding: 1px 8px; font-size: 11px; font-weight: 700;
    }
  `],
  template: `
    <!-- Encabezado -->
    <div class="dlg-header">
      <div class="header-left">
        <div class="avatar" style="overflow:hidden">
          @if(data.ninio.fotoUrl){
            <img [src]="data.ninio.fotoUrl" alt="Foto" style="width:100%;height:100%;object-fit:cover">
          } @else {
            <mat-icon>child_care</mat-icon>
          }
        </div>
        <div class="header-info">
          <p class="nombre-completo">{{ data.ninio.nombre }} {{ data.ninio.apellido }}</p>
          <span class="grupo-label">
            <mat-icon>group</mat-icon>
            {{ data.ninio.grupo?.nombre || 'Sin grupo asignado' }}
          </span>
          <span class="status-pill"
                [class.status-activo]="data.ninio.activo"
                [class.status-inactivo]="!data.ninio.activo">
            <mat-icon style="font-size:12px;width:12px;height:12px">
              {{ data.ninio.activo ? 'check_circle' : 'cancel' }}
            </mat-icon>
            {{ data.ninio.activo ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
      </div>
      <button mat-icon-button (click)="ref.close()" matTooltip="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content style="padding: 20px 24px; min-width: 500px; max-height: 68vh; overflow-y: auto;">

      <!-- Sección: Datos personales -->
      <p class="section-title">
        <mat-icon>person</mat-icon>
        Datos personales
      </p>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-key">Cédula</span>
          <span class="info-val">{{ data.ninio.cedula }}</span>
        </div>
        <div class="info-item">
          <span class="info-key">Sexo</span>
          <span class="info-val">{{ displaySexo(data.ninio.sexo) }}</span>
        </div>
        <div class="info-item">
          <span class="info-key">Fecha de nacimiento</span>
          <span class="info-val">{{ formatDate(data.ninio.fechaNacimiento) }}</span>
        </div>
        <div class="info-item">
          <span class="info-key">Edad</span>
          <span class="info-val">
            <span class="edad-badge">
              {{ calcularEdad(data.ninio.fechaNacimiento) }}
              @if(data.ninio.grupo?.rangoEdad){
                <span class="rango-tag">{{ data.ninio.grupo!.rangoEdad }} años</span>
              }
            </span>
          </span>
        </div>
        <div class="info-item full">
          <span class="info-key">Dirección</span>
          <span class="info-val" [class.muted]="!data.ninio.direccion">
            {{ data.ninio.direccion || 'No registrada' }}
          </span>
        </div>
        <div class="info-item full">
          <span class="info-key">Observaciones</span>
          <span class="info-val" [class.muted]="!data.ninio.observaciones">
            {{ data.ninio.observaciones || 'Sin observaciones' }}
          </span>
        </div>
      </div>

      <hr class="section-sep">

      <!-- Sección: Condiciones médicas -->
      <p class="section-title">
        <mat-icon>medical_services</mat-icon>
        Condiciones médicas
        @if(condiciones.length > 0){
          <span class="badge-count">{{ condiciones.length }}</span>
        }
      </p>

      @if(condiciones.length === 0){
        <div class="no-condiciones">
          <mat-icon>health_and_safety</mat-icon>
          <span>Sin condiciones médicas registradas</span>
        </div>
      } @else {
        <div class="condiciones-grid">
          @for(c of condiciones; track c.condicionId){
            <div class="condicion-card">
              <div class="condicion-top">
                <span class="condicion-nombre">{{ c.condicion }}</span>
                <span [class]="c.esCronica ? 'tag-cronica' : 'tag-aguda'">
                  {{ c.esCronica ? 'Crónica' : 'Aguda' }}
                </span>
              </div>
              @if(c.observacion){
                <p class="condicion-obs">{{ c.observacion }}</p>
              }
            </div>
          }
        </div>
      }

      <hr class="section-sep">

      <!-- Sección: Responsables -->
      <p class="section-title">
        <mat-icon>family_restroom</mat-icon>
        Responsables
        @if(responsables.length > 0){
          <span class="badge-count">{{ responsables.length }}</span>
        }
      </p>

      @if(responsables.length === 0){
        <div class="no-responsables">
          <mat-icon>person_search</mat-icon>
          <span>Sin responsables registrados</span>
        </div>
      } @else {
        <div class="responsables-grid">
          @for(r of responsables; track r.id){
            <div class="resp-card">
              <div class="resp-avatar">{{ r.nombre[0] }}{{ r.apellido?.[0] ?? '' }}</div>
              <div class="resp-info">
                <span class="resp-nombre">{{ r.nombre }} {{ r.apellido }}</span>
                <div class="resp-sub">
                  @if(r.cedula){ <span>CI: {{ r.cedula }}</span> }
                  @if(r.tipoRelacion){
                    <span class="resp-relacion">{{ r.tipoRelacion }}</span>
                  }
                  @if(r.autorizadoRetiro !== undefined){
                    <span [class]="r.autorizadoRetiro ? 'resp-retiro-ok' : 'resp-retiro-no'">
                      <mat-icon style="font-size:11px;width:11px;height:11px;vertical-align:middle">
                        {{ r.autorizadoRetiro ? 'check_circle' : 'cancel' }}
                      </mat-icon>
                      {{ r.autorizadoRetiro ? 'Autorizado retiro' : 'No autorizado retiro' }}
                    </span>
                  }
                </div>
              </div>
              @if(r.telefono || r.email){
                <div class="resp-contact">
                  @if(r.telefono){ <span class="resp-tel">{{ r.telefono }}</span> }
                  @if(r.email){ <span class="resp-mail">{{ r.email }}</span> }
                </div>
              }
            </div>
          }
        </div>
      }

    </mat-dialog-content>

    <!-- Pie -->
    <div class="actions-bar">
      @if(data.ninio.activo){
        <button mat-stroked-button color="warn"
                (click)="ref.close('baja')" matTooltip="Dar de baja al niño">
          <mat-icon>person_off</mat-icon>
          Dar de baja
        </button>
        <button mat-flat-button style="background:#1565C0;color:white"
                (click)="ref.close('editar')">
          <mat-icon>edit</mat-icon>
          Editar
        </button>
      }
      @if(!data.ninio.activo){
        <button mat-stroked-button (click)="ref.close()">Cerrar</button>
      }
    </div>
  `
})
export class NinioDetalleDialogComponent {
  constructor(
    public ref: MatDialogRef<NinioDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ninio: NinioResponse }
  ) {}

  get condiciones(): CondicionMedicaResponse[] {
    return this.data.ninio.condicionesMedicas ?? [];
  }

  get responsables(): ResponsableResumen[] {
    return this.data.ninio.responsables ?? [];
  }

  displaySexo(sexo?: string): string {
    if (!sexo) return '—';
    const s = sexo.toUpperCase();
    return s === 'MASCULINO' ? 'Masculino' : s === 'FEMENINO' ? 'Femenino' : sexo;
  }

  formatDate(fecha?: string): string {
    if (!fecha) return '—';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-UY', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  calcularEdad(fechaNacimiento?: string): string {
    if (!fechaNacimiento) return '—';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento + 'T00:00:00');
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    const meses = hoy.getMonth() - nacimiento.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) anios--;
    const mesesRestantes = ((hoy.getMonth() - nacimiento.getMonth()) + 12) % 12;
    if (anios === 0) return `${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`;
    if (mesesRestantes === 0) return `${anios} año${anios !== 1 ? 's' : ''}`;
    return `${anios} año${anios !== 1 ? 's' : ''} y ${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`;
  }
}

// ─── Dialog: Crear Niño (2 pasos) ───────────────────────────────────────────
@Component({
  selector: 'app-ninio-crear-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatStepperModule, MatDividerModule
  ],
  styles: [`
    .dlg-header { display:flex; justify-content:space-between; align-items:center;
                  padding:20px 24px 0; }
    .dlg-title  { font-size:1.15rem; font-weight:700; color:#1a2340; margin:0; }
    .step-label { font-size:.75rem; font-weight:600; color:#9AA0B9;
                  text-transform:uppercase; letter-spacing:.5px; margin-bottom:18px; }
    .condicion-row { border:1px solid #E8EAF0; border-radius:10px;
                     padding:14px 16px; background:#FAFBFF; margin-bottom:12px; position:relative; }
    .condicion-row .remove-btn { position:absolute; top:8px; right:8px; }
    .add-btn { margin-top:4px; }
    .cronica-row { display:flex; align-items:center; gap:8px; margin-top:6px; }
    .cronica-label { font-size:.85rem; color:#5C6680; }
    .badge-cronica { background:#FFF3E0; color:#E65100; border-radius:12px;
                     padding:2px 9px; font-size:11px; font-weight:600; }
    .badge-aguda   { background:#E8F5E9; color:#2E7D32; border-radius:12px;
                     padding:2px 9px; font-size:11px; font-weight:600; }
    .no-condiciones { text-align:center; padding:18px 0; color:#9AA0B9; font-size:.9rem; }
    .step-actions { display:flex; justify-content:space-between; align-items:center;
                    gap:12px; padding:16px 24px; border-top:1px solid #F0F2F7; }
  `],
  template: `
    <div class="dlg-header">
      <h2 class="dlg-title">Registrar Niño</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <div style="display:flex;align-items:center;gap:0;padding:16px 24px 0;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div [style.background]="paso===1?'#1565C0':'#E3F2FD'"
             [style.color]="paso===1?'white':'#1565C0'"
             style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;
                    justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;">1</div>
        <span style="font-size:.85rem;font-weight:600;"
              [style.color]="paso===1?'#1a2340':'#9AA0B9'">Datos del niño</span>
      </div>
      <div style="flex:1;height:2px;background:#E8EAF0;margin:0 10px;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div [style.background]="paso===2?'#1565C0':'#E3F2FD'"
             [style.color]="paso===2?'white':'#1565C0'"
             style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;
                    justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;">2</div>
        <span style="font-size:.85rem;font-weight:600;"
              [style.color]="paso===2?'#1a2340':'#9AA0B9'">Condiciones médicas</span>
      </div>
    </div>

    <mat-dialog-content *ngIf="paso===1"
        style="padding:20px 24px;min-width:520px;max-height:65vh;overflow-y:auto">
      <form [formGroup]="formDatos" style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre">
            @if(formDatos.get('nombre')?.invalid && formDatos.get('nombre')?.touched){
              <mat-error>Requerido (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="apellido">
            @if(formDatos.get('apellido')?.invalid && formDatos.get('apellido')?.touched){
              <mat-error>Requerido (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Cédula</mat-label>
          <input matInput formControlName="cedula" placeholder="Solo números, máx. 8 dígitos">
          @if(formDatos.get('cedula')?.invalid && formDatos.get('cedula')?.touched){
            <mat-error>Cédula inválida (solo números, máx. 8)</mat-error>
          }
        </mat-form-field>
        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Fecha de nacimiento</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fechaNacimiento">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if(formDatos.get('fechaNacimiento')?.invalid && formDatos.get('fechaNacimiento')?.touched){
              <mat-error>Requerida</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Sexo</mat-label>
            <mat-select formControlName="sexo">
              <mat-option value="MASCULINO">Masculino</mat-option>
              <mat-option value="FEMENINO">Femenino</mat-option>
            </mat-select>
            @if(formDatos.get('sexo')?.invalid && formDatos.get('sexo')?.touched){
              <mat-error>Requerido</mat-error>
            }
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Grupo</mat-label>
          <mat-select formControlName="grupoId">
            @if(cargandoGrupos){
              <mat-option disabled>Cargando grupos...</mat-option>
            }
            @for(g of grupos; track g.id){
              <mat-option [value]="g.id">
                {{ g.nombre }}
                @if(g.rangoEdad){ <span style="color:#9AA0B9"> · {{ g.rangoEdad }} años</span> }
              </mat-option>
            }
          </mat-select>
          @if(formDatos.get('grupoId')?.invalid && formDatos.get('grupoId')?.touched){
            <mat-error>Seleccione un grupo</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-content *ngIf="paso===2"
        style="padding:20px 24px;min-width:520px;max-height:65vh;overflow-y:auto">
      <p style="color:#5C6680;font-size:.9rem;margin:0 0 16px">
        <mat-icon style="font-size:16px;vertical-align:middle;color:#1565C0">info</mat-icon>
        Podés agregar las condiciones médicas del niño ahora o hacerlo más tarde desde su ficha.
        Este paso es <strong>opcional</strong>.
      </p>
      <form [formGroup]="formCondiciones">
        <div formArrayName="condiciones">
          @if(condicionesArray.length === 0){
            <div class="no-condiciones">
              <mat-icon style="font-size:36px;color:#D0D4E3">medical_services</mat-icon>
              <p>No se cargaron condiciones médicas aún.</p>
            </div>
          }
          @for(ctrl of condicionesArray.controls; track $index){
            <div class="condicion-row" [formGroupName]="$index">
              <button mat-icon-button class="remove-btn" type="button"
                      (click)="eliminarCondicion($index)"
                      matTooltip="Eliminar condición">
                <mat-icon style="color:#C62828;font-size:18px">delete_outline</mat-icon>
              </button>
              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px">
                <mat-label>Condición médica</mat-label>
                <input matInput formControlName="condicion"
                       placeholder="Ej: Asma, Alergia a la penicilina...">
                @if(ctrl.get('condicion')?.invalid && ctrl.get('condicion')?.touched){
                  <mat-error>La condición es obligatoria</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px">
                <mat-label>Observaciones</mat-label>
                <textarea matInput formControlName="observacion" rows="2"
                          placeholder="Detalles adicionales, medicación, etc."></textarea>
              </mat-form-field>
              <div class="cronica-row">
                <mat-checkbox formControlName="esCronica" color="primary"></mat-checkbox>
                <span class="cronica-label">¿Es crónica?</span>
                @if(ctrl.get('esCronica')?.value){
                  <span class="badge-cronica">Crónica</span>
                } @else {
                  <span class="badge-aguda">Aguda / Puntual</span>
                }
              </div>
            </div>
          }
        </div>
        <button mat-stroked-button class="add-btn" type="button"
                (click)="agregarCondicion()">
          <mat-icon>add_circle_outline</mat-icon>
          Agregar condición médica
        </button>
      </form>
    </mat-dialog-content>

    <div class="step-actions">
      @if(paso===1){
        <button mat-stroked-button (click)="ref.close()">Cancelar</button>
        <button mat-flat-button style="background:#1565C0;color:white"
                (click)="irPaso2()">
          Siguiente
          <mat-icon>arrow_forward</mat-icon>
        </button>
      }
      @if(paso===2){
        <button mat-stroked-button (click)="paso=1">
          <mat-icon>arrow_back</mat-icon>
          Atrás
        </button>
        <div style="display:flex;gap:10px">
          <button mat-stroked-button (click)="guardar(true)"
                  [disabled]="guardando" matTooltip="Registrar sin condiciones médicas">
            Omitir condiciones
          </button>
          <button mat-flat-button style="background:#1565C0;color:white"
                  (click)="guardar(false)" [disabled]="guardando">
            @if(guardando){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
            @else {
              <mat-icon>save</mat-icon>
              Registrar niño
            }
          </button>
        </div>
      }
    </div>
  `
})
export class NinioCrearDialogComponent implements OnInit {
  paso = 1;
  guardando = false;
  grupos: GrupoResponse[] = [];
  cargandoGrupos = true;

  formDatos: FormGroup;
  formCondiciones: FormGroup;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<NinioCrearDialogComponent>,
    private ninioService: NinioService,
    private grupoService: GrupoService,
    private toast: ToastService
  ) {
    this.formDatos = this.fb.group({
      nombre:          ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cedula:          ['', [Validators.required, Validators.pattern('^[0-9]{1,8}$')]],
      fechaNacimiento: [null, Validators.required],
      sexo:            ['', Validators.required],
      grupoId:         [null, Validators.required],
      direccion:       [''],
      observaciones:   [''],
    });

    this.formCondiciones = this.fb.group({
      condiciones: this.fb.array([])
    });
  }

  ngOnInit() {
    this.grupoService.listarActivos().pipe(
      finalize(() => this.cargandoGrupos = false)
    ).subscribe({
      next: (gs) => this.grupos = gs,
      error: () => this.toast.error('Error al cargar grupos')
    });
  }

  get condicionesArray(): FormArray {
    return this.formCondiciones.get('condiciones') as FormArray;
  }

  agregarCondicion() {
    this.condicionesArray.push(this.fb.group({
      condicion:   ['', Validators.required],
      observacion: [''],
      esCronica:   [false, Validators.required]
    }));
  }

  eliminarCondicion(index: number) {
    this.condicionesArray.removeAt(index);
  }

  irPaso2() {
    if (this.formDatos.invalid) {
      this.formDatos.markAllAsTouched();
      return;
    }
    this.paso = 2;
  }

  guardar(omitirCondiciones: boolean) {
    if (!omitirCondiciones && this.condicionesArray.length > 0) {
      if (this.formCondiciones.invalid) {
        this.formCondiciones.markAllAsTouched();
        return;
      }
    }

    this.guardando = true;
    const v = this.formDatos.value;

    const fecha = v.fechaNacimiento instanceof Date
      ? v.fechaNacimiento.toISOString().split('T')[0]
      : v.fechaNacimiento;

    const condiciones = (!omitirCondiciones && this.condicionesArray.length > 0)
      ? this.condicionesArray.controls.map((c: AbstractControl) => ({
          condicion:   c.get('condicion')?.value,
          observacion: c.get('observacion')?.value || null,
          esCronica:   c.get('esCronica')?.value ?? false,
        }))
      : [];

    const payload = {
      nombre:              v.nombre,
      apellido:            v.apellido,
      cedula:              v.cedula,
      fechaNacimiento:     fecha,
      sexo:                v.sexo,
      direccion:           v.direccion || null,
      observaciones:       v.observaciones || null,
      activo:              true,
      grupo:               { id: v.grupoId },
      condicionesMedicas:  condiciones.length > 0 ? condiciones : null,
    };

    this.ninioService.crear(payload).subscribe({
      next: (n) => { this.guardando = false; this.ref.close(n); },
      error: (err) => {
        this.guardando = false;
        this.toast.error(err.error?.message ?? err.error?.error ?? 'Error al guardar');
      }
    });
  }
}

// ─── Dialog: Editar niño ────────────────────────────────────────────────────
@Component({
  selector: 'app-ninio-editar-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule
  ],
  styles: [`
    .foto-section {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 16px; background: #F7F9FF;
      border: 1px solid #E8EAF0; border-radius: 10px;
    }
    .foto-avatar {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; overflow: hidden; position: relative;
    }
    .foto-avatar mat-icon { color: white; font-size: 32px; width: 32px; height: 32px; }
    .foto-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .foto-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .foto-label { font-size: 12px; font-weight: 600; color: #5C6680; text-transform: uppercase; letter-spacing: 0.5px; }
    .foto-hint { font-size: 11px; color: #9AA0B9; }
    .uploading-overlay {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center;
    }
  `],
  template: `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px 0">
      <h2 style="font-size:1.15rem;font-weight:700;color:#1a2340;margin:0">Editar Niño</h2>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:24px;min-width:520px;max-height:70vh;overflow-y:auto">
      <!-- Foto -->
      <div class="foto-section" style="margin-bottom:16px">
        <div class="foto-avatar">
          @if(subiendoFoto){
            <div class="uploading-overlay">
              <mat-spinner diameter="28" color="accent"></mat-spinner>
            </div>
          }
          @if(fotoPreview){
            <img [src]="fotoPreview" alt="Foto">
          } @else {
            <mat-icon>child_care</mat-icon>
          }
        </div>
        <div class="foto-info">
          <span class="foto-label">Foto del niño</span>
          <span class="foto-hint">JPG, PNG o WEBP · máx. 5 MB</span>
          <div style="display:flex;gap:8px;margin-top:4px">
            <button mat-stroked-button type="button" [disabled]="subiendoFoto"
                    (click)="triggerFotoInput()" style="font-size:12px;height:32px;line-height:32px">
              <mat-icon style="font-size:16px;margin-right:4px">photo_camera</mat-icon>
              {{ fotoPreview ? 'Cambiar foto' : 'Subir foto' }}
            </button>
            @if(fotoPreview && fotoPreview !== data.ninio.fotoUrl){
              <button mat-icon-button type="button" matTooltip="Descartar cambio de foto"
                      (click)="descartarFoto()" style="color:#C62828">
                <mat-icon style="font-size:18px">undo</mat-icon>
              </button>
            }
          </div>
        </div>
        <input #editFotoInput type="file" accept="image/*" style="display:none"
               (change)="onFotoSeleccionada($event)">
      </div>

      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre">
            @if(form.get('nombre')?.invalid && form.get('nombre')?.touched){
              <mat-error>Requerido (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="apellido">
            @if(form.get('apellido')?.invalid && form.get('apellido')?.touched){
              <mat-error>Requerido (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Cédula</mat-label>
          <input matInput formControlName="cedula" placeholder="Solo números, máx. 8 dígitos">
          @if(form.get('cedula')?.invalid && form.get('cedula')?.touched){
            <mat-error>Cédula inválida (solo números, máx. 8)</mat-error>
          }
        </mat-form-field>
        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Fecha de nacimiento</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fechaNacimiento">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if(form.get('fechaNacimiento')?.invalid && form.get('fechaNacimiento')?.touched){
              <mat-error>Requerida</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1">
            <mat-label>Sexo</mat-label>
            <mat-select formControlName="sexo">
              <mat-option value="MASCULINO">Masculino</mat-option>
              <mat-option value="FEMENINO">Femenino</mat-option>
            </mat-select>
            @if(form.get('sexo')?.invalid && form.get('sexo')?.touched){
              <mat-error>Requerido</mat-error>
            }
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Grupo</mat-label>
          <mat-select formControlName="grupoId">
            @if(cargandoGrupos){
              <mat-option disabled>Cargando grupos...</mat-option>
            }
            @for(g of grupos; track g.id){
              <mat-option [value]="g.id">
                {{ g.nombre }}
                @if(g.rangoEdad){ <span style="color:#9AA0B9"> · {{ g.rangoEdad }} años</span> }
              </mat-option>
            }
          </mat-select>
          @if(form.get('grupoId')?.invalid && form.get('grupoId')?.touched){
            <mat-error>Seleccione un grupo</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <div style="display:flex;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #F0F2F7">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button style="background:#1565C0;color:white"
              (click)="guardar()" [disabled]="guardando || subiendoFoto">
        @if(guardando){ <mat-spinner diameter="18" color="accent"></mat-spinner> }
        @else { Guardar Cambios }
      </button>
    </div>
  `
})
export class NinioEditarDialogComponent implements OnInit {
  form: FormGroup;
  guardando = false;
  grupos: GrupoResponse[] = [];
  cargandoGrupos = true;

  fotoPreview: string | null = null;
  subiendoFoto = false;
  private nuevaFotoUrl: string | null = null;

  @ViewChild('editFotoInput') editFotoInput!: ElementRef<HTMLInputElement>;

  triggerFotoInput() {
    this.editFotoInput.nativeElement.value = '';
    this.editFotoInput.nativeElement.click();
  }

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<NinioEditarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ninio: NinioResponse },
    private ninioService: NinioService,
    private grupoService: GrupoService,
    private toast: ToastService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    const n = data.ninio;
    const fechaInicial = n?.fechaNacimiento ? new Date(n.fechaNacimiento + 'T00:00:00') : null;

    this.fotoPreview = n?.fotoUrl ?? null;

    this.form = this.fb.group({
      nombre:          [n?.nombre ?? '',  [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellido:        [n?.apellido ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      cedula:          [n?.cedula ?? '',  [Validators.required, Validators.pattern('^[0-9]{1,8}$')]],
      fechaNacimiento: [fechaInicial,      Validators.required],
      sexo:            [n?.sexo ?? '',    Validators.required],
      grupoId:         [n?.grupo?.id ?? null, Validators.required],
      direccion:       [n?.direccion ?? ''],
      observaciones:   [n?.observaciones ?? ''],
    });
  }

  ngOnInit() {
    this.grupoService.listarActivos().pipe(
      finalize(() => this.cargandoGrupos = false)
    ).subscribe({
      next: (gs) => this.grupos = gs,
      error: () => this.toast.error('Error al cargar grupos')
    });
  }

  onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';
    this.subiendoFoto = true;
    this.cdr.markForCheck();

    this.ninioService.subirFotoCloudinary(file).subscribe({
      next: (url) => {
        this.nuevaFotoUrl = url;
        this.fotoPreview = url;
        this.subiendoFoto = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.subiendoFoto = false;
        this.toast.error('Error al subir la imagen a Cloudinary');
        this.cdr.markForCheck();
      }
    });
  }

  descartarFoto() {
    this.nuevaFotoUrl = null;
    this.fotoPreview = this.data.ninio.fotoUrl ?? null;
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const v = this.form.value;

    const fecha = v.fechaNacimiento instanceof Date
      ? v.fechaNacimiento.toISOString().split('T')[0]
      : v.fechaNacimiento;

    const payload = {
      nombre:          v.nombre,
      apellido:        v.apellido,
      cedula:          v.cedula,
      fechaNacimiento: fecha,
      sexo:            v.sexo,
      direccion:       v.direccion || null,
      observaciones:   v.observaciones || null,
      activo:          true,
      grupo:           { id: v.grupoId }
    };

    // Capturamos nuevaFotoUrl antes del subscribe para evitar que un ciclo de CD la pise
    const fotoAGuardar = this.nuevaFotoUrl;

    this.ninioService.actualizar(this.data.ninio.id, payload).pipe(
      switchMap(nActualizado => {
        if (fotoAGuardar) {
          return this.ninioService.actualizarFoto(nActualizado.id, fotoAGuardar);
        }
        // Si no hay foto nueva, conservar la foto existente en el objeto devuelto
        return of({ ...nActualizado, fotoUrl: this.data.ninio.fotoUrl ?? nActualizado.fotoUrl });
      })
    ).subscribe({
      next: (n) => { this.guardando = false; this.ref.close(n); },
      error: (err) => {
        this.guardando = false;
        this.toast.error(err.error?.message ?? err.error?.error ?? 'Error al guardar');
      }
    });
  }
}

// ─── Componente principal ────────────────────────────────────────────────────
@Component({
  selector: 'app-ninios',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatToolbarModule, MatCardModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatButtonModule, MatDialogModule, MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './ninios.html',
  styleUrls: ['./ninios.css']
})
export class NiniosComponent implements OnInit {
  ninios: NinioResponse[] = [];
  filtrados: NinioResponse[] = [];
  paginados: NinioResponse[] = [];
  cargando = true;
  busqueda = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('fotoInput') fotoInput!: ElementRef<HTMLInputElement>;
  ninioParaFoto: NinioResponse | null = null;
  subiendoFoto = false;
  pageSize = 12;
  pageIndex = 0;
  pageSizeOptions = [6, 12, 24, 48];

  constructor(
    private ninioService: NinioService,
    private toast: ToastService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() { this.cargarNinios(); }

  cargarNinios() {
    this.cargando = true;
    this.ninioService.listarTodos().pipe(
      finalize(() => { this.cargando = false; })
    ).subscribe({
      next: (data) => { this.ninios = data; this.aplicarFiltros(); },
      error: () => this.toast.error('Error al cargar los niños')
    });
  }

  aplicarFiltros() {
    const texto = this.busqueda.trim().toLowerCase();
    this.filtrados = this.ninios.filter(n => {
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
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.actualizarPaginados();
  }

  actualizarPaginados() {
    const inicio = this.pageIndex * this.pageSize;
    this.paginados = this.filtrados.slice(inicio, inicio + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageSize  = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPaginados();
  }

  abrirCrear() {
    const ref = this.dialog.open(NinioCrearDialogComponent, {
      width: '720px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(n => {
      if (n) { this.toast.success('Niño registrado correctamente'); this.cargarNinios(); }
    });
  }

  abrirDetalle(ninio: NinioResponse) {
    const ref = this.dialog.open(NinioDetalleDialogComponent, {
      data: { ninio },
      width: '580px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(accion => {
      if (accion === 'editar') this.abrirEditar(ninio);
      if (accion === 'baja')   this.darDeBaja(ninio);
    });
  }

  abrirEditar(ninio: NinioResponse) {
    const ref = this.dialog.open(NinioEditarDialogComponent, {
      data: { ninio },
      width: '680px',
      maxWidth: '94vw',
      panelClass: 'app-dialog-panel',
      disableClose: true
    });
    ref.afterClosed().subscribe(n => {
      if (n) {
        this.toast.success('Niño actualizado correctamente');
        const idx = this.ninios.findIndex(x => x.id === n.id);
        if (idx !== -1) {
          this.ninios[idx] = { ...n };
          this.ninios = [...this.ninios];
          this.aplicarFiltros();
        }
      }
    });
  }

  darDeBaja(ninio: NinioResponse) {
    if (!confirm(`¿Dar de baja a ${ninio.nombre} ${ninio.apellido}?`)) return;
    this.ninioService.darDeBaja(ninio.id).subscribe({
      next: () => { this.toast.success('Niño dado de baja'); this.cargarNinios(); },
      error: (err) => this.toast.error(err.error?.error ?? 'Error al dar de baja')
    });
  }

  getNombreCompleto(ninio: NinioResponse) {
    return `${ninio.nombre} ${ninio.apellido}`;
  }

  displaySexo(sexo?: string) {
    if (!sexo) return '—';
    const s = sexo.toUpperCase();
    return s === 'MASCULINO' ? 'Masculino' : s === 'FEMENINO' ? 'Femenino' : sexo;
  }

  formatDate(fecha?: string) {
    if (!fecha) return '—';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-UY', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  calcularEdad(fechaNacimiento?: string): string {
    if (!fechaNacimiento) return '—';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento + 'T00:00:00');
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    const meses = hoy.getMonth() - nacimiento.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) anios--;
    const mesesRestantes = ((hoy.getMonth() - nacimiento.getMonth()) + 12) % 12;
    if (anios === 0) return `${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`;
    if (mesesRestantes === 0) return `${anios} año${anios !== 1 ? 's' : ''}`;
    return `${anios} año${anios !== 1 ? 's' : ''} y ${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`;
  }

  getResponsableTooltip(r: ResponsableResumen): string {
    const partes: string[] = [];
    if (r.cedula) partes.push(`CI: ${r.cedula}`);
    if (r.telefono) partes.push(`Tel: ${r.telefono}`);
    if (r.email) partes.push(r.email);
    if (r.autorizadoRetiro !== undefined)
      partes.push(r.autorizadoRetiro ? '✓ Autorizado retiro' : '✗ No autorizado retiro');
    return partes.join(' · ');
  }

  cantidadCondiciones(ninio: NinioResponse): number {
    return ninio.condicionesMedicas?.length ?? 0;
  }

  getCondiciones(ninio: NinioResponse): CondicionMedicaResponse[] {
    return ninio.condicionesMedicas ?? [];
  }

  get totalActivos(): number  { return this.ninios.filter(n => n.activo).length; }
  get totalInactivos(): number { return this.ninios.filter(n => !n.activo).length; }

  abrirSelectorFoto(ninio: NinioResponse) {
    this.ninioParaFoto = ninio;
    this.fotoInput.nativeElement.value = '';
    this.fotoInput.nativeElement.click();
  }

  onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.ninioParaFoto) return;
    const file = input.files[0];
    const ninio = this.ninioParaFoto;
    this.subiendoFoto = true;

    this.ninioService.subirFotoCloudinary(file).pipe(
      switchMap(fotoUrl => this.ninioService.actualizarFoto(ninio.id, fotoUrl))
    ).subscribe({
      next: (actualizado) => {
        this.subiendoFoto = false;
        const idx = this.ninios.findIndex(n => n.id === actualizado.id);
        if (idx !== -1) {
          this.ninios[idx] = { ...actualizado };
          this.ninios = [...this.ninios];
          this.aplicarFiltros();
        }
        this.toast.success('Foto actualizada correctamente');
        this.ninioParaFoto = null;
      },
      error: (err) => {
        this.subiendoFoto = false;
        this.ninioParaFoto = null;
        this.toast.error(err.error?.message ?? 'Error al subir la foto');
      }
    });
  }
}
