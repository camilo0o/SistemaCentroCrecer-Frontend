import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { finalize } from 'rxjs/operators';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { AgendaService } from '../../services/agenda.service';
import { ToastService } from '../../services/toast.service';
import { AgendaResponse, TipoEvento, TIPO_EVENTO_DISPLAY } from '../../models/models';

type Vista = 'semana' | 'dia';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule, Sidebar,
    MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatChipsModule
  ],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class AgendaComponent implements OnInit {
  vista: Vista = 'semana';
  cargando = false;
  fechaActual = new Date();
  eventos: AgendaResponse[] = [];

  readonly tipoDisplay = TIPO_EVENTO_DISPLAY;
  readonly diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  constructor(
    private agendaService: AgendaService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    const fecha = this.toISODate(this.fechaActual);
    const req = this.vista === 'semana'
      ? this.agendaService.eventosSemana(fecha)
      : this.agendaService.eventosDia(fecha);

    req.pipe(finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (e) => this.eventos = e,
        error: () => this.toast.error('Error al cargar la agenda')
      });
  }

  // ── Navegación ──────────────────────────────────────────────────────────
  anterior() {
    const d = new Date(this.fechaActual);
    this.vista === 'semana' ? d.setDate(d.getDate() - 7) : d.setDate(d.getDate() - 1);
    this.fechaActual = d;
    this.cargar();
  }

  siguiente() {
    const d = new Date(this.fechaActual);
    this.vista === 'semana' ? d.setDate(d.getDate() + 7) : d.setDate(d.getDate() + 1);
    this.fechaActual = d;
    this.cargar();
  }

  irHoy() {
    this.fechaActual = new Date();
    this.cargar();
  }

  cambiarVista(v: Vista) {
    this.vista = v;
    this.cargar();
  }

  // ── Vista semanal: grilla ─────────────────────────────────────────────
  get diasDeSemana(): Date[] {
    const lunes = new Date(this.fechaActual);
    const dia = lunes.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;
    lunes.setDate(lunes.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }

  eventosDelDia(fecha: Date): AgendaResponse[] {
    const iso = this.toISODate(fecha);
    return this.eventos.filter(e => e.fecha === iso).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  // ── Vista diaria: lista ordenada ──────────────────────────────────────
  get eventosDiaActual(): AgendaResponse[] {
    return [...this.eventos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  toISODate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  get tituloNavegacion(): string {
    if (this.vista === 'dia') {
      return this.fechaActual.toLocaleDateString('es-UY', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }
    const dias = this.diasDeSemana;
    const lunes = dias[0].toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
    const domingo = dias[6].toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${lunes} — ${domingo}`;
  }

  tipoClass(tipo: TipoEvento): string {
    const map: Record<TipoEvento, string> = {
      ACTIVIDAD: 'tipo-actividad',
      TURNO:     'tipo-turno',
      REUNION:   'tipo-reunion',
      OTRO:      'tipo-otro'
    };
    return map[tipo] ?? '';
  }

  get totalEventos(): number { return this.eventos.length; }
}
