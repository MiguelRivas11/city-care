import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'

import Role from '#models/role'
import User from '#models/user'
import Credential from '#models/credential'
import Dependency from '#models/dependency'

let sequence = 0

async function role(slug: string, name?: string) {
  return Role.firstOrCreate(
    { slug },
    {
      name: name ?? slug,
      slug,
      description: `Rol ${slug}`,
    }
  )
}

async function dependency() {
  sequence += 1
  return Dependency.create({
    name: `Dependencia permisos ${Date.now()}-${sequence}`,
    description: null,
  })
}

async function userFixture(options: {
  roleSlug: string
  dependency: Dependency
  emailPrefix?: string
}) {
  sequence += 1
  const selectedRole = await role(options.roleSlug)
  const email = `${options.emailPrefix ?? options.roleSlug}-${Date.now()}-${sequence}@citycare.test`
  const user = await User.create({
    dependencyId: options.dependency.id,
    roleId: selectedRole.id,
    firstName: 'Usuario',
    lastName: 'Permisos',
    email,
    phoneNumber: null,
    jobTitle: null,
    isActive: true,
  })

  await Credential.create({
    userId: user.id,
    email,
    passwordHash: await hash.make('PermissionsPassword123!'),
  })

  const token = await User.accessTokens.create(user)
  return { user, role: selectedRole, token: token.value!.release(), email }
}

test.group('Roles y permisos 2.3', () => {
  test('expone la matriz completa de roles al administrador general', async ({
    client,
    assert,
  }) => {
    const adminDependency = await dependency()
    const admin = await userFixture({ roleSlug: 'admin', dependency: adminDependency })
    await role('dependency_admin', 'Administrador de dependencia')
    await role('user', 'Usuario')

    const response = await client.get('/api/v1/admin/roles').bearerToken(admin.token)

    response.assertStatus(200)
    const body = response.body() as unknown as {
      data: Array<{ slug: string; permissions: string[] }>
    }
    assert.includeMembers(
      body.data.map((item) => item.slug),
      ['admin', 'dependency_admin', 'user']
    )
    assert.include(
      body.data.find((item) => item.slug === 'admin')!.permissions,
      'users.reset_password'
    )
    assert.deepEqual(body.data.find((item) => item.slug === 'user')!.permissions, [])
  })

  test('el administrador de dependencia solo recibe roles que puede asignar', async ({
    client,
    assert,
  }) => {
    const ownDependency = await dependency()
    const manager = await userFixture({
      roleSlug: 'dependency_admin',
      dependency: ownDependency,
    })
    await role('admin', 'Administrador')
    await role('user', 'Usuario')

    const response = await client.get('/api/v1/admin/roles').bearerToken(manager.token)

    response.assertStatus(200)
    const body = response.body() as unknown as { data: Array<{ slug: string }> }
    assert.deepEqual(
      body.data.map((item) => item.slug),
      ['user']
    )
  })

  test('un usuario normal no puede consultar roles', async ({ client, assert }) => {
    const ownDependency = await dependency()
    const normalUser = await userFixture({ roleSlug: 'user', dependency: ownDependency })

    const response = await client.get('/api/v1/admin/roles').bearerToken(normalUser.token)

    response.assertStatus(403)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_PERMISSION_REQUIRED')
  })

  test('limita el listado del administrador de dependencia a su propia dependencia', async ({
    client,
    assert,
  }) => {
    const ownDependency = await dependency()
    const otherDependency = await dependency()
    const manager = await userFixture({
      roleSlug: 'dependency_admin',
      dependency: ownDependency,
    })
    const ownUser = await userFixture({ roleSlug: 'user', dependency: ownDependency })
    const otherUser = await userFixture({ roleSlug: 'user', dependency: otherDependency })

    const response = await client
      .get('/api/v1/admin/users')
      .qs({ perPage: 100 })
      .bearerToken(manager.token)

    response.assertStatus(200)
    const ids = (response.body().data as Array<{ id: number }>).map((item) => item.id)
    assert.notInclude(ids, manager.user.id)
    assert.include(ids, ownUser.user.id)
    assert.notInclude(ids, otherUser.user.id)
  })

  test('impide consultar usuarios de otra dependencia', async ({ client, assert }) => {
    const ownDependency = await dependency()
    const otherDependency = await dependency()
    const manager = await userFixture({
      roleSlug: 'dependency_admin',
      dependency: ownDependency,
    })
    const target = await userFixture({ roleSlug: 'user', dependency: otherDependency })

    const response = await client
      .get(`/api/v1/admin/users/${target.user.id}`)
      .bearerToken(manager.token)

    response.assertStatus(403)
    assert.equal(response.body().error.code, 'E_DEPENDENCY_SCOPE')
  })

  test('permite crear usuarios normales dentro de la propia dependencia', async ({
    client,
    assert,
  }) => {
    const ownDependency = await dependency()
    const manager = await userFixture({
      roleSlug: 'dependency_admin',
      dependency: ownDependency,
    })
    const userRole = await role('user', 'Usuario')
    const email = `managed-${Date.now()}-${sequence}@citycare.test`

    const response = await client.post('/api/v1/admin/users').bearerToken(manager.token).json({
      dependencyId: ownDependency.id,
      roleId: userRole.id,
      firstName: 'Cuenta',
      lastName: 'Gestionada',
      email,
      password: 'ManagedPassword123!',
      passwordConfirmation: 'ManagedPassword123!',
    })

    response.assertStatus(201)
    const body = response.body() as unknown as {
      data: { dependency: { id: number }; role: { slug: string } }
    }
    assert.equal(body.data.dependency.id, ownDependency.id)
    assert.equal(body.data.role.slug, 'user')
  })

  test('impide crear usuarios fuera de la dependencia propia', async ({ client, assert }) => {
    const ownDependency = await dependency()
    const otherDependency = await dependency()
    const manager = await userFixture({
      roleSlug: 'dependency_admin',
      dependency: ownDependency,
    })
    const userRole = await role('user', 'Usuario')

    const response = await client
      .post('/api/v1/admin/users')
      .bearerToken(manager.token)
      .json({
        dependencyId: otherDependency.id,
        roleId: userRole.id,
        firstName: 'Cuenta',
        lastName: 'Fuera',
        email: `outside-${Date.now()}-${sequence}@citycare.test`,
        password: 'OutsidePassword123!',
        passwordConfirmation: 'OutsidePassword123!',
      })

    response.assertStatus(403)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_DEPENDENCY_SCOPE')
  })

  test('impide escalar privilegios asignando el rol admin', async ({ client, assert }) => {
    const ownDependency = await dependency()
    const manager = await userFixture({
      roleSlug: 'dependency_admin',
      dependency: ownDependency,
    })
    const adminRole = await role('admin', 'Administrador')

    const response = await client
      .post('/api/v1/admin/users')
      .bearerToken(manager.token)
      .json({
        dependencyId: ownDependency.id,
        roleId: adminRole.id,
        firstName: 'Cuenta',
        lastName: 'Escalada',
        email: `escalated-${Date.now()}-${sequence}@citycare.test`,
        password: 'EscalatedPassword123!',
        passwordConfirmation: 'EscalatedPassword123!',
      })

    response.assertStatus(403)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_ROLE_ASSIGNMENT_FORBIDDEN')
  })

  test('impide administrar roles superiores aunque compartan dependencia', async ({
    client,
    assert,
  }) => {
    const ownDependency = await dependency()
    const manager = await userFixture({
      roleSlug: 'dependency_admin',
      dependency: ownDependency,
    })
    const target = await userFixture({ roleSlug: 'admin', dependency: ownDependency })

    const statusResponse = await client
      .patch(`/api/v1/admin/users/${target.user.id}/status`)
      .bearerToken(manager.token)
      .json({ isActive: false })
    statusResponse.assertStatus(403)

    const passwordResponse = await client
      .patch(`/api/v1/admin/users/${target.user.id}/password`)
      .bearerToken(manager.token)
      .json({
        password: 'ChangedPassword123!',
        passwordConfirmation: 'ChangedPassword123!',
      })
    passwordResponse.assertStatus(403)

    assert.equal(statusResponse.body().error.code, 'E_ROLE_SCOPE')
    assert.equal(passwordResponse.body().error.code, 'E_ROLE_SCOPE')
  })

  test('incluye los permisos del rol en el perfil autenticado', async ({ client, assert }) => {
    const ownDependency = await dependency()
    const manager = await userFixture({
      roleSlug: 'dependency_admin',
      dependency: ownDependency,
    })

    const response = await client.get('/api/v1/account/profile').bearerToken(manager.token)

    response.assertStatus(200)
    assert.include(response.body().data.role.permissions, 'users.list')
    assert.include(response.body().data.role.permissions, 'roles.list')
  })
})
