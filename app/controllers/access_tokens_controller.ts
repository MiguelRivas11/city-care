import User from '#models/user'
import AuthService from '#services/auth_service'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class AccessTokensController {
  /**
   * @store
   * @summary Iniciar sesion
   * @description Valida email y password contra la tabla credentials y devuelve un token de acceso. Limitado a 5 intentos por minuto.
   * @requestBody {"email": "admin@citycare.com", "password": "Admin1234"}
   * @responseBody 200 - <LoginResponse>
   * @responseBody 400 - Credenciales invalidas
   * @responseBody 429 - Demasiados intentos, intenta mas tarde
   */
  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await AuthService.login(email, password, request.ip())
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  /**
   * @destroy
   * @summary Cerrar sesion
   * @description Elimina el token de acceso actual del usuario autenticado
   * @responseBody 200 - {"message": "Logged out successfully"}
   */
  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }
}