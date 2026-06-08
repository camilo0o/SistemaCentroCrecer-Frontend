import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { GrupoService } from '../../services/grupo.service';
import { InscripcionService, InscripcionSolicitudResponse } from '../../services/inscripcion.service';
import { ToastService } from '../../services/toast.service';
import { GrupoResponse, ROL_DISPLAY } from '../../models/models';

// ═══════════════════════════════════════════════════════════════════════════════
// DIALOG: Dar de alta un niño
// ═══════════════════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-dar-de-alta-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule
  ],
  styles: [`
    .dialog-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 20px 24px 0;
    }
    .dialog-title { margin: 0; font-size: 18px; font-weight: 700; color: #1565C0; }
    .dialog-subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    .dialog-body { padding: 16px 24px; }

    .edad-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #E3F2FD; color: #1565C0; font-size: 12px; font-weight: 700;
      padding: 3px 10px; border-radius: 12px; margin-left: 8px;
    }
    .sugerencia-grupo {
      background: #E8F5E9; border: 1px solid #A5D6A7; border-radius: 8px;
      padding: 8px 12px; margin-bottom: 12px; font-size: 12px; color: #2E7D32;
      display: flex; align-items: center; gap: 6px;
    }

    .info-nino {
      background: #F0F4FF; border-radius: 10px; padding: 14px 16px;
      margin-bottom: 16px;
    }
    .info-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; font-size: 13px; }
    .info-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #1565C0; }
    .info-label { color: #6b7280; min-width: 80px; }
    .info-val { font-weight: 600; color: #1a1a2e; }

    .condiciones-list { margin-top: 8px; }
    .condicion-chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: #FFF3E0; color: #E65100; font-size: 11px; font-weight: 600;
      padding: 2px 10px; border-radius: 12px; margin: 2px;
    }
    .condicion-chip.cronica { background: #FCE4EC; color: #B71C1C; }

    mat-form-field { width: 100%; }

    .dialog-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 12px 24px; border-top: 1px solid #f0f2f7;
    }
    .btn-alta { font-weight: 700; }

    .resp-info {
      background: #E8F5E9; border-radius: 8px; padding: 10px 14px;
      margin-bottom: 14px; font-size: 13px;
    }
    .resp-info strong { display: block; margin-bottom: 4px; color: #2E7D32; }
    .resp-row { display: flex; align-items: center; gap: 6px; color: #4a4a4a; margin-bottom: 2px; }
    .resp-row mat-icon { font-size: 14px; width: 14px; height: 14px; color: #2E7D32; }
  `],
  template: `
    <div class="dialog-header">
      <div>
        <h2 class="dialog-title">Dar de alta</h2>
        <p class="dialog-subtitle">
          {{ data.solicitud.ninioNombre }} {{ data.solicitud.ninioApellido }}
          <span class="edad-badge"><mat-icon style="font-size:13px;width:13px;height:13px">child_care</mat-icon>{{ edadTexto }}</span>
        </p>
      </div>
      <button mat-icon-button (click)="ref.close()"><mat-icon>close</mat-icon></button>
    </div>

    <div class="dialog-body">

      <!-- Info del niño -->
      <div class="info-nino">
        <div class="info-row">
          <mat-icon>child_care</mat-icon>
          <span class="info-label">Cédula</span>
          <span class="info-val">{{ data.solicitud.ninioCedula }}</span>
        </div>
        <div class="info-row">
          <mat-icon>wc</mat-icon>
          <span class="info-label">Sexo</span>
          <span class="info-val">{{ data.solicitud.ninioSexo }}</span>
        </div>
        <div class="info-row">
          <mat-icon>cake</mat-icon>
          <span class="info-label">Nacimiento</span>
          <span class="info-val">{{ data.solicitud.ninioFechaNacimiento | date:'dd/MM/yyyy' }} · {{ edadTexto }}</span>
        </div>
        @if(data.solicitud.ninioObservaciones){
          <div class="info-row">
            <mat-icon>notes</mat-icon>
            <span class="info-label">Obs.</span>
            <span class="info-val">{{ data.solicitud.ninioObservaciones }}</span>
          </div>
        }
        @if(data.solicitud.ninioDireccion){
          <div class="info-row">
            <mat-icon>home</mat-icon>
            <span class="info-label">Dirección</span>
            <span class="info-val">{{ data.solicitud.ninioDireccion }}</span>
          </div>
        }
        @if(data.solicitud.condicionesMedicas?.length){
          <div class="condiciones-list">
            <div class="info-row" style="margin-bottom: 6px">
              <mat-icon>medical_services</mat-icon>
              <span class="info-label">Condiciones</span>
            </div>
            @for(c of data.solicitud.condicionesMedicas; track $index){
              <span class="condicion-chip" [class.cronica]="c.esCronica">
                {{ c.condicion }}{{ c.esCronica ? ' (crónica)' : '' }}
              </span>
            }
          </div>
        }
      </div>

      <!-- Info del responsable -->
      <div class="resp-info">
        <strong><mat-icon style="font-size:14px;vertical-align:middle">family_restroom</mat-icon> Responsable</strong>
        <div class="resp-row"><mat-icon>person</mat-icon>{{ data.solicitud.responsableNombre }}</div>
        <div class="resp-row"><mat-icon>badge</mat-icon>CI {{ data.solicitud.responsableCedula }}</div>
        @if(data.solicitud.responsableEmail){
          <div class="resp-row"><mat-icon>email</mat-icon>{{ data.solicitud.responsableEmail }}</div>
        }
        @if(data.solicitud.responsableTelefono){
          <div class="resp-row"><mat-icon>phone</mat-icon>{{ data.solicitud.responsableTelefono }}</div>
        }
      </div>

      <!-- Formulario de alta -->
      <form [formGroup]="form">

        @if(grupoSugerido){
          <div class="sugerencia-grupo">
            <mat-icon style="font-size:16px;width:16px;height:16px">lightbulb</mat-icon>
            <span>Grupo sugerido según la edad ({{ edadTexto }}): <strong>{{ grupoSugerido.nombre }}</strong>
              @if(grupoSugerido.rangoEdad){ · {{ grupoSugerido.rangoEdad }} }
            </span>
          </div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Asignar a grupo</mat-label>
          <mat-icon matPrefix>category</mat-icon>
          <mat-select formControlName="grupoId">
            @for(g of data.grupos; track g.id){
              <mat-option [value]="g.id">
                {{ g.nombre }}
                @if(g.rangoEdad){ <span style="color:#9ca3af;font-size:12px"> · {{ g.rangoEdad }}</span> }
              </mat-option>
            }
          </mat-select>
          @if(form.get('grupoId')?.invalid && form.get('grupoId')?.touched){
            <mat-error>Seleccioná un grupo</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones adicionales (opcional)</mat-label>
          <mat-icon matPrefix>notes</mat-icon>
          <textarea matInput formControlName="observaciones" rows="2"></textarea>
        </mat-form-field>
      </form>

    </div>

    <div class="dialog-footer">
      <button mat-stroked-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button color="warn" (click)="rechazar()" [disabled]="cargando">
        <mat-icon>cancel</mat-icon> Rechazar
      </button>
      <button mat-flat-button color="primary" class="btn-alta"
              (click)="confirmar()" [disabled]="cargando">
        @if(cargando){ <mat-spinner diameter="18"></mat-spinner> }
        @else { <mat-icon>how_to_reg</mat-icon> Dar de alta }
      </button>
    </div>
  `
})
export class DarDeAltaDialogComponent {
  form: FormGroup;
  cargando = false;
  edadTexto = '';
  grupoSugerido: GrupoResponse | null = null;

  constructor(
    public ref: MatDialogRef<DarDeAltaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      solicitud: InscripcionSolicitudResponse;
      grupos: GrupoResponse[];
    },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      grupoId:      ['', Validators.required],
      observaciones: ['']
    });

    // Calcular edad
    const edadMeses = this.calcularEdadMeses(data.solicitud.ninioFechaNacimiento);
    this.edadTexto = this.formatearEdad(edadMeses);

    // Sugerir grupo por rango de edad y preseleccionar
    this.grupoSugerido = this.sugerirGrupo(edadMeses, data.grupos);
    if (this.grupoSugerido) {
      this.form.get('grupoId')!.setValue(this.grupoSugerido.id);
    }
  }

  private calcularEdadMeses(fechaNac?: string): number {
    if (!fechaNac) return 0;
    const hoy = new Date();
    const nac = new Date(fechaNac);
    return (hoy.getFullYear() - nac.getFullYear()) * 12
         + (hoy.getMonth() - nac.getMonth());
  }

  private formatearEdad(meses: number): string {
    if (meses < 24) return `${meses} mes${meses !== 1 ? 'es' : ''}`;
    const años = Math.floor(meses / 12);
    const m = meses % 12;
    return m > 0 ? `${años} año${años !== 1 ? 's' : ''} y ${m} mes${m !== 1 ? 'es' : ''}` : `${años} año${años !== 1 ? 's' : ''}`;
  }

  /**
   * Intenta hacer coincidir la edad (en meses) con el rangoEdad de los grupos.
   * Los grupos suelen tener formatos como "2-3 años", "3 a 4 años", "45 días a 1 año", etc.
   * Si no hay match exacto, devuelve null (el funcionario elige manualmente).
   */
  private sugerirGrupo(edadMeses: number, grupos: GrupoResponse[]): GrupoResponse | null {
    const edadAnios = edadMeses / 12;
    for (const g of grupos) {
      if (!g.rangoEdad || !g.activo) continue;
      // Intenta extraer dos números del rango (p.ej. "2-3 años" → [2,3])
      const nums = g.rangoEdad.match(/\d+/g);
      if (!nums || nums.length < 2) continue;
      const min = parseFloat(nums[0]);
      const max = parseFloat(nums[1]);
      if (edadAnios >= min && edadAnios < max) return g;
    }
    return null;
  }

  confirmar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.ref.close({ accion: 'alta', ...this.form.value });
  }

  rechazar() {
    this.ref.close({ accion: 'rechazar' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD FUNCIONARIO
// ═══════════════════════════════════════════════════════════════════════════════

interface AccionCard {
  route: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

interface InfoItem {
  icon: string;
  color: string;
  text: string;
}

@Component({
  selector: 'app-dashboard-funcionario',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatListModule,
    MatToolbarModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatDialogModule, MatTooltipModule, MatBadgeModule,
    Sidebar
  ],
  templateUrl: './dashboard-funcionario.html',
  styleUrl: './dashboard-funcionario.css',
})
export class DashboardFuncionarioComponent implements OnInit {
  stats: any = null;
  cargando = true;
  nombre = '';
  rol = '';
  rolDisplay = '';
  ahora = new Date();

  statCards: any[] = [];
  acciones: AccionCard[] = [];
  infoItems: InfoItem[] = [];

  // Solicitudes pendientes
  solicitudesPendientes: InscripcionSolicitudResponse[] = [];
  cargandoSolicitudes = false;
  grupos: GrupoResponse[] = [];

  // ─── Configuración por rol ────────────────────────────────────────────────

  private readonly ROL_CONFIG: Record<string, {
    acciones: AccionCard[];
    infoItems: InfoItem[];
    bannerColor: string;
    bannerBg: string;
    bannerIcon: string;
    bannerDesc: string;
  }> = {

    COORDINADORA: {
      bannerColor: '#7B1FA2',
      bannerBg: '#F3E5F5',
      bannerIcon: 'star',
      bannerDesc: 'Coordinación general del centro — 40 horas semanales',
      acciones: [
        { route: '/funcionario/gruposyninios', icon: 'category',       label: 'Grupos',      desc: 'Ver y organizar grupos de niños',       color: '#7B1FA2', bg: '#F3E5F5' },
        { route: '/funcionario/turnos',        icon: 'schedule',       label: 'Turnos',      desc: 'Gestionar horarios del equipo',          color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/funcionario/reportes',      icon: 'assessment',     label: 'Reportes',    desc: 'Supervisar reportes del sistema',        color: '#00695C', bg: '#E0F2F1' },
        { route: '/funcionario/actividades',   icon: 'event',          label: 'Actividades', desc: 'Planificar actividades del centro',      color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/funcionario/agenda',        icon: 'calendar_month', label: 'Agenda',      desc: 'Organizar supervisiones y reuniones',    color: '#C62828', bg: '#FFEBEE' },
      ],
      infoItems: [
        { icon: 'schedule',           color: '#1565C0', text: 'Jornada completa: 40 horas semanales' },
        { icon: 'supervisor_account', color: '#7B1FA2', text: 'Supervisiones del equipo técnico cada 2 meses' },
        { icon: 'groups',             color: '#2E7D32', text: 'Coordina todos los grupos y salas del centro' },
        { icon: 'cleaning_services',  color: '#FF6F00', text: 'Supervisa auxiliares de limpieza 7:00 – 19:00 hs' },
      ]
    },

    ASISTENTE_SOCIAL: {
      bannerColor: '#1565C0',
      bannerBg: '#E3F2FD',
      bannerIcon: 'social_distance',
      bannerDesc: 'Equipo técnico — 20 horas semanales',
      acciones: [
        { route: '/funcionario/gruposyninios', icon: 'child_care',    label: 'Niños',    desc: 'Ver información de niños registrados',  color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/funcionario/gruposyninios', icon: 'category',      label: 'Grupos',   desc: 'Consultar grupos del centro',           color: '#7B1FA2', bg: '#F3E5F5' },
        { route: '/funcionario/reportes',      icon: 'assessment',    label: 'Reportes', desc: 'Generar y ver reportes sociales',       color: '#1565C0', bg: '#E3F2FD' },
        { route: '/funcionario/agenda',        icon: 'calendar_month',label: 'Agenda',   desc: 'Mi agenda de atenciones',              color: '#FF6F00', bg: '#FFF3E0' },
      ],
      infoItems: [
        { icon: 'schedule',        color: '#1565C0', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'family_restroom', color: '#2E7D32', text: 'Seguimiento de situaciones familiares' },
        { icon: 'description',     color: '#7B1FA2', text: 'Informes periódicos al equipo de coordinación' },
      ]
    },

    PSICOLOGO: {
      bannerColor: '#6A1B9A', bannerBg: '#EDE7F6', bannerIcon: 'psychology',
      bannerDesc: 'Equipo técnico — 20 horas semanales',
      acciones: [
        { route: '/funcionario/gruposyninios', icon: 'child_care',    label: 'Niños',    desc: 'Seguimiento de niños',             color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/funcionario/reportes',      icon: 'assessment',    label: 'Reportes', desc: 'Informes psicológicos',            color: '#6A1B9A', bg: '#EDE7F6' },
        { route: '/funcionario/agenda',        icon: 'calendar_month',label: 'Agenda',   desc: 'Sesiones y reuniones programadas', color: '#FF6F00', bg: '#FFF3E0' },
      ],
      infoItems: [
        { icon: 'schedule',   color: '#6A1B9A', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'psychology', color: '#7B1FA2', text: 'Evaluaciones y seguimiento psicológico' },
        { icon: 'group_work', color: '#2E7D32', text: 'Participación en reuniones de equipo técnico' },
      ]
    },

    PSICOMOTRICISTA: {
      bannerColor: '#00695C', bannerBg: '#E0F2F1', bannerIcon: 'directions_run',
      bannerDesc: 'Equipo técnico — 20 horas semanales',
      acciones: [
        { route: '/funcionario/gruposyninios', icon: 'category',   label: 'Grupos',      desc: 'Grupos donde trabajo',        color: '#00695C', bg: '#E0F2F1' },
        { route: '/funcionario/actividades',   icon: 'event',      label: 'Actividades', desc: 'Sesiones de psicomotricidad', color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/funcionario/reportes',      icon: 'assessment', label: 'Reportes',    desc: 'Reportes de seguimiento',     color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'schedule',       color: '#00695C', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'directions_run', color: '#00695C', text: 'Trabaja el desarrollo motor de los niños' },
        { icon: 'group_work',     color: '#2E7D32', text: 'Coordina con el equipo pedagógico' },
      ]
    },

    MAESTRA: {
      bannerColor: '#1565C0', bannerBg: '#E3F2FD', bannerIcon: 'school',
      bannerDesc: 'Equipo técnico — 20 horas semanales · Parte pedagógica',
      acciones: [
        { route: '/funcionario/gruposyninios', icon: 'category',   label: 'Mis Grupos',  desc: 'Grupos a mi cargo',         color: '#1565C0', bg: '#E3F2FD' },
        { route: '/funcionario/gruposyninios', icon: 'child_care', label: 'Niños',       desc: 'Ver niños registrados',     color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/funcionario/actividades',   icon: 'event',      label: 'Actividades', desc: 'Planificación pedagógica',  color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/funcionario/reportes',      icon: 'assessment', label: 'Reportes',    desc: 'Informes de avance',        color: '#7B1FA2', bg: '#F3E5F5' },
      ],
      infoItems: [
        { icon: 'schedule',  color: '#1565C0', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'school',    color: '#1565C0', text: 'Responsable de la parte pedagógica del grupo' },
        { icon: 'menu_book', color: '#2E7D32', text: 'Planificación de actividades educativas' },
      ]
    },

    ADMINISTRATIVO: {
      bannerColor: '#37474F', bannerBg: '#ECEFF1', bannerIcon: 'admin_panel_settings',
      bannerDesc: 'Equipo técnico — 20 horas semanales',
      acciones: [
        { route: '/funcionario/turnos',   icon: 'schedule',   label: 'Turnos',   desc: 'Control de horarios',      color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/funcionario/reportes', icon: 'assessment', label: 'Reportes', desc: 'Documentación y reportes', color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'schedule',            color: '#37474F', text: 'Jornada parcial: 20 horas semanales' },
        { icon: 'admin_panel_settings',color: '#37474F', text: 'Gestión de documentación y administración' },
      ]
    },

    EDUCADOR: {
      bannerColor: '#2E7D32', bannerBg: '#E8F5E9', bannerIcon: 'face',
      bannerDesc: 'Educador/a — Por debajo del equipo técnico',
      acciones: [
        { route: '/funcionario/gruposyninios', icon: 'category',      label: 'Mis Grupos',  desc: 'Niños a mi cargo',           color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/funcionario/actividades',   icon: 'event',         label: 'Actividades', desc: 'Actividades programadas',    color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/funcionario/reportes',      icon: 'assessment',    label: 'Reportes',    desc: 'Reportes de mi sala',        color: '#1565C0', bg: '#E3F2FD' },
        { route: '/funcionario/agenda',        icon: 'calendar_month',label: 'Agenda',      desc: 'Mi agenda diaria',           color: '#7B1FA2', bg: '#F3E5F5' },
      ],
      infoItems: [
        { icon: 'group_work', color: '#2E7D32', text: 'Trabaja directamente con los niños en sala' },
        { icon: 'school',     color: '#1565C0', text: 'Coordina con maestra en la parte pedagógica' },
      ]
    },

    TALLERISTA_PLASTICA: {
      bannerColor: '#E64A19', bannerBg: '#FBE9E7', bannerIcon: 'palette',
      bannerDesc: 'Tallerista de Expresión Plástica',
      acciones: [
        { route: '/funcionario/actividades',   icon: 'palette',    label: 'Talleres', desc: 'Mis talleres de expresión plástica', color: '#E64A19', bg: '#FBE9E7' },
        { route: '/funcionario/gruposyninios', icon: 'category',   label: 'Grupos',   desc: 'Grupos que atiendo',                color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/funcionario/reportes',      icon: 'assessment', label: 'Reportes', desc: 'Reportes de taller',                color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'palette',   color: '#E64A19', text: 'Talleres de expresión artística y plástica' },
        { icon: 'group_work',color: '#2E7D32', text: 'Trabaja con distintos grupos del centro' },
      ]
    },

    TALLERISTA_CERAMICA: {
      bannerColor: '#5D4037', bannerBg: '#EFEBE9', bannerIcon: 'architecture',
      bannerDesc: 'Tallerista de Cerámica',
      acciones: [
        { route: '/funcionario/actividades',   icon: 'architecture', label: 'Talleres', desc: 'Mis talleres de cerámica', color: '#5D4037', bg: '#EFEBE9' },
        { route: '/funcionario/gruposyninios', icon: 'category',     label: 'Grupos',   desc: 'Grupos que atiendo',       color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/funcionario/reportes',      icon: 'assessment',   label: 'Reportes', desc: 'Reportes de taller',       color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'architecture',color: '#5D4037', text: 'Talleres de modelado y cerámica' },
        { icon: 'group_work',  color: '#2E7D32', text: 'Trabaja con distintos grupos del centro' },
      ]
    },

    TALLERISTA_CORPORAL: {
      bannerColor: '#1565C0', bannerBg: '#E3F2FD', bannerIcon: 'self_improvement',
      bannerDesc: 'Tallerista de Expresión Corporal',
      acciones: [
        { route: '/funcionario/actividades',   icon: 'self_improvement', label: 'Talleres', desc: 'Mis talleres corporales', color: '#1565C0', bg: '#E3F2FD' },
        { route: '/funcionario/gruposyninios', icon: 'category',          label: 'Grupos',   desc: 'Grupos que atiendo',      color: '#2E7D32', bg: '#E8F5E9' },
        { route: '/funcionario/reportes',      icon: 'assessment',        label: 'Reportes', desc: 'Reportes de taller',      color: '#7B1FA2', bg: '#F3E5F5' },
      ],
      infoItems: [
        { icon: 'self_improvement', color: '#1565C0', text: 'Talleres de expresión corporal y movimiento' },
        { icon: 'group_work',       color: '#2E7D32', text: 'Trabaja con distintos grupos del centro' },
      ]
    },

    AUXILIAR_LIMPIEZA: {
      bannerColor: '#FF6F00', bannerBg: '#FFF3E0', bannerIcon: 'cleaning_services',
      bannerDesc: 'Auxiliar de Limpieza — Turnos rotativos 7:00 – 19:00 hs',
      acciones: [
        { route: '/funcionario/turnos', icon: 'schedule',        label: 'Mis Turnos', desc: 'Ver mis horarios asignados',       color: '#FF6F00', bg: '#FFF3E0' },
        { route: '/funcionario/agenda', icon: 'calendar_month',  label: 'Agenda',     desc: 'Novedades y comunicados del día',  color: '#1565C0', bg: '#E3F2FD' },
      ],
      infoItems: [
        { icon: 'schedule',          color: '#FF6F00', text: 'El centro opera 7:00 – 19:00 hs de lunes a viernes' },
        { icon: 'cleaning_services', color: '#FF6F00', text: 'Turno 1: 7:00–11:00 · Turno 2: 11:00–15:00 · Turno 3: 15:00–19:00' },
        { icon: 'group',             color: '#2E7D32', text: 'Coincidencia de turnos en el cierre del centro (desde las 15:00)' },
      ]
    },
  };

  private readonly DEFAULT_CONFIG = {
    bannerColor: '#1565C0', bannerBg: '#E3F2FD', bannerIcon: 'badge',
    bannerDesc: 'Funcionario del Centro Crecer',
    acciones: [
      { route: '/funcionario/turnos',   icon: 'schedule',   label: 'Mis Turnos', desc: 'Ver mis horarios',       color: '#FF6F00', bg: '#FFF3E0' },
      { route: '/funcionario/reportes', icon: 'assessment', label: 'Reportes',   desc: 'Generar y ver reportes', color: '#7B1FA2', bg: '#F3E5F5' },
    ],
    infoItems: [
      { icon: 'schedule', color: '#1565C0', text: 'El centro opera de lunes a viernes, 7:00 – 19:00 hs' },
    ]
  };

  get rolConfig() { return this.ROL_CONFIG[this.rol] ?? this.DEFAULT_CONFIG; }

  constructor(
    private dashService: DashboardService,
    public auth: AuthService,
    private grupoService: GrupoService,
    private inscripcionService: InscripcionService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.nombre = this.auth.getNombre() ?? 'Funcionario';
    this.rol = this.auth.getRol() ?? '';
    this.rolDisplay = ROL_DISPLAY[this.rol] ?? this.rol;

    this.dashService.getFuncionarioStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.statCards = [
          { icon: 'child_care', label: 'Niños registrados', value: s.niniosTotales,   bg: '#E8F5E9', color: '#2E7D32' },
          { icon: 'event',      label: 'Actividades',       value: s.actividadesTotal, bg: '#FFF3E0', color: '#FF6F00' },
          { icon: 'groups',     label: 'Grupos activos',    value: s.gruposActivos,    bg: '#F3E5F5', color: '#7B1FA2' },
        ];
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });

    // Cargar solicitudes pendientes y grupos si puede gestionar niños
    if (this.puedeGestionarInscripciones) {
      this.cargarSolicitudesPendientes();
      this.grupoService.listarActivos().subscribe({
        next: g => this.grupos = g,
        error: () => {}
      });
    }
  }

  get puedeGestionarInscripciones(): boolean {
    return ['COORDINADORA', 'ASISTENTE_SOCIAL', 'PSICOLOGO'].includes(this.rol);
  }

  cargarSolicitudesPendientes() {
    this.cargandoSolicitudes = true;
    this.inscripcionService.listarPendientes().subscribe({
      next: s => { this.solicitudesPendientes = s; this.cargandoSolicitudes = false; },
      error: () => { this.cargandoSolicitudes = false; }
    });
  }

  abrirDarDeAlta(solicitud: InscripcionSolicitudResponse) {
    const ref = this.dialog.open(DarDeAltaDialogComponent, {
      width: '580px',
      maxWidth: '95vw',
      panelClass: 'app-dialog-panel',
      disableClose: true,
      data: { solicitud, grupos: this.grupos }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.accion === 'alta') {
        this.inscripcionService.darDeAlta(solicitud.id, {
          grupoId: result.grupoId,
          observaciones: result.observaciones
        }).subscribe({
          next: () => {
            this.toast.success(`${solicitud.ninioNombre} fue dado de alta correctamente.`);
            this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id !== solicitud.id);
          },
          error: err => this.toast.error(err.error?.error || 'Error al dar de alta.')
        });
      } else if (result.accion === 'rechazar') {
        this.inscripcionService.rechazar(solicitud.id, 'Rechazado desde dashboard').subscribe({
          next: () => {
            this.toast.success('Solicitud rechazada.');
            this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id !== solicitud.id);
          },
          error: err => this.toast.error(err.error?.error || 'Error al rechazar.')
        });
      }
    });
  }

  get saludoHora(): string {
    const h = this.ahora.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get fechaFormateada(): string {
    return this.ahora.toLocaleDateString('es-UY', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  get esCoordinadora(): boolean { return this.rol === 'COORDINADORA'; }
  get esAuxiliar(): boolean { return this.rol === 'AUXILIAR_LIMPIEZA'; }

  calcularEdadTexto(fechaNac?: string): string {
    if (!fechaNac) return '';
    const hoy = new Date();
    const nac = new Date(fechaNac);
    const meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
    if (meses < 24) return `${meses} mes${meses !== 1 ? 'es' : ''}`;
    const años = Math.floor(meses / 12);
    const m = meses % 12;
    return m > 0 ? `${años} año${años !== 1 ? 's' : ''} y ${m} mes${m !== 1 ? 'es' : ''}` : `${años} año${años !== 1 ? 's' : ''}`;
  }
}
