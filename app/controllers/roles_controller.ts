import type { HttpContext } from '@adonisjs/core/http'

import Role from '#models/role'
import { getRolePermissions, isGlobalAdministrator } from '#services/authorization_service'

export default class RolesController {
  /**
   * @index
   * @operationId listRoles
   * @summary Listar roles asignables
   * @description Devuelve la matriz de permisos de cada rol que el usuario autenticado puede asignar. El administrador de dependencia solamente puede asignar el rol user.
   * @responseBody 200 - <RolesListApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   */
  async index({ auth }: HttpContext) {
    const actor = auth.getUserOrFail()
    const query = Role.query().orderBy('name', 'asc')

    if (!isGlobalAdministrator(actor)) {
      query.where('slug', 'user')
    }

    const roles = await query

    return {
      data: roles.map((role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
        ...(role.description ? { description: role.description } : {}),
        permissions: getRolePermissions(role.slug),
      })),
    }
  }
}
