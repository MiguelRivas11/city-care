import hash from '@adonisjs/core/services/hash'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

import Role from '#models/role'
import User from '#models/user'
import Credential from '#models/credential'
import WorkTeam from '#models/work_team'
import UserTransformer from '#transformers/user_transformer'
import {
  assertActiveDependency,
  assertAssignableRole,
  assertDependencyAccess,
  assertManageableRole,
  isGlobalAdministrator,
} from '#services/authorization_service'
import {
  listUsersValidator,
  resetUserPasswordValidator,
  updateUserStatusValidator,
  updateUserValidator,
} from '#validators/user'

const userNotFound = () =>
  new Exception('Usuario no encontrado', {
    status: 404,
    code: 'E_USER_NOT_FOUND',
  })

function parseUserId(value: string): number {
  const id = Number(value)

  if (!Number.isSafeInteger(id) || id < 1) {
    throw userNotFound()
  }

  return id
}

async function findUserOrFail(id: number): Promise<User> {
  const user = await User.find(id)

  if (!user) {
    throw userNotFound()
  }

  return user
}

async function loadPublicRelations(user: User): Promise<void> {
  await user.load((preloader) => {
    preloader.load('role')
    preloader.load('dependency')
  })
}

async function assertUserAccess(actor: User, user: User): Promise<void> {
  assertDependencyAccess(actor, user.dependencyId)
  const targetRole = await Role.findOrFail(user.roleId)
  assertManageableRole(actor, targetRole)
}

export default class AdminUsersController {
  /**
   * @index
   * @operationId listUsers
   * @summary Listar y buscar usuarios
   * @description Devuelve usuarios paginados. Permite buscar por nombre, apellido o correo y filtrar por rol, dependencia y estado.
   * @paramQuery page - Número de página - @type(number)
   * @paramQuery perPage - Registros por página, máximo 100 - @type(number)
   * @paramQuery search - Nombre, apellido o correo - @type(string)
   * @paramQuery roleId - Identificador del rol - @type(number)
   * @paramQuery dependencyId - Identificador de la dependencia - @type(number)
   * @paramQuery isActive - Estado activo o inactivo - @type(boolean)
   * @responseBody 200 - <UsersListApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async index({ auth, request, serialize }: HttpContext) {
    const filters = await request.validateUsing(listUsersValidator)
    const actor = auth.getUserOrFail()
    const page = filters.page ?? 1
    const perPage = filters.perPage ?? 20

    const query = User.query().preload('role').preload('dependency').orderBy('id', 'desc')

    if (filters.search) {
      const search = `%${filters.search}%`
      query.where((searchQuery) => {
        searchQuery
          .whereILike('first_name', search)
          .orWhereILike('last_name', search)
          .orWhereILike('email', search)
      })
    }

    if (filters.roleId !== undefined) {
      query.where('role_id', filters.roleId)
    }

    if (!isGlobalAdministrator(actor)) {
      if (filters.dependencyId !== undefined) {
        assertDependencyAccess(actor, filters.dependencyId)
      }
      query.where('dependency_id', actor.dependencyId)
      query.whereHas('role', (roleQuery) => {
        roleQuery.where('slug', 'user')
      })
    } else if (filters.dependencyId !== undefined) {
      query.where('dependency_id', filters.dependencyId)
    }

    if (filters.isActive !== undefined) {
      query.where('is_active', filters.isActive)
    }

    const users = await query.paginate(page, perPage)
    const collection = await serialize(UserTransformer.transform(users.all()))

    return {
      data: collection.data,
      meta: users.getMeta(),
    }
  }

  /**
   * @show
   * @operationId getUser
   * @summary Consultar el detalle de un usuario
   * @paramPath id - Identificador del usuario - @type(number) @required
   * @responseBody 200 - <UserDetailApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   */
  async show({ auth, params, serialize }: HttpContext) {
    const user = await findUserOrFail(parseUserId(params.id))
    await assertUserAccess(auth.getUserOrFail(), user)
    await loadPublicRelations(user)

    return serialize(UserTransformer.transform(user))
  }

  /**
   * @update
   * @operationId updateUser
   * @summary Editar un usuario
   * @description Actualiza datos personales, correo, dependencia o rol. Si cambia el correo, también actualiza credentials dentro de la misma transacción.
   * @paramPath id - Identificador del usuario - @type(number) @required
   * @requestBody <UpdateUserRequest>
   * @responseBody 200 - <UpdateUserApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   * @responseBody 409 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async update({ auth, params, request, serialize }: HttpContext) {
    const id = parseUserId(params.id)
    const user = await findUserOrFail(id)
    const payload = await request.validateUsing(updateUserValidator, {
      meta: { userId: id },
    })

    if (Object.keys(payload).length === 0) {
      throw new Exception('Envía al menos un campo para actualizar', {
        status: 422,
        code: 'E_EMPTY_UPDATE',
      })
    }

    const currentUser = auth.getUserOrFail()
    await assertUserAccess(currentUser, user)

    if (payload.dependencyId !== undefined) {
      assertDependencyAccess(currentUser, payload.dependencyId)
      await assertActiveDependency(payload.dependencyId)
    }

    if (payload.roleId !== undefined) {
      const nextRole = await Role.findOrFail(payload.roleId)
      assertAssignableRole(currentUser, nextRole)
    }

    if (currentUser.id === user.id && payload.roleId !== undefined) {
      const nextRole = await Role.find(payload.roleId)

      if (!nextRole || nextRole.slug !== 'admin') {
        throw new Exception('No puedes retirar tu propio rol de administrador', {
          status: 422,
          code: 'E_SELF_ROLE_CHANGE',
        })
      }
    }

    await db.transaction(async (trx) => {
      user.useTransaction(trx)

      if (payload.dependencyId !== undefined) user.dependencyId = payload.dependencyId
      if (payload.roleId !== undefined) user.roleId = payload.roleId
      if (payload.firstName !== undefined) user.firstName = payload.firstName
      if (payload.lastName !== undefined) user.lastName = payload.lastName
      if (payload.phoneNumber !== undefined) user.phoneNumber = payload.phoneNumber
      if (payload.jobTitle !== undefined) user.jobTitle = payload.jobTitle

      if (payload.email !== undefined) {
        const credential = await Credential.query({ client: trx }).where('user_id', user.id).first()

        if (!credential) {
          throw new Exception('El usuario no tiene una credencial asociada', {
            status: 409,
            code: 'E_CREDENTIAL_NOT_FOUND',
          })
        }

        user.email = payload.email
        credential.email = payload.email
        await credential.save()
      }

      await user.save()
    })

    logger.info(
      { actorUserId: currentUser.id, targetUserId: user.id, fields: Object.keys(payload) },
      'admin_user_updated'
    )

    await loadPublicRelations(user)
    return serialize(UserTransformer.transform(user))
  }

  /**
   * @updateStatus
   * @operationId updateUserStatus
   * @summary Activar o desactivar un usuario
   * @description Aplica baja lógica con is_active. Al desactivar elimina todos los tokens del usuario en la misma transacción.
   * @paramPath id - Identificador del usuario - @type(number) @required
   * @requestBody <UpdateUserStatusRequest>
   * @responseBody 200 - <UpdateUserStatusApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async updateStatus({ auth, params, request, serialize }: HttpContext) {
    const user = await findUserOrFail(parseUserId(params.id))
    const payload = await request.validateUsing(updateUserStatusValidator)
    const currentUser = auth.getUserOrFail()
    await assertUserAccess(currentUser, user)

    if (currentUser.id === user.id && payload.isActive === false) {
      throw new Exception('No puedes desactivar tu propia cuenta', {
        status: 422,
        code: 'E_SELF_DEACTIVATION',
      })
    }

    if (!payload.isActive) {
      const activeTeam = await WorkTeam.query()
        .where('is_active', true)
        .where((teamQuery) => {
          teamQuery
            .where('leader_user_id', user.id)
            .orWhereHas('members', (memberQuery) => memberQuery.where('users.id', user.id))
        })
        .first()

      if (activeTeam) {
        throw new Exception(
          'Retira al usuario de sus equipos activos antes de desactivar la cuenta',
          {
            status: 409,
            code: 'E_USER_HAS_ACTIVE_TEAM',
          }
        )
      }
    }

    await db.transaction(async (trx) => {
      user.useTransaction(trx)
      user.isActive = payload.isActive
      await user.save()

      if (!payload.isActive) {
        await trx.from('auth_access_tokens').where('tokenable_id', user.id).delete()
      }
    })

    logger.info(
      { actorUserId: currentUser.id, targetUserId: user.id, isActive: payload.isActive },
      'admin_user_status_updated'
    )

    await loadPublicRelations(user)
    return serialize(UserTransformer.transform(user))
  }

  /**
   * @resetPassword
   * @operationId resetUserPassword
   * @summary Restablecer la contraseña de un usuario
   * @description Reemplaza password_hash y elimina todas las sesiones del usuario. No devuelve la contraseña ni inicia sesión por la cuenta modificada.
   * @paramPath id - Identificador del usuario - @type(number) @required
   * @requestBody <ResetUserPasswordRequest>
   * @responseBody 200 - <ResetUserPasswordApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   * @responseBody 409 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async resetPassword({ auth, params, request }: HttpContext) {
    const user = await findUserOrFail(parseUserId(params.id))
    await assertUserAccess(auth.getUserOrFail(), user)
    const payload = await request.validateUsing(resetUserPasswordValidator)
    const passwordHash = await hash.make(payload.password)

    await db.transaction(async (trx) => {
      const credential = await Credential.query({ client: trx }).where('user_id', user.id).first()

      if (!credential) {
        throw new Exception('El usuario no tiene una credencial asociada', {
          status: 409,
          code: 'E_CREDENTIAL_NOT_FOUND',
        })
      }

      credential.passwordHash = passwordHash
      await credential.save()
      await trx.from('auth_access_tokens').where('tokenable_id', user.id).delete()
    })

    logger.info(
      { actorUserId: auth.getUserOrFail().id, targetUserId: user.id },
      'admin_user_password_reset'
    )

    return {
      message: 'Contraseña restablecida y sesiones revocadas correctamente',
    }
  }
}
