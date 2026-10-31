import hash from '@adonisjs/core/services/hash'
import { Exception } from '@adonisjs/core/exceptions'
import limiter from '@adonisjs/limiter/services/main'
import Credential from '#models/credential'
import User from '#models/user'

const ACCOUNT_INACTIVE_ERROR = {
  status: 403,
  code: 'E_ACCOUNT_INACTIVE',
} as const

export default class AuthService {
  /**
   * Verifica el email y password contra la tabla `credentials`.
   * Aplica rate limiting: 5 intentos por minuto por IP+email,
   * bloqueando 15 minutos si se exceden.
   * Si son correctos, devuelve el User asociado.
   */
  static async login(email: string, password: string, ip: string): Promise<User> {
    const loginLimiter = limiter.use({
      requests: 5,
      duration: '1 min',
      blockDuration: '15 mins',
    })

    // Clave por IP + email: si un atacante prueba muchos emails desde
    // la misma IP, cada email tiene su propio contador, pero un usuario
    // legitimo no se ve bloqueado por intentos de otros.
    const key = `login_${ip}_${email}`

    const [error, user] = await loginLimiter.penalize(key, async () => {
      const credential = await Credential.query().where('email', email).first()

      if (!credential) {
        throw new Exception('Credenciales invalidas', {
          status: 400,
          code: 'E_INVALID_CREDENTIALS',
        })
      }

      const isPasswordValid = await hash.verify(credential.passwordHash, password)

      if (!isPasswordValid) {
        throw new Exception('Credenciales invalidas', {
          status: 400,
          code: 'E_INVALID_CREDENTIALS',
        })
      }

      const authenticatedUser = await User.findOrFail(credential.userId)

      if (!authenticatedUser.isActive) {
        await User.accessTokens.deleteAll(authenticatedUser)

        throw new Exception('La cuenta está inactiva', ACCOUNT_INACTIVE_ERROR)
      }

      return authenticatedUser
    })

    if (error) {
      // Puede ser nuestra excepcion de credenciales invalidas (400)
      // o la excepcion de limite excedido (429), ambas ya vienen
      // con su status correcto.
      throw error
    }

    return user!
  }

  /**
   * Revoca todas las sesiones emitidas para un usuario. Debe utilizarse
   * cuando una cuenta sea desactivada o cuando se fuerce un cierre global.
   */
  static async revokeAllTokens(user: User): Promise<void> {
    await User.accessTokens.deleteAll(user)
  }
}
