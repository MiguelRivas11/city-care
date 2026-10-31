import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'

import Role from '#models/role'
import User from '#models/user'
import Credential from '#models/credential'
import Dependency from '#models/dependency'

let fixtureSequence = 0

async function createRole(slug: string) {
  return Role.firstOrCreate(
    { slug },
    {
      name: slug === 'admin' ? 'Administrador' : `Rol ${slug}`,
      slug,
      description: null,
    }
  )
}

async function createDependency(name?: string) {
  fixtureSequence += 1
  return Dependency.create({
    name: name ?? `Dependencia administrativa ${Date.now()}-${fixtureSequence}`,
    description: null,
  })
}

async function createUserFixture(
  options: {
    roleSlug?: string
    dependency?: Dependency
    isActive?: boolean
    firstName?: string
    lastName?: string
    email?: string
    password?: string
  } = {}
) {
  fixtureSequence += 1
  const suffix = `${Date.now()}-${fixtureSequence}`
  const role = await createRole(options.roleSlug ?? `user-${suffix}`)
  const dependency = options.dependency ?? (await createDependency())
  const email = options.email ?? `admin-users-${suffix}@citycare.test`
  const password = options.password ?? 'TestPassword123!'

  const user = await User.create({
    dependencyId: dependency.id,
    roleId: role.id,
    firstName: options.firstName ?? 'Usuario',
    lastName: options.lastName ?? 'Administrado',
    email,
    phoneNumber: null,
    jobTitle: null,
    isActive: options.isActive ?? true,
  })

  await Credential.create({
    userId: user.id,
    email,
    passwordHash: await hash.make(password),
  })

  return { user, role, dependency, email, password }
}

async function createAdminSession() {
  const fixture = await createUserFixture({ roleSlug: 'admin' })
  const token = await User.accessTokens.create(fixture.user)

  return {
    ...fixture,
    token: token.value!.release(),
  }
}

test.group('Administración de usuarios 2.2', () => {
  test('rechaza el listado cuando falta el token', async ({ client }) => {
    const response = await client.get('/api/v1/admin/users')

    response.assertStatus(401)
  })

  test('rechaza a un usuario autenticado sin rol admin', async ({ client, assert }) => {
    const { user } = await createUserFixture({ roleSlug: `operator-${Date.now()}` })
    const token = await User.accessTokens.create(user)

    const response = await client.get('/api/v1/admin/users').bearerToken(token.value!.release())

    response.assertStatus(403)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_PERMISSION_REQUIRED')
  })

  test('lista, busca y filtra usuarios con paginación', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const dependency = await createDependency(`Alumbrado ${Date.now()}`)
    const target = await createUserFixture({
      roleSlug: `technical-${Date.now()}`,
      dependency,
      firstName: 'NombreBuscable',
      lastName: 'Técnico',
    })

    const response = await client
      .get('/api/v1/admin/users')
      .qs({
        search: 'NombreBuscable',
        roleId: target.role.id,
        dependencyId: dependency.id,
        isActive: true,
        page: 1,
        perPage: 10,
      })
      .bearerToken(admin.token)

    response.assertStatus(200)
    const body = response.body() as unknown as {
      data: Array<{ id: number; role: { id: number }; dependency: { id: number } }>
      meta: { total: number; currentPage: number }
    }
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].id, target.user.id)
    assert.equal(body.data[0].role.id, target.role.id)
    assert.equal(body.data[0].dependency.id, dependency.id)
    assert.equal(body.meta.total, 1)
    assert.equal(body.meta.currentPage, 1)
  })

  test('consulta el detalle de un usuario', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const target = await createUserFixture()

    const response = await client
      .get(`/api/v1/admin/users/${target.user.id}`)
      .bearerToken(admin.token)

    response.assertStatus(200)
    const body = response.body() as unknown as {
      data: { id: number; email: string; dependency: { id: number } }
    }
    assert.equal(body.data.id, target.user.id)
    assert.equal(body.data.email, target.email)
    assert.equal(body.data.dependency.id, target.dependency.id)
  })

  test('devuelve 404 uniforme cuando el usuario no existe', async ({ client, assert }) => {
    const admin = await createAdminSession()

    const response = await client.get('/api/v1/admin/users/999999').bearerToken(admin.token)

    response.assertStatus(404)
    assert.deepEqual(response.body() as unknown as Record<string, unknown>, {
      error: {
        code: 'E_USER_NOT_FOUND',
        message: 'Usuario no encontrado',
      },
    })
  })

  test('crea un usuario y su credencial de forma transaccional', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const role = await createRole(`created-${Date.now()}`)
    const dependency = await createDependency()
    const email = `created-${Date.now()}@citycare.test`

    const response = await client.post('/api/v1/admin/users').bearerToken(admin.token).json({
      dependencyId: dependency.id,
      roleId: role.id,
      firstName: 'Cuenta',
      lastName: 'Nueva',
      email,
      phoneNumber: null,
      jobTitle: 'Operador',
      isActive: true,
      password: 'CreatedPassword123!',
      passwordConfirmation: 'CreatedPassword123!',
    })

    response.assertStatus(201)
    const body = response.body() as unknown as {
      data: { email: string; dependency: { id: number } }
    }
    assert.equal(body.data.email, email)
    assert.equal(body.data.dependency.id, dependency.id)

    const user = await User.findByOrFail('email', email)
    const credential = await Credential.findByOrFail('userId', user.id)
    assert.equal(credential.email, email)
  })

  test('edita perfil, rol, dependencia y sincroniza el correo', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const target = await createUserFixture()
    const nextRole = await createRole(`supervisor-${Date.now()}`)
    const nextDependency = await createDependency(`Aseo ${Date.now()}`)
    const nextEmail = `updated-${Date.now()}@citycare.test`

    const response = await client
      .patch(`/api/v1/admin/users/${target.user.id}`)
      .bearerToken(admin.token)
      .json({
        dependencyId: nextDependency.id,
        roleId: nextRole.id,
        firstName: 'Nombre actualizado',
        lastName: 'Apellido actualizado',
        email: nextEmail,
        phoneNumber: '3312345678',
        jobTitle: 'Supervisor',
      })

    response.assertStatus(200)
    const body = response.body() as unknown as {
      data: { email: string; role: { id: number }; dependency: { id: number } }
    }
    assert.equal(body.data.email, nextEmail)
    assert.equal(body.data.role.id, nextRole.id)
    assert.equal(body.data.dependency.id, nextDependency.id)

    await target.user.refresh()
    const credential = await Credential.findByOrFail('userId', target.user.id)
    assert.equal(target.user.email, nextEmail)
    assert.equal(credential.email, nextEmail)
  })

  test('rechaza un cuerpo de edición vacío', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const target = await createUserFixture()

    const response = await client
      .patch(`/api/v1/admin/users/${target.user.id}`)
      .bearerToken(admin.token)
      .json({})

    response.assertStatus(422)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_EMPTY_UPDATE')
  })

  test('impide que el administrador retire su propio rol', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const normalRole = await createRole(`normal-${Date.now()}`)

    const response = await client
      .patch(`/api/v1/admin/users/${admin.user.id}`)
      .bearerToken(admin.token)
      .json({ roleId: normalRole.id })

    response.assertStatus(422)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_SELF_ROLE_CHANGE')
  })

  test('desactiva mediante baja lógica y revoca todas las sesiones', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const target = await createUserFixture()
    await User.accessTokens.create(target.user)
    await User.accessTokens.create(target.user)

    const response = await client
      .patch(`/api/v1/admin/users/${target.user.id}/status`)
      .bearerToken(admin.token)
      .json({ isActive: false })

    response.assertStatus(200)
    const body = response.body() as unknown as { data: { isActive: boolean } }
    assert.isFalse(body.data.isActive)
    assert.lengthOf(await User.accessTokens.all(target.user), 0)

    await target.user.refresh()
    assert.isFalse(Boolean(target.user.isActive))
  })

  test('impide que el administrador desactive su propia cuenta', async ({ client, assert }) => {
    const admin = await createAdminSession()

    const response = await client
      .patch(`/api/v1/admin/users/${admin.user.id}/status`)
      .bearerToken(admin.token)
      .json({ isActive: false })

    response.assertStatus(422)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_SELF_DEACTIVATION')
  })

  test('reactiva una cuenta previamente inactiva', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const target = await createUserFixture({ isActive: false })

    const response = await client
      .patch(`/api/v1/admin/users/${target.user.id}/status`)
      .bearerToken(admin.token)
      .json({ isActive: true })

    response.assertStatus(200)
    const body = response.body() as unknown as { data: { isActive: boolean } }
    assert.isTrue(body.data.isActive)
  })

  test('restablece la contraseña y revoca sesiones existentes', async ({ client, assert }) => {
    const admin = await createAdminSession()
    const target = await createUserFixture({ password: 'PreviousPassword123!' })
    await User.accessTokens.create(target.user)
    const nextPassword = 'NextPassword123!'

    const response = await client
      .patch(`/api/v1/admin/users/${target.user.id}/password`)
      .bearerToken(admin.token)
      .json({
        password: nextPassword,
        passwordConfirmation: nextPassword,
      })

    response.assertStatus(200)
    assert.lengthOf(await User.accessTokens.all(target.user), 0)

    const oldLogin = await client.post('/api/v1/auth/login').json({
      email: target.email,
      password: 'PreviousPassword123!',
    })
    oldLogin.assertStatus(400)

    const newLogin = await client.post('/api/v1/auth/login').json({
      email: target.email,
      password: nextPassword,
    })
    newLogin.assertStatus(200)
    assert.isString(newLogin.body().data.token)
  })

  test('no expone una ruta de eliminación física', async ({ client }) => {
    const admin = await createAdminSession()
    const target = await createUserFixture()

    const response = await client
      .delete(`/api/v1/admin/users/${target.user.id}`)
      .bearerToken(admin.token)

    response.assertStatus(404)
  })
})
