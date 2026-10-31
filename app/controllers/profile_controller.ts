import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  /**
   * @show
   * @operationId getProfile
   * @summary Obtener perfil del usuario autenticado
   * @description Devuelve los datos del usuario asociado al token de acceso actual
   * @responseBody 200 - <ProfileApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   */
  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    await user.load((preloader) => {
      preloader.load('role')
      preloader.load('dependency')
    })

    return serialize(UserTransformer.transform(user))
  }
}
