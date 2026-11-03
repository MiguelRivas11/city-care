import { Exception } from '@adonisjs/core/exceptions'

import Dependency from '#models/dependency'
import type Role from '#models/role'
import type User from '#models/user'

export const permissions = [
  'roles.list',
  'dependencies.list',
  'dependencies.read',
  'dependencies.create',
  'dependencies.update',
  'dependencies.status',
  'dependencies.manage',
  'users.list',
  'users.read',
  'users.create',
  'users.update',
  'users.status',
  'users.reset_password',
  'reports.list',
  'reports.read',
  'reports.status',
  'reports.assign',
  'teams.list',
  'teams.read',
  'teams.create',
  'teams.update',
  'teams.status',
  'teams.members',
] as const

export type Permission = (typeof permissions)[number]

const rolePermissions: Record<string, readonly Permission[]> = {
  admin: permissions,
  dependency_admin: [
    'roles.list',
    'dependencies.list',
    'dependencies.read',
    'users.list',
    'users.read',
    'users.create',
    'users.update',
    'users.status',
    'users.reset_password',
    'reports.list',
    'reports.read',
    'reports.status',
    'reports.assign',
    'teams.list',
    'teams.read',
    'teams.create',
    'teams.update',
    'teams.status',
    'teams.members',
  ],
  user: [],
}

export function getRolePermissions(roleSlug: string): Permission[] {
  return [...(rolePermissions[roleSlug] ?? [])]
}

export function hasPermission(roleSlug: string, permission: Permission): boolean {
  return getRolePermissions(roleSlug).includes(permission)
}

export function isGlobalAdministrator(user: User): boolean {
  return user.role.slug === 'admin'
}

export function assertDependencyAccess(actor: User, dependencyId: number): void {
  if (!isGlobalAdministrator(actor) && actor.dependencyId !== dependencyId) {
    throw new Exception('No puedes administrar usuarios de otra dependencia', {
      status: 403,
      code: 'E_DEPENDENCY_SCOPE',
    })
  }
}

export async function assertActiveDependency(dependencyId: number): Promise<void> {
  const dependency = await Dependency.find(dependencyId)

  if (!dependency?.isActive) {
    throw new Exception('La dependencia seleccionada está inactiva', {
      status: 409,
      code: 'E_DEPENDENCY_INACTIVE',
    })
  }
}

export function assertAssignableRole(actor: User, role: Role): void {
  if (!isGlobalAdministrator(actor) && role.slug !== 'user') {
    throw new Exception('No puedes asignar ese rol', {
      status: 403,
      code: 'E_ROLE_ASSIGNMENT_FORBIDDEN',
    })
  }
}

export function assertManageableRole(actor: User, role: Role): void {
  if (!isGlobalAdministrator(actor) && role.slug !== 'user') {
    throw new Exception('No puedes administrar una cuenta con ese rol', {
      status: 403,
      code: 'E_ROLE_SCOPE',
    })
  }
}
