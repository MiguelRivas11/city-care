import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { Exception } from '@adonisjs/core/exceptions'
import AuthService from '#services/auth_service'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards)

    const user = ctx.auth.getUserOrFail()

    if (!user.isActive) {
      await AuthService.revokeAllTokens(user)

      throw new Exception('La cuenta está inactiva', {
        status: 403,
        code: 'E_ACCOUNT_INACTIVE',
      })
    }

    return next()
  }
}
