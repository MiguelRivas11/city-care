import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  /**
   * @show
   * @summary Obtener perfil del usuario autenticado
   * @description Devuelve los datos del usuario asociado al token de acceso actual
   * @responseBody 200 - <UserPublic>
   */
  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }
}