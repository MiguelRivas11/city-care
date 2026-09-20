export interface UserPublic {
  id: number
  dependencyId: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  jobTitle?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  initials: string
}

export interface LoginResponse {
  user: UserPublic
  token: string
}