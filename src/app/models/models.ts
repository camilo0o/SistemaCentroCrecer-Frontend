// Auth models
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
}

// Rol model
export interface Rol {
  id: number;
  nombre: string;
  activo: boolean;
  fechaBaja?: string;
  padreId?: number;
  padreNombre?: string;
}

// Funcionario models
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
}

// Niño models
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
}

// Grupo model
export interface GrupoResponse {
  id: number;
  nombre: string;
  activo: boolean;
  rangoEdad?: string;
  horaInicio?: string;
  horaFin?: string;
}

// Turno models
export interface TurnoRequest {
  horaInicio: string;
  horaFin: string;
  funcionarioId: number;
}

export interface TurnoResponse {
  id: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  fechaBaja?: string;
  funcionarioId?: number;
  funcionarioNombre?: string;
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

export interface ReporteResponse {
  id: number;
  titulo: string;
  descripcion: string;
  fechaGeneracion: string;
  visto: boolean;
  activo: boolean;
  funcionarioId?: number;
  funcionarioNombre?: string;
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

// Labels para estados de actividad
export const ESTADO_ACTIVIDAD_DISPLAY: Record<EstadoActividad, string> = {
  PLANIFICADA: 'Planificada',
  EN_CURSO:    'En curso',
  FINALIZADA:  'Finalizada',
  CANCELADA:   'Cancelada',
}

export type TipoEvento = 'ACTIVIDAD' | 'TURNO' | 'REUNION' | 'OTRO';
 
export interface AgendaResponse {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha: string;           // 'YYYY-MM-DD'
  horaInicio: string;      // 'HH:mm'
  horaFin?: string;
  tipo: TipoEvento;
  funcionarioNombre?: string;
  lugar?: string;
}
 
export const TIPO_EVENTO_DISPLAY: Record<TipoEvento, string> = {
  ACTIVIDAD: 'Actividad',
  TURNO:     'Turno',
  REUNION:   'Reunión',
  OTRO:      'Otro',
}

;