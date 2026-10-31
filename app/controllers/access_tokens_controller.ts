import User from '#models/user'
import AuthService from '#services/auth_service'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class AccessTokensController {
  /**
   * @store
   * @operationId login
   * @summary Iniciar sesion
   * @description Valida email y password contra la tabla credentials y devuelve un token de acceso. Limitado a 5 intentos por minuto.
   * @requestBody <LoginRequest>
   * @responseBody 200 - <LoginApiResponse>
   * @responseBody 400 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   * @responseBody 429 - <ApiErrorResponse>
   */
  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await AuthService.login(email, password, request.ip())

    await user.load((preloader) => {
      preloader.load('role')
      preloader.load('dependency')
    })

    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  /**
   * @destroy
   * @operationId logout
   * @summary Cerrar sesión
   * @description Elimina el token de acceso actual del usuario autenticado.
   * @responseBody 200 - <LogoutApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
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
