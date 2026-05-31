export interface LoginRequest {
  email: string;
  contrasenia: string;
}

export interface LoginResponse {
  token?: string | null;
  tipoToken: string;
  rol: string;
  id: number;
  nombreCompleto: string;
  email: string;
  expiracion: number;
  mustChangePassword?: boolean | null;
  fotoPerfil?: string | null;

}

export interface Rol {
  id: number;
  nombre: string;
  activo: boolean;
  fechaBaja?: string;
  padreId?: number;
  padreNombre?: string;
}

export interface FuncionarioRequest {
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  contrasenia?: string;
  fechaNacimiento?: string;
  rolId: number;
}

export interface FuncionarioResponse {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  activo: boolean;
  fechaBaja?: string;
  rol: Rol;
  grupos?: GrupoResponse[];
  fotoPerfil?: string;
  mustChangePassword: boolean | null;
}


export interface CondicionMedicaInline {
  condicion: string;
  observacion?: string;
  esCronica: boolean;
}

export interface CondicionMedicaResponse {
  condicionId: number;
  condicion: string;
  observacion?: string;
  esCronica: boolean;
}

export interface NinioRequest {
  id: number;
  cedula: string;
  nombre: string;
  sexo: string;
  direccion?: string;
  observaciones?: string;
  fechaNacimiento?: string;
  activo: boolean;
  fechaBaja?: string;
  grupo: GrupoResponse[];
}

export interface NinioResponse {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  sexo: string;
  direccion?: string;
  observaciones?: string;
  fechaNacimiento?: string;
  activo: boolean;
  fechaBaja?: string;
  grupo?: GrupoResponse;
  grupoId?: number;
  grupoNombre?: string;
  condicionesMedicas?: CondicionMedicaResponse[];
}

// Grupo model
export interface GrupoResponse {
  id: number;
  nombre: string;
  activo: boolean;
  rangoEdad?: string;
  horaInicio?: string;
  horaFin?: string;
  cantidadNinios?: number;
  ninios?: NinioResponse[];
  funcionarios?: FuncionarioResponse[];
}

export interface GrupoRequest {
  nombre: string;
  rangoEdad?: string;
  horaInicio: string;
  horaFin: string;
  funcionariosIds?: number[];
  niniosIds?: number[];
}

// Turno models
export type DiaSemana = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DIAS_SEMANA: { valor: DiaSemana; etiqueta: string; abrev: string }[] = [
  { valor: 'MONDAY',    etiqueta: 'Lunes',     abrev: 'Lun' },
  { valor: 'TUESDAY',   etiqueta: 'Martes',    abrev: 'Mar' },
  { valor: 'WEDNESDAY', etiqueta: 'Miércoles', abrev: 'Mié' },
  { valor: 'THURSDAY',  etiqueta: 'Jueves',    abrev: 'Jue' },
  { valor: 'FRIDAY',    etiqueta: 'Viernes',   abrev: 'Vie' },
  { valor: 'SATURDAY',  etiqueta: 'Sábado',    abrev: 'Sáb' },
  { valor: 'SUNDAY',    etiqueta: 'Domingo',   abrev: 'Dom' },
];

export interface TurnoRequest {
  horaInicio: string;
  horaFin: string;
  funcionarioId: number;
  dias: DiaSemana[];
}

export interface TurnoResponse {
  id: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  fechaBaja?: string;
  funcionarioId?: number;
  funcionarioNombre?: string;
  dias: DiaSemana[];
}

// Dashboard stats
export interface AdminStats {
  funcionariosActivos: number;
  funcionariosTotales: number;
  niniosTotales: number;
  actividadesTotal: number;
  turnosActivos: number;
  gruposActivos: number;
  coberturaPorcentaje: number;
}

// Reporte models
export interface ReporteRequest {
  titulo: string;
  descripcion: string;
  funcionarioId: number;
  gruposIds?: number[];
  niniosIds?: number[];
}

export interface ReporteNinioResponse {
  id: number;
  reporteId: number;
  reporteTitulo: string;
  ninioId: number;
  ninioNombre: string;
  ninioApellido: string;
}

export interface ReporteGrupoResponse {
  id: number;
  reporteId: number;
  reporteTitulo: string;
  grupoId: number;
  grupoNombre: string;
}

export interface ReporteResponse {
  id: number;
  titulo: string;
  descripcion: string;
  fechaGeneracion: string;
  visto: boolean;
  activo: boolean;
  funcionario?: FuncionarioResponse;
  /** @deprecated usar funcionario.id */
  funcionarioId?: number;
  /** @deprecated usar funcionario.nombre + funcionario.apellido */
  funcionarioNombre?: string;
  grupos?: ReporteGrupoResponse[];
  ninios?: ReporteNinioResponse[];
}

// Role display names mapping
export const ROL_DISPLAY: Record<string, string> = {
  'ADMINISTRADOR_SISTEMA': 'Administrador del Sistema',
  'COORDINADORA': 'Coordinadora',
  'ASISTENTE_SOCIAL': 'Asistente Social',
  'PSICOLOGO': 'Psicólogo',
  'PSICOMOTRICISTA': 'Psicomotricista',
  'MAESTRA': 'Maestra',
  'ADMINISTRATIVO': 'Administrativo',
  'EDUCADOR': 'Educador/a',
  'TALLERISTA_PLASTICA': 'Tallerista Expresión Plástica',
  'TALLERISTA_CERAMICA': 'Tallerista Cerámica',
  'TALLERISTA_CORPORAL': 'Tallerista Expresión Corporal',
  'AUXILIAR_LIMPIEZA': 'Auxiliar de Limpieza',
  'RESPONSABLE': 'Responsable (Familiar)'
}

// Empresa externa
export interface EmpresaExternaResponse {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  activo: boolean;
}

// Permiso
export interface PermisoRequest {
  ninioId: number;
  autorizado: boolean;
  observaciones?: string;
}

export interface PermisoResponse {
  id: number;
  ninioId: number;
  ninioNombre?: string;
  autorizado: boolean;
  observaciones?: string;
  fechaRegistro: string;
}

// Actividad
export type EstadoActividad = 'PLANIFICADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA';

export interface ActividadRequest {
  nombre: string;
  descripcion?: string;
  fechaDesde: string;    
  fechaHasta?: string;   
  horaInicio: string;
  horaSalida?: string;   
  lugar: string;
}

export interface ActividadResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  fechaDesde: string;
  fechaHasta?: string;
  horaInicio: string;
  horaSalida?: string;
  lugar?: string;
  activo: boolean;
  fechaBaja?: string;
  ninios?: ParticipanteResponse[];
  permisos?: PermisoResponse[];
  empresasExternas?: EmpresaExternaResponse[];
}
export interface ParticipanteResponse {
  id: number;
  nombre: string;
  apellido: string;
  grupoNombre?: string;
}

export const ESTADO_ACTIVIDAD_DISPLAY: Record<EstadoActividad, string> = {
  PLANIFICADA: 'Planificada',
  EN_CURSO:    'En curso',
  FINALIZADA:  'Finalizada',
  CANCELADA:   'Cancelada',
}

// Agenda
export interface AgendaResponse {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  descripcion: string;
  funcionarioId: number;
  funcionarioNombre?: string;
  tipoId: number;
  tipoNombre?: string;
  activo: boolean;
}

export interface AgendaRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  funcionarioId: number;
  tipoId: number;
}

export interface TipoAgendaResponse {
  id: number;
  tipo: string;
}
// Asistencia
export interface AsistenciaResponse {
  id: number;
  fecha: string;
  horaEntrada: string;
  horaSalida?: string;
  observaciones?: string;
  activo: boolean;
  ninioId?: number;
  ninioNombre?: string;
  ninioApellido?: string;
  ninioCedula?: string;
  grupoNombre?: string;
  funcionarioId?: number;
  funcionarioNombre?: string;
  funcionarioCedula?: string;
}

export interface RegistroEntradaFuncionarioRequest {
  fecha?: string;
  horaEntrada?: string;
  horaSalida?: string;
  observaciones?: string;
}

export interface AsistenciaNinioRequest {
  fecha?: string;
  horaEntrada: string;
  horaSalida?: string;
  observaciones?: string;
  ninioId: number;
}