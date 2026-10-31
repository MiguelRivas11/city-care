import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

import User from '#models/user'
import Role from '#models/role'
import Credential from '#models/credential'
import UserTransformer from '#transformers/user_transformer'
import { createUserValidator } from '#validators/user'
import {
  assertActiveDependency,
  assertAssignableRole,
  assertDependencyAccess,
} from '#services/authorization_service'

export default class NewAccountController {
  /**
   * @store
   * @operationId createUser
   * @summary Crear una cuenta de usuario
   * @description Crea el perfil y las credenciales del usuario. Requiere el permiso users.create y respeta el alcance de dependencia.
   * @requestBody <CreateUserRequest>
   * @responseBody 201 - <CreateUserApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async store({ auth, request, serialize, response }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)
    const actor = auth.getUserOrFail()
    const role = await Role.findOrFail(payload.roleId)

    assertDependencyAccess(actor, payload.dependencyId)
    await assertActiveDependency(payload.dependencyId)
    assertAssignableRole(actor, role)

    /*
     * Generamos el hash antes de abrir la transacción para no mantener
     * la conexión ocupada mientras se procesa la contraseña.
     */
    const passwordHash = await hash.make(payload.password)

    /*
     * El usuario y sus credenciales se crean dentro de la misma
     * transacción. Si una operación falla, ambas se revierten.
     */
    const user = await db.transaction(async (trx) => {
      const createdUser = await User.create(
        {
          dependencyId: payload.dependencyId,
          roleId: payload.roleId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phoneNumber: payload.phoneNumber ?? null,
          jobTitle: payload.jobTitle ?? null,
          isActive: payload.isActive ?? true,
        },
        {
          client: trx,
        }
      )

      await Credential.create(
        {
          userId: createdUser.id,
          email: createdUser.email,
          passwordHash,
        },
        {
          client: trx,
        }
      )

      return createdUser
    })

    /*
     * Cargamos el rol para que UserTransformer pueda incluir
     * id, nombre y slug en la respuesta.
     */
    await user.load((preloader) => {
      preloader.load('role')
      preloader.load('dependency')
    })

    logger.info({ actorUserId: actor.id, targetUserId: user.id }, 'admin_user_created')

    return response.created(await serialize(UserTransformer.transform(user)))
  }
}
