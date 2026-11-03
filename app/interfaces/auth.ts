export interface RolePublic {
  id: number
  name: string
  slug: string
  description?: string
  permissions: string[]
}

export interface RolesListApiResponse {
  data: RolePublic[]
}

export interface DependencyPublic {
  id: number
  name: string
  description?: string
  isActive: boolean
  managers: DependencyManagerPublic[]
}

export interface DependencyManagerPublic {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface CreateDependencyRequest {
  name: string
  description?: string
  isActive?: boolean
}

export interface UpdateDependencyRequest {
  name?: string
  description?: string
}

export interface UpdateDependencyStatusRequest {
  isActive: boolean
}

export interface UpdateDependencyManagersRequest {
  userIds: number[]
}

export interface UserPublic {
  id: number
  dependencyId: number
  roleId: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  jobTitle?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  initials: string
  role: RolePublic
  dependency: DependencyPublic
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CreateUserRequest {
  dependencyId: number
  roleId: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  jobTitle?: string
  isActive?: boolean
  password: string
  passwordConfirmation: string
}

export interface UpdateUserRequest {
  dependencyId?: number
  roleId?: number
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  jobTitle?: string
}

export interface UpdateUserStatusRequest {
  isActive: boolean
}

export interface ResetUserPasswordRequest {
  password: string
  passwordConfirmation: string
}

export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl?: string
  lastPageUrl?: string
  nextPageUrl?: string
  previousPageUrl?: string
}

export interface DependenciesListApiResponse {
  data: DependencyPublic[]
  meta: PaginationMeta
}

export interface DependencyDetailApiResponse {
  data: DependencyPublic
}

export interface CreateDependencyApiResponse {
  data: DependencyPublic
}

export interface UpdateDependencyApiResponse {
  data: DependencyPublic
}

export interface UpdateDependencyStatusApiResponse {
  data: DependencyPublic
}

export interface UpdateDependencyManagersApiResponse {
  data: DependencyPublic
}

export interface LoginResponse {
  user: UserPublic
  token: string
}

export interface LoginApiResponse {
  data: LoginResponse
}

export interface ProfileApiResponse {
  data: UserPublic
}

export interface CreateUserApiResponse {
  data: UserPublic
}

export interface UsersListApiResponse {
  data: UserPublic[]
  meta: PaginationMeta
}

export interface UserDetailApiResponse {
  data: UserPublic
}

export interface UpdateUserApiResponse {
  data: UserPublic
}

export interface UpdateUserStatusApiResponse {
  data: UserPublic
}

export interface ResetUserPasswordApiResponse {
  message: string
}

export interface LogoutApiResponse {
  message: string
}

export interface ApiErrorDetail {
  field?: string
  message: string
  rule?: string
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: ApiErrorDetail[]
}

export interface ApiErrorResponse {
  error: ApiErrorBody
}

export interface ReportCategoryPublic {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  requiereDescripcion: boolean
  dependenciaId?: number
}

export interface ReportCategoriesListApiResponse {
  data: ReportCategoryPublic[]
}

export interface ReportPublic {
  id: number
  version: number
  folio: string
  categoriaId: number
  categoriaCodigo: string
  categoria: string
  descripcion?: string
  direccion?: string
  latitud: number
  longitud: number
  precisionUbicacion?: number
  origenUbicacion: string
  estadoCodigo: string
  estado: string
  fotoUrl: string
  fotoUrlExpira: boolean
  estadoEvidencia: string
  dependencia?: ReportDependencyPublic
  asignacionActual?: ReportCurrentAssignmentPublic
  ciudadano?: ReportCitizenPublic
  historial?: ReportStatusHistoryPublic[]
  creadoEn: string
  actualizadoEn: string
}

export interface ReportDependencyPublic {
  id: number
  nombre: string
}

export interface ReportCurrentAssignmentPublic {
  id: number
  prioridad: string
  observaciones?: string
  asignadoEn: string
  fechaLimite?: string
  equipo: ReportAssignedTeamPublic
}

export interface ReportAssignedTeamPublic {
  id: number
  nombre: string
  dependenciaId: number
  lider?: ReportStatusActorPublic
}

export interface ReportCitizenPublic {
  id: number
  nombre: string
  email: string
}

export interface ReportStatusActorPublic {
  id: number
  nombre: string
}

export interface ReportStatusHistoryPublic {
  id: number
  estadoAnteriorCodigo?: string
  estadoAnterior?: string
  estadoNuevoCodigo: string
  estadoNuevo: string
  origen: string
  observacion?: string
  cambiadoPor?: ReportStatusActorPublic
  creadoEn: string
}

export interface ReportsListApiResponse {
  data: ReportPublic[]
  meta: PaginationMeta
}

export interface ReportDetailApiResponse {
  id: number
  version: number
  folio: string
  categoriaId: number
  categoriaCodigo: string
  categoria: string
  descripcion?: string
  direccion?: string
  latitud: number
  longitud: number
  precisionUbicacion?: number
  origenUbicacion: string
  estadoCodigo: string
  estado: string
  fotoUrl: string
  fotoUrlExpira: boolean
  estadoEvidencia: string
  dependencia?: ReportDependencyPublic
  asignacionActual?: ReportCurrentAssignmentPublic
  ciudadano?: ReportCitizenPublic
  historial: ReportStatusHistoryPublic[]
  creadoEn: string
  actualizadoEn: string
}

export interface UpdateReportStatusRequest {
  status: string
  expectedVersion: number
  note?: string
}

export interface ReportDuplicateCandidateSummary {
  id: number
  folio: string
  categoria: string
  estadoCodigo: string
  latitud: number
  longitud: number
  direccion?: string
  creadoEn: string
}

export interface ReportDuplicateReviewPublic {
  id: number
  estado: string
  distanciaMetros: number
  detectadoEn: string
  revisadoEn?: string
  observacion?: string
  revisadoPor?: ReportStatusActorPublic
  reporte: ReportDuplicateCandidateSummary
}

export interface ReportDuplicateReviewsApiResponse {
  data: ReportDuplicateReviewPublic[]
  reglas: ReportDuplicateRulesPublic
}

export interface ReportDuplicateRulesPublic {
  distanciaMaximaMetros: number
  ventanaMaximaHoras: number
}

export interface ReviewReportDuplicateRequest {
  status: string
  note?: string
}

export interface WorkTeamUserPublic {
  id: number
  nombre: string
  email: string
  puesto?: string
}

export interface WorkTeamPublic {
  id: number
  dependencia: ReportDependencyPublic
  nombre: string
  descripcion?: string
  activo: boolean
  lider?: WorkTeamUserPublic
  integrantes: WorkTeamUserPublic[]
  creadoEn: string
  actualizadoEn: string
}

export interface WorkTeamsListApiResponse {
  data: WorkTeamPublic[]
  meta: PaginationMeta
}

export interface WorkTeamDetailApiResponse {
  data: WorkTeamPublic
}

export interface CreateWorkTeamRequest {
  dependencyId: number
  name: string
  description?: string
  leaderUserId: number
  memberUserIds: number[]
}

export interface UpdateWorkTeamRequest {
  name?: string
  description?: string
  leaderUserId?: number
}

export interface UpdateWorkTeamStatusRequest {
  isActive: boolean
}

export interface UpdateWorkTeamMembersRequest {
  memberUserIds: number[]
}

export interface AssignReportRequest {
  workTeamId: number
  expectedVersion: number
  priority: string
  dueAt?: string
  observations?: string
}

export interface UnassignReportRequest {
  expectedVersion: number
  note: string
}

export interface ReportAssignmentPublic {
  id: number
  reporteId: number
  equipo: WorkTeamPublic
  prioridad: string
  observaciones?: string
  asignadoEn: string
  fechaLimite?: string
  asignadoPor?: WorkTeamUserPublic
  activa: boolean
  retiradaEn?: string
  motivoRetiro?: string
  retiradaPor?: WorkTeamUserPublic
}

export interface ReportAssignmentApiResponse {
  data: ReportAssignmentPublic
}

export interface ReportAssignmentsListApiResponse {
  data: ReportAssignmentPublic[]
}
