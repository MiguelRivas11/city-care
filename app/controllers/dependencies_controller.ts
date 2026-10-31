import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

import Dependency from '#models/dependency'
import Role from '#models/role'
import User from '#models/user'
import { assertDependencyAccess, isGlobalAdministrator } from '#services/authorization_service'
import {
  createDependencyValidator,
  listDependenciesValidator,
  updateDependencyManagersValidator,
  updateDependencyStatusValidator,
  updateDependencyValidator,
} from '#validators/dependency'

const dependencyNotFound = () =>
  new Exception('Dependencia no encontrada', {
    status: 404,
    code: 'E_DEPENDENCY_NOT_FOUND',
  })

function parseDependencyId(value: string): number {
  const id = Number(value)

  if (!Number.isSafeInteger(id) || id < 1) {
    throw dependencyNotFound()
  }

  return id
}

async function findDependencyOrFail(id: number): Promise<Dependency> {
  const dependency = await Dependency.find(id)

  if (!dependency) {
    throw dependencyNotFound()
  }

  return dependency
}

async function loadManagers(dependency: Dependency): Promise<void> {
  await dependency.load('users', (query) => {
    query
      .where('is_active', true)
      .whereHas('role', (roleQuery) => roleQuery.where('slug', 'dependency_admin'))
      .orderBy('first_name', 'asc')
  })
}

function toPublicDependency(dependency: Dependency) {
  return {
    id: dependency.id,
    name: dependency.name,
    ...(dependency.description ? { description: dependency.description } : {}),
    isActive: Boolean(dependency.isActive),
    managers: dependency.users.map((manager) => ({
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
    })),
  }
}

export default class DependenciesController {
  /**
   * @index
   * @operationId listDependencies
   * @summary Listar dependencias
   * @description Devuelve dependencias paginadas con búsqueda, filtro de estado y responsables. Un administrador de dependencia solo recibe la suya.
   * @paramQuery page - Número de página - @type(number)
   * @paramQuery perPage - Registros por página, máximo 100 - @type(number)
   * @paramQuery search - Nombre o descripción - @type(string)
   * @paramQuery isActive - Estado activo o inactivo - @type(boolean)
   * @responseBody 200 - <DependenciesListApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async index({ auth, request }: HttpContext) {
    const actor = auth.getUserOrFail()
    const filters = await request.validateUsing(listDependenciesValidator)
    const query = Dependency.query()
      .preload('users', (usersQuery) => {
        usersQuery
          .where('is_active', true)
          .whereHas('role', (roleQuery) => roleQuery.where('slug', 'dependency_admin'))
          .orderBy('first_name', 'asc')
      })
      .orderBy('name', 'asc')

    if (!isGlobalAdministrator(actor)) {
      query.where('id', actor.dependencyId)
    }

    if (filters.search) {
      const search = `%${filters.search}%`
      query.where((searchQuery) => {
        searchQuery.whereILike('name', search).orWhereILike('description', search)
      })
    }

    if (filters.isActive !== undefined) {
      query.where('is_active', filters.isActive)
    }

    const dependencies = await query.paginate(filters.page ?? 1, filters.perPage ?? 20)

    return {
      data: dependencies.all().map(toPublicDependency),
      meta: dependencies.getMeta(),
    }
  }

  /**
   * @store
   * @operationId createDependency
   * @summary Crear una dependencia
   * @requestBody <CreateDependencyRequest>
   * @responseBody 201 - <CreateDependencyApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(createDependencyValidator)
    const dependency = await Dependency.create({
      name: payload.name,
      description: payload.description ?? null,
      isActive: payload.isActive ?? true,
    })
    await loadManagers(dependency)

    logger.info(
      { actorUserId: auth.getUserOrFail().id, dependencyId: dependency.id },
      'dependency_created'
    )

    return response.created({ data: toPublicDependency(dependency) })
  }

  /**
   * @show
   * @operationId getDependency
   * @summary Consultar una dependencia
   * @paramPath id - Identificador de la dependencia - @type(number) @required
   * @responseBody 200 - <DependencyDetailApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   */
  async show({ auth, params }: HttpContext) {
    const dependency = await findDependencyOrFail(parseDependencyId(params.id))
    assertDependencyAccess(auth.getUserOrFail(), dependency.id)
    await loadManagers(dependency)

    return { data: toPublicDependency(dependency) }
  }

  /**
   * @update
   * @operationId updateDependency
   * @summary Editar una dependencia
   * @paramPath id - Identificador de la dependencia - @type(number) @required
   * @requestBody <UpdateDependencyRequest>
   * @responseBody 200 - <UpdateDependencyApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async update({ auth, params, request }: HttpContext) {
    const dependency = await findDependencyOrFail(parseDependencyId(params.id))
    const payload = await request.validateUsing(updateDependencyValidator, {
      meta: { dependencyId: dependency.id },
    })

    if (Object.keys(payload).length === 0) {
      throw new Exception('Envía al menos un campo para actualizar la dependencia', {
        status: 422,
        code: 'E_EMPTY_DEPENDENCY_UPDATE',
      })
    }

    if (payload.name !== undefined) dependency.name = payload.name
    if (payload.description !== undefined) dependency.description = payload.description
    await dependency.save()
    await loadManagers(dependency)

    logger.info(
      {
        actorUserId: auth.getUserOrFail().id,
        dependencyId: dependency.id,
        fields: Object.keys(payload),
      },
      'dependency_updated'
    )

    return { data: toPublicDependency(dependency) }
  }

  /**
   * @updateStatus
   * @operationId updateDependencyStatus
   * @summary Activar o desactivar una dependencia
   * @description Aplica baja lógica. Una dependencia con usuarios activos no puede desactivarse.
   * @paramPath id - Identificador de la dependencia - @type(number) @required
   * @requestBody <UpdateDependencyStatusRequest>
   * @responseBody 200 - <UpdateDependencyStatusApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   * @responseBody 409 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async updateStatus({ auth, params, request }: HttpContext) {
    const dependency = await findDependencyOrFail(parseDependencyId(params.id))
    const payload = await request.validateUsing(updateDependencyStatusValidator)

    if (!payload.isActive) {
      const activeUser = await User.query()
        .where('dependency_id', dependency.id)
        .where('is_active', true)
        .first()

      if (activeUser) {
        throw new Exception('No puedes desactivar una dependencia con usuarios activos', {
          status: 409,
          code: 'E_DEPENDENCY_HAS_ACTIVE_USERS',
        })
      }
    }

    dependency.isActive = payload.isActive
    await dependency.save()
    await loadManagers(dependency)

    logger.info(
      {
        actorUserId: auth.getUserOrFail().id,
        dependencyId: dependency.id,
        isActive: payload.isActive,
      },
      'dependency_status_updated'
    )

    return { data: toPublicDependency(dependency) }
  }

  /**
   * @updateManagers
   * @operationId updateDependencyManagers
   * @summary Asignar responsables de una dependencia
   * @description Reemplaza los responsables actuales. Los seleccionados deben ser usuarios activos de la dependencia con rol user o dependency_admin.
   * @paramPath id - Identificador de la dependencia - @type(number) @required
   * @requestBody <UpdateDependencyManagersRequest>
   * @responseBody 200 - <UpdateDependencyManagersApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   * @responseBody 409 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async updateManagers({ auth, params, request }: HttpContext) {
    const dependency = await findDependencyOrFail(parseDependencyId(params.id))
    const payload = await request.validateUsing(updateDependencyManagersValidator)
    const userIds = [...new Set(payload.userIds)]

    if (!dependency.isActive) {
      throw new Exception('La dependencia está inactiva', {
        status: 409,
        code: 'E_DEPENDENCY_INACTIVE',
      })
    }

    if (userIds.length !== payload.userIds.length) {
      throw new Exception('Los responsables no pueden estar duplicados', {
        status: 422,
        code: 'E_INVALID_DEPENDENCY_MANAGERS',
      })
    }

    const selectedUsers = await User.query()
      .whereIn('id', userIds)
      .where('dependency_id', dependency.id)
      .where('is_active', true)
      .preload('role')

    if (
      selectedUsers.length !== userIds.length ||
      selectedUsers.some((user) => !['user', 'dependency_admin'].includes(user.role.slug))
    ) {
      throw new Exception('Los responsables deben ser usuarios activos de la dependencia', {
        status: 422,
        code: 'E_INVALID_DEPENDENCY_MANAGERS',
      })
    }

    const managerRole = await Role.findByOrFail('slug', 'dependency_admin')
    const userRole = await Role.findByOrFail('slug', 'user')
    const currentManagers = await User.query()
      .where('dependency_id', dependency.id)
      .where('role_id', managerRole.id)

    await db.transaction(async (trx) => {
      for (const manager of currentManagers) {
        if (!userIds.includes(manager.id)) {
          manager.useTransaction(trx)
          manager.roleId = userRole.id
          await manager.save()
        }
      }

      for (const manager of selectedUsers) {
        manager.useTransaction(trx)
        manager.roleId = managerRole.id
        await manager.save()
      }
    })

    await loadManagers(dependency)

    logger.info(
      {
        actorUserId: auth.getUserOrFail().id,
        dependencyId: dependency.id,
        managerUserIds: userIds,
      },
      'dependency_managers_updated'
    )

    return { data: toPublicDependency(dependency) }
  }
}
