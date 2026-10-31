import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'

export default class AdminMiddleware {
  async handle({ auth }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()

    await user.load((preloader) => {
      preloader.load('role')
    })

    if (user.role.slug !== 'admin') {
      throw new Exception('No tienes permisos para realizar esta acción', {
        status: 403,
        code: 'E_ADMIN_REQUIRED',
      })
    }

    return next()
  }
}
