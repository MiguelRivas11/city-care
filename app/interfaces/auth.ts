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
