import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { hasPermission, type Permission } from '#services/authorization_service'

interface PermissionMiddlewareOptions {
  permission: Permission
}

export default class PermissionMiddleware {
  async handle({ auth }: HttpContext, next: NextFn, options: PermissionMiddlewareOptions) {
    const user = auth.getUserOrFail()

    await user.load((preloader) => {
      preloader.load('role')
    })

    if (!hasPermission(user.role.slug, options.permission)) {
      throw new Exception('No tienes el permiso requerido para realizar esta acción', {
        status: 403,
        code: 'E_PERMISSION_REQUIRED',
      })
    }

    return next()
  }
}
