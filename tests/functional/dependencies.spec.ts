import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'

import Credential from '#models/credential'
import Dependency from '#models/dependency'
import Role from '#models/role'
import User from '#models/user'

let sequence = 0

async function createRole(slug: string) {
  return Role.firstOrCreate(
    { slug },
    {
      name:
        slug === 'admin'
          ? 'Administrador'
          : slug === 'dependency_admin'
            ? 'Administrador de dependencia'
            : 'Usuario',
      slug,
      description: null,
    }
  )
}

async function createDependency(options: { name?: string; isActive?: boolean } = {}) {
  sequence += 1
  return Dependency.create({
    name: options.name ?? `Dependencia funcional ${Date.now()}-${sequence}`,
    description: 'Dependencia para pruebas',
    isActive: options.isActive ?? true,
  })
}

async function createUser(options: {
  roleSlug: string
  dependency: Dependency
  isActive?: boolean
}) {
  sequence += 1
  const role = await createRole(options.roleSlug)
  const email = `dependency-${Date.now()}-${sequence}@citycare.test`
  const user = await User.create({
    dependencyId: options.dependency.id,
    roleId: role.id,
    firstName: 'Usuario',
    lastName: 'Dependencia',
    email,
    phoneNumber: null,
    jobTitle: null,
    isActive: options.isActive ?? true,
  })

  await Credential.create({
    userId: user.id,
    email,
    passwordHash: await hash.make('DependencyPassword123!'),
  })

  const token = await User.accessTokens.create(user)
  return { user, role, token: token.value!.release() }
}

async function createAdminSession() {
  const dependency = await createDependency()
  const fixture = await createUser({ roleSlug: 'admin', dependency })
  return { ...fixture, dependency }
}

test.group('Dependencias 2.4', () => {
  test('rechaza el listado sin autenticación', async ({ client }) => {
    const response = await client.get('/api/v1/admin/dependencies')
    response.assertStatus(401)
  })

  test('rechaza a un usuario sin permiso de dependencias', async ({ client, assert }) => {
    const dependency = await createDependency()
    const normalUser = await createUser({ roleSlug: 'user', dependency })

    const response = await client.get('/api/v1/admin/dependencies').bearerToken(normalUser.token)

    response.assertStatus(403)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_PERMISSION_REQUIRED')
  })

  test('lista busca y filtra dependencias con responsables', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const target = await createDependency({ name: `Alumbrado buscable ${Date.now()}` })
    await createUser({ roleSlug: 'dependency_admin', dependency: target })

    const response = await client
      .get('/api/v1/admin/dependencies')
      .qs({ search: 'Alumbrado buscable', isActive: true, page: 1, perPage: 10 })
      .bearerToken(admin.token)

    response.assertStatus(200)
    const body = response.body() as unknown as {
      data: Array<{ id: number; isActive: boolean; managers: Array<{ id: number }> }>
      meta: { total: number }
    }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].id, target.id)
    assert.isTrue(body.data[0].isActive)
    assert.lengthOf(body.data[0].managers, 1)
    assert.equal(body.meta.total, 1)
  })

  test('limita al administrador de dependencia a consultar la suya', async ({ client, assert }) => {
    const ownDependency = await createDependency()
    const otherDependency = await createDependency()
    const manager = await createUser({ roleSlug: 'dependency_admin', dependency: ownDependency })

    const listResponse = await client.get('/api/v1/admin/dependencies').bearerToken(manager.token)
    listResponse.assertStatus(200)
    assert.deepEqual(
      (listResponse.body().data as Array<{ id: number }>).map((item) => item.id),
      [ownDependency.id]
    )

    const detailResponse = await client
      .get(`/api/v1/admin/dependencies/${otherDependency.id}`)
      .bearerToken(manager.token)
    detailResponse.assertStatus(403)
    assert.equal(detailResponse.body().error.code, 'E_DEPENDENCY_SCOPE')
  })

  test('crea una dependencia', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const name = `Nueva dependencia ${Date.now()}-${sequence}`

    const response = await client.post('/api/v1/admin/dependencies').bearerToken(admin.token).json({
      name,
      description: 'Descripción inicial',
      isActive: true,
    })

    response.assertStatus(201)
    const body = response.body() as unknown as {
      data: { name: string; isActive: boolean; managers: unknown[] }
    }
    assert.equal(body.data.name, name)
    assert.isTrue(body.data.isActive)
    assert.deepEqual(body.data.managers, [])
    assert.isNotNull(await Dependency.findBy('name', name))
  })

  test('rechaza nombres duplicados', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const dependency = await createDependency()

    const response = await client.post('/api/v1/admin/dependencies').bearerToken(admin.token).json({
      name: dependency.name,
    })

    response.assertStatus(422)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_VALIDATION_ERROR')
  })

  test('impide crear o trasladar usuarios a una dependencia inactiva', async ({
    client,
    assert,
  }) => {
    const admin = await createAdminSession()
    const inactiveDependency = await createDependency({ isActive: false })
    const activeDependency = await createDependency()
    const target = await createUser({ roleSlug: 'user', dependency: activeDependency })
    const userRole = await createRole('user')
    const email = `inactive-dependency-${Date.now()}-${sequence}@citycare.test`

    const createResponse = await client.post('/api/v1/admin/users').bearerToken(admin.token).json({
      dependencyId: inactiveDependency.id,
      roleId: userRole.id,
      firstName: 'Usuario',
      lastName: 'Bloqueado',
      email,
      password: 'InactiveDependency123!',
      passwordConfirmation: 'InactiveDependency123!',
    })
    createResponse.assertStatus(409)
    assert.equal(
      (createResponse.body() as unknown as { error: { code: string } }).error.code,
      'E_DEPENDENCY_INACTIVE'
    )

    const updateResponse = await client
      .patch(`/api/v1/admin/users/${target.user.id}`)
      .bearerToken(admin.token)
      .json({ dependencyId: inactiveDependency.id })
    updateResponse.assertStatus(409)
    assert.equal(
      (updateResponse.body() as unknown as { error: { code: string } }).error.code,
      'E_DEPENDENCY_INACTIVE'
    )
  })

  test('edita nombre y descripción y rechaza un cuerpo vacío', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const dependency = await createDependency()
    const nextName = `Dependencia editada ${Date.now()}-${sequence}`

    const updateResponse = await client
      .patch(`/api/v1/admin/dependencies/${dependency.id}`)
      .bearerToken(admin.token)
      .json({ name: nextName, description: 'Descripción actualizada' })
    updateResponse.assertStatus(200)
    assert.equal(updateResponse.body().data.name, nextName)

    const emptyResponse = await client
      .patch(`/api/v1/admin/dependencies/${dependency.id}`)
      .bearerToken(admin.token)
      .json({})
    emptyResponse.assertStatus(422)
    assert.equal(emptyResponse.body().error.code, 'E_EMPTY_DEPENDENCY_UPDATE')
  })

  test('impide desactivar una dependencia con usuarios activos', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const dependency = await createDependency()
    await createUser({ roleSlug: 'user', dependency })

    const response = await client
      .patch(`/api/v1/admin/dependencies/${dependency.id}/status`)
      .bearerToken(admin.token)
      .json({ isActive: false })

    response.assertStatus(409)
    assert.equal(response.body().error.code, 'E_DEPENDENCY_HAS_ACTIVE_USERS')
  })

  test('desactiva y reactiva una dependencia vacía mediante baja lógica', async ({
    client,
    assert,
  }) => {
    const admin = await createAdminSession()
    const dependency = await createDependency()

    const disableResponse = await client
      .patch(`/api/v1/admin/dependencies/${dependency.id}/status`)
      .bearerToken(admin.token)
      .json({ isActive: false })
    disableResponse.assertStatus(200)
    assert.isFalse(disableResponse.body().data.isActive)

    const enableResponse = await client
      .patch(`/api/v1/admin/dependencies/${dependency.id}/status`)
      .bearerToken(admin.token)
      .json({ isActive: true })
    enableResponse.assertStatus(200)
    assert.isTrue(enableResponse.body().data.isActive)
  })

  test('asigna reemplaza y retira responsables de forma transaccional', async ({
    client,
    assert,
  }) => {
    const admin = await createAdminSession()
    const dependency = await createDependency()
    const first = await createUser({ roleSlug: 'user', dependency })
    const second = await createUser({ roleSlug: 'user', dependency })

    const assignResponse = await client
      .patch(`/api/v1/admin/dependencies/${dependency.id}/managers`)
      .bearerToken(admin.token)
      .json({ userIds: [first.user.id, second.user.id] })
    assignResponse.assertStatus(200)
    assert.sameMembers(
      assignResponse.body().data.managers.map((manager: { id: number }) => manager.id),
      [first.user.id, second.user.id]
    )

    const replaceResponse = await client
      .patch(`/api/v1/admin/dependencies/${dependency.id}/managers`)
      .bearerToken(admin.token)
      .json({ userIds: [second.user.id] })
    replaceResponse.assertStatus(200)
    assert.deepEqual(
      replaceResponse.body().data.managers.map((manager: { id: number }) => manager.id),
      [second.user.id]
    )

    await first.user.refresh()
    await second.user.refresh()
    const firstRole = await Role.findOrFail(first.user.roleId)
    const secondRole = await Role.findOrFail(second.user.roleId)
    assert.equal(firstRole.slug, 'user')
    assert.equal(secondRole.slug, 'dependency_admin')
  })

  test('rechaza responsables externos inactivos duplicados o con rol superior', async ({
    client,
    assert,
  }) => {
    const admin = await createAdminSession()
    const dependency = await createDependency()
    const otherDependency = await createDependency()
    const external = await createUser({ roleSlug: 'user', dependency: otherDependency })
    const inactive = await createUser({ roleSlug: 'user', dependency, isActive: false })
    const superior = await createUser({ roleSlug: 'admin', dependency })

    for (const userIds of [
      [external.user.id],
      [inactive.user.id],
      [superior.user.id],
      [external.user.id, external.user.id],
    ]) {
      const response = await client
        .patch(`/api/v1/admin/dependencies/${dependency.id}/managers`)
        .bearerToken(admin.token)
        .json({ userIds })
      response.assertStatus(422)
      assert.equal(response.body().error.code, 'E_INVALID_DEPENDENCY_MANAGERS')
    }
  })

  test('protege la integridad y no expone eliminación física', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const dependency = await createDependency()
    await createUser({ roleSlug: 'user', dependency })

    await assert.rejects(() => Dependency.query().where('id', dependency.id).delete())

    const response = await client
      .delete(`/api/v1/admin/dependencies/${dependency.id}`)
      .bearerToken(admin.token)
    response.assertStatus(404)
  })
})
