import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'

import Role from '#models/role'
import User from '#models/user'
import Credential from '#models/credential'
import Dependency from '#models/dependency'

let fixtureSequence = 0

async function createAuthFixture(isActive = true) {
  fixtureSequence += 1
  const suffix = `${Date.now()}-${fixtureSequence}`
  const email = `auth-${suffix}@citycare.test`
  const password = 'TestPassword123!'

  const role = await Role.create({
    name: `Usuario ${suffix}`,
    slug: `user-${suffix}`,
    description: null,
  })

  const dependency = await Dependency.create({
    name: `Dependencia ${suffix}`,
    description: null,
  })

  const user = await User.create({
    dependencyId: dependency.id,
    roleId: role.id,
    firstName: 'Prueba',
    lastName: 'Autenticación',
    email,
    phoneNumber: null,
    jobTitle: null,
    isActive,
  })

  await Credential.create({
    userId: user.id,
    email,
    passwordHash: await hash.make(password),
  })

  return { user, email, password }
}

test.group('Autenticación 2.1', () => {
  test('inicia sesión y crea un token con expiración', async ({ client, assert }) => {
    const { user, email, password } = await createAuthFixture()

    const response = await client.post('/api/v1/auth/login').json({ email, password })

    response.assertStatus(200)
    assert.isString(response.body().data.token)

    const tokens = await User.accessTokens.all(user)
    assert.lengthOf(tokens, 1)
    assert.isNotNull(tokens[0].expiresAt)

    const remainingMilliseconds = tokens[0].expiresAt!.getTime() - Date.now()
    assert.isAtLeast(remainingMilliseconds, 6 * 24 * 60 * 60 * 1000)
    assert.isAtMost(remainingMilliseconds, 8 * 24 * 60 * 60 * 1000)
  })

  test('consulta el perfil con un token válido', async ({ client, assert }) => {
    const { user } = await createAuthFixture()
    const token = await User.accessTokens.create(user)

    const response = await client.get('/api/v1/account/profile').bearerToken(token.value!.release())

    response.assertStatus(200)
    const body = response.body() as unknown as { data: { id: number; email: string } }
    assert.equal(body.data.id, user.id)
    assert.equal(body.data.email, user.email)
  })

  test('cierra sesión e invalida el token actual', async ({ client }) => {
    const { user } = await createAuthFixture()
    const token = await User.accessTokens.create(user)
    const tokenValue = token.value!.release()

    const logoutResponse = await client.post('/api/v1/account/logout').bearerToken(tokenValue)

    logoutResponse.assertStatus(200)

    const profileResponse = await client.get('/api/v1/account/profile').bearerToken(tokenValue)

    profileResponse.assertStatus(401)
  })

  test('rechaza el login de una cuenta inactiva', async ({ client, assert }) => {
    const { user, email, password } = await createAuthFixture(false)

    const response = await client.post('/api/v1/auth/login').json({ email, password })

    response.assertStatus(403)
    assert.deepInclude(response.body() as unknown as Record<string, unknown>, {
      error: {
        code: 'E_ACCOUNT_INACTIVE',
        message: 'La cuenta está inactiva',
      },
    })
    assert.lengthOf(await User.accessTokens.all(user), 0)
  })

  test('revoca tokens existentes cuando una cuenta desactivada intenta usarlos', async ({
    client,
    assert,
  }) => {
    const { user } = await createAuthFixture()
    const token = await User.accessTokens.create(user)

    user.isActive = false
    await user.save()

    const response = await client.get('/api/v1/account/profile').bearerToken(token.value!.release())

    response.assertStatus(403)
    const body = response.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_ACCOUNT_INACTIVE')

    assert.lengthOf(await User.accessTokens.all(user), 0)
  })

  test('devuelve un error uniforme para credenciales inválidas', async ({ client, assert }) => {
    const { email } = await createAuthFixture()

    const response = await client.post('/api/v1/auth/login').json({
      email,
      password: 'contraseña-incorrecta',
    })

    response.assertStatus(400)
    assert.deepEqual(response.body() as unknown as Record<string, unknown>, {
      error: {
        code: 'E_INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
      },
    })
  })

  test('limita los intentos repetidos de inicio de sesión', async ({ client, assert }) => {
    const { email } = await createAuthFixture()

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await client.post('/api/v1/auth/login').json({
        email,
        password: 'contraseña-incorrecta',
      })

      response.assertStatus(400)
    }

    const limitedResponse = await client.post('/api/v1/auth/login').json({
      email,
      password: 'contraseña-incorrecta',
    })

    limitedResponse.assertStatus(429)
    const body = limitedResponse.body() as unknown as { error: { code: string } }
    assert.equal(body.error.code, 'E_TOO_MANY_REQUESTS')
  })

  test('devuelve detalles uniformes para errores de validación', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/login').json({} as any)

    response.assertStatus(422)
    const body = response.body() as unknown as {
      error: { code: string; message: string; details?: unknown[] }
    }
    assert.equal(body.error.code, 'E_VALIDATION_ERROR')
    assert.equal(body.error.message, 'Los datos enviados no son válidos')
    assert.isArray(body.error.details)
  })

  test('devuelve un error uniforme cuando falta el token', async ({ client, assert }) => {
    const response = await client.get('/api/v1/account/profile')

    response.assertStatus(401)
    assert.deepEqual(response.body() as unknown as Record<string, unknown>, {
      error: {
        code: 'E_UNAUTHORIZED_ACCESS',
        message: 'No autorizado',
      },
    })
  })
})
