import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import { rm } from 'node:fs/promises'

import Credential from '#models/credential'
import Dependency from '#models/dependency'
import Report from '#models/report'
import ReportCategory from '#models/report_category'
import Role from '#models/role'
import User from '#models/user'

const validPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

let sequence = 0

async function createReporter() {
  sequence += 1
  const dependency = await Dependency.create({
    name: `Reportes dependencia ${Date.now()}-${sequence}`,
    description: null,
    isActive: true,
  })
  const role = await Role.firstOrCreate(
    { slug: 'user' },
    { name: 'Usuario', slug: 'user', description: null }
  )
  const email = `reporter-${Date.now()}-${sequence}@citycare.test`
  const user = await User.create({
    dependencyId: dependency.id,
    roleId: role.id,
    firstName: 'Ciudadano',
    lastName: 'Reportero',
    email,
    phoneNumber: null,
    jobTitle: null,
    isActive: true,
  })
  await Credential.create({
    userId: user.id,
    email,
    passwordHash: await hash.make('ReportPassword123!'),
  })
  const token = await User.accessTokens.create(user)
  return { user, token: token.value!.release() }
}

async function createCategory(options: { name?: string; requiresDescription?: boolean } = {}) {
  sequence += 1
  return ReportCategory.create({
    dependencyId: null,
    code: `category-${Date.now()}-${sequence}`,
    name: options.name ?? `Categoría ${Date.now()}-${sequence}`,
    description: null,
    requiresDescription: options.requiresDescription ?? false,
    isActive: true,
  })
}

function reportRequest(client: any, token: string, fields: Record<string, string | number>) {
  return client
    .post('/api/v1/reports')
    .bearerToken(token)
    .fields(fields)
    .file('foto', validPng, { filename: 'evidencia.png', contentType: 'image/png' })
}

test.group('Reportes 3.1', () => {
  test('rechaza la creación sin autenticación', async ({ client }) => {
    const response = await client.post('/api/v1/reports')
    response.assertStatus(401)
  })

  test('crea un reporte autenticado y conserva la evidencia en preparación privada', async ({
    client,
    assert,
  }) => {
    const reporter = await createReporter()
    const category = await createCategory({ name: 'Bache funcional' })

    const response = await reportRequest(client, reporter.token, {
      categoria: category.name,
      descripcion: 'Bache profundo frente a una escuela',
      direccion: 'Avenida de prueba 123, Guadalajara',
      latitud: 20.67665,
      longitud: -103.34751,
      precisionUbicacion: 12.5,
      origenUbicacion: 'gps',
    })

    response.assertStatus(201)
    const body = response.body() as unknown as {
      id: number
      folio: string
      categoria: string
      estado: string
      fotoUrl?: string
      estadoEvidencia: string
    }
    assert.match(body.folio, /^CC-\d{4}-\d{6}$/)
    assert.equal(body.categoria, category.name)
    assert.equal(body.estado, 'Pendiente')
    assert.notProperty(body, 'fotoUrl')
    assert.equal(body.estadoEvidencia, 'Pendiente')

    const report = await Report.query().where('id', body.id).preload('evidences').firstOrFail()
    assert.equal(report.userId, reporter.user.id)
    assert.equal(report.categoryId, category.id)
    assert.equal(Number(report.latitude), 20.67665)
    assert.equal(Number(report.longitude), -103.34751)
    assert.lengthOf(report.evidences, 1)
    assert.equal(report.evidences[0].storageStatus, 'staged')

    await rm(app.makePath('storage', 'report-evidence-staging', report.evidences[0].objectKey), {
      force: true,
    })
  })

  test('rechaza la combinación de coordenadas 0,0', async ({ client, assert }) => {
    const reporter = await createReporter()
    const category = await createCategory()

    const response = await reportRequest(client, reporter.token, {
      categoria: category.name,
      latitud: 0,
      longitud: 0,
      origenUbicacion: 'gps',
    })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'E_REPORT_LOCATION_INVALID')
  })

  test('exige descripción para la categoría Otro', async ({ client, assert }) => {
    const reporter = await createReporter()
    const category = await createCategory({ name: 'Otro funcional', requiresDescription: true })

    const response = await reportRequest(client, reporter.token, {
      categoria: category.name,
      latitud: 20.67665,
      longitud: -103.34751,
      origenUbicacion: 'gps',
    })

    response.assertStatus(422)
    assert.equal(response.body().error.code, 'E_REPORT_DESCRIPTION_REQUIRED')
  })

  test('rechaza categorías desconocidas o inactivas', async ({ client, assert }) => {
    const reporter = await createReporter()
    const inactiveCategory = await createCategory()
    inactiveCategory.isActive = false
    await inactiveCategory.save()

    for (const categoria of ['Categoría inexistente', inactiveCategory.name]) {
      const response = await reportRequest(client, reporter.token, {
        categoria,
        latitud: 20.67665,
        longitud: -103.34751,
        origenUbicacion: 'gps',
      })

      response.assertStatus(422)
      assert.equal(response.body().error.code, 'E_REPORT_CATEGORY_INVALID')
    }
  })

  test('valida rangos, origen y fotografía obligatoria', async ({ client, assert }) => {
    const reporter = await createReporter()
    const category = await createCategory()

    const invalidCoordinates = await reportRequest(client, reporter.token, {
      categoria: category.name,
      latitud: 91,
      longitud: -103.34751,
      origenUbicacion: 'gps',
    })
    invalidCoordinates.assertStatus(422)
    assert.equal(invalidCoordinates.body().error.code, 'E_VALIDATION_ERROR')

    const invalidOrigin = await reportRequest(client, reporter.token, {
      categoria: category.name,
      latitud: 20.67665,
      longitud: -103.34751,
      origenUbicacion: 'default',
    })
    invalidOrigin.assertStatus(422)
    assert.equal(invalidOrigin.body().error.code, 'E_REPORT_LOCATION_SOURCE_INVALID')

    const missingPhoto = await client.post('/api/v1/reports').bearerToken(reporter.token).fields({
      categoria: category.name,
      latitud: 20.67665,
      longitud: -103.34751,
      origenUbicacion: 'gps',
    })
    missingPhoto.assertStatus(422)
    assert.equal(
      (missingPhoto.body() as unknown as { error: { code: string } }).error.code,
      'E_VALIDATION_ERROR'
    )
  })
})
