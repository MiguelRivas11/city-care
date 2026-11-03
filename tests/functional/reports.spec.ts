import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'
import { access } from 'node:fs/promises'

import Credential from '#models/credential'
import Dependency from '#models/dependency'
import Report from '#models/report'
import ReportCategory from '#models/report_category'
import ReportDuplicateReview from '#models/report_duplicate_review'
import ReportStatusHistory from '#models/report_status_history'
import Role from '#models/role'
import User from '#models/user'

const validPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

let sequence = 0

async function createReporter(options: { dependency?: Dependency; roleSlug?: string } = {}) {
  sequence += 1
  const dependency =
    options.dependency ??
    (await Dependency.create({
      name: `Reportes dependencia ${Date.now()}-${sequence}`,
      description: null,
      isActive: true,
    }))
  const roleSlug = options.roleSlug ?? 'user'
  const role = await Role.firstOrCreate(
    { slug: roleSlug },
    {
      name: roleSlug === 'admin' ? 'Administrador' : 'Usuario',
      slug: roleSlug,
      description: null,
    }
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

async function createCategory(
  options: { name?: string; requiresDescription?: boolean; dependencyId?: number | null } = {}
) {
  sequence += 1
  return ReportCategory.create({
    dependencyId: options.dependencyId ?? null,
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

test.group('Reportes 3.1, MinIO 3.2 y seguimiento 3.3', () => {
  test('protege y devuelve únicamente las categorías activas para Flutter', async ({
    client,
    assert,
  }) => {
    const unauthenticated = await client.get('/api/v1/report-categories')
    unauthenticated.assertStatus(401)

    const reporter = await createReporter()
    const active = await createCategory({
      name: `Categoría móvil activa ${Date.now()}`,
      requiresDescription: true,
    })
    const inactive = await createCategory({ name: `Categoría móvil inactiva ${Date.now()}` })
    inactive.isActive = false
    await inactive.save()

    const response = await client.get('/api/v1/report-categories').bearerToken(reporter.token)

    response.assertStatus(200)
    const body = response.body() as unknown as {
      data: Array<{
        id: number
        codigo: string
        nombre: string
        descripcion: string | null
        requiereDescripcion: boolean
        dependenciaId: number | null
      }>
    }

    const activeResult = body.data.find((category) => category.id === active.id)
    assert.exists(activeResult)
    assert.equal(activeResult!.codigo, active.code)
    assert.equal(activeResult!.nombre, active.name)
    assert.isTrue(activeResult!.requiereDescripcion)
    assert.isFalse(body.data.some((category) => category.id === inactive.id))
  })

  test('rechaza la creación sin autenticación', async ({ client }) => {
    const response = await client.post('/api/v1/reports')
    response.assertStatus(401)
  })

  test('crea un reporte autenticado y registra la evidencia almacenada en MinIO', async ({
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
    assert.isString(body.fotoUrl)
    assert.include(body.fotoUrl!, '/city-care-test/reports/')
    assert.equal(body.estadoEvidencia, 'Disponible')

    const report = await Report.query().where('id', body.id).preload('evidences').firstOrFail()
    assert.equal(report.userId, reporter.user.id)
    assert.equal(report.categoryId, category.id)
    assert.equal(Number(report.latitude), 20.67665)
    assert.equal(Number(report.longitude), -103.34751)
    assert.lengthOf(report.evidences, 1)
    assert.equal(report.evidences[0].storageProvider, 'minio')
    assert.equal(report.evidences[0].storageStatus, 'stored')
    assert.equal(report.evidences[0].bucket, 'city-care-test')
    const history = await ReportStatusHistory.query().where('report_id', report.id)
    assert.lengthOf(history, 1)
    assert.equal(history[0].previousStatus, null)
    assert.equal(history[0].newStatus, 'pending')
    assert.equal(history[0].source, 'creation')
    await assert.rejects(() =>
      access(app.makePath('storage', 'report-evidence-staging', report.evidences[0].objectKey))
    )
  })

  test('detecta posibles duplicados por categoría, distancia y tiempo sin bloquear el reporte', async ({
    client,
    assert,
  }) => {
    const dependency = await Dependency.create({
      name: `Dependencia duplicados ${Date.now()}-${sequence++}`,
      description: null,
      isActive: true,
    })
    const reporter = await createReporter({ dependency })
    const manager = await createReporter({ dependency, roleSlug: 'dependency_admin' })
    const category = await createCategory({ dependencyId: dependency.id })
    const anotherCategory = await createCategory({ dependencyId: dependency.id })

    const original = await reportRequest(client, reporter.token, {
      categoria: category.name,
      descripcion: 'Primer reporte de la incidencia',
      latitud: 20.67665,
      longitud: -103.34751,
      origenUbicacion: 'gps',
    })
    original.assertStatus(201)

    const nearby = await reportRequest(client, reporter.token, {
      categoria: category.name,
      descripcion: 'La misma incidencia capturada desde unos metros de distancia',
      latitud: 20.67672,
      longitud: -103.34745,
      origenUbicacion: 'gps',
    })
    nearby.assertStatus(201)

    const farAway = await reportRequest(client, reporter.token, {
      categoria: category.name,
      latitud: 20.68665,
      longitud: -103.34751,
      origenUbicacion: 'gps',
    })
    farAway.assertStatus(201)

    const differentCategory = await reportRequest(client, reporter.token, {
      categoria: anotherCategory.name,
      latitud: 20.6767,
      longitud: -103.3475,
      origenUbicacion: 'gps',
    })
    differentCategory.assertStatus(201)

    const response = await client
      .get(`/api/v1/admin/reports/${nearby.body().id}/possible-duplicates`)
      .bearerToken(manager.token)

    response.assertStatus(200)
    const body = response.body() as unknown as {
      data: Array<{
        id: number
        estado: string
        distanciaMetros: number
        reporte: { id: number; folio: string }
      }>
      reglas: { distanciaMaximaMetros: number; ventanaMaximaHoras: number }
    }
    assert.equal(body.reglas.distanciaMaximaMetros, 100)
    assert.equal(body.reglas.ventanaMaximaHoras, 72)
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].estado, 'pending')
    assert.equal(body.data[0].reporte.id, original.body().id)
    assert.equal(body.data[0].reporte.folio, original.body().folio)
    assert.isBelow(body.data[0].distanciaMetros, 100)
    assert.notEqual(body.data[0].reporte.id, farAway.body().id)
    assert.notEqual(body.data[0].reporte.id, differentCategory.body().id)

    const reviewed = await client
      .patch(`/api/v1/admin/reports/${nearby.body().id}/possible-duplicates/${body.data[0].id}`)
      .bearerToken(manager.token)
      .json({ status: 'dismissed', note: 'Se verificó que son incidencias independientes' })

    reviewed.assertStatus(200)
    assert.equal(reviewed.body().data[0].estado, 'dismissed')
    assert.equal(reviewed.body().data[0].revisadoPor.id, manager.user.id)
    assert.equal(
      reviewed.body().data[0].observacion,
      'Se verificó que son incidencias independientes'
    )

    const persisted = await ReportDuplicateReview.findOrFail(body.data[0].id)
    assert.equal(persisted.status, 'dismissed')
    assert.equal(persisted.reviewedByUserId, manager.user.id)

    const reviewedAgain = await client
      .patch(`/api/v1/admin/reports/${nearby.body().id}/possible-duplicates/${body.data[0].id}`)
      .bearerToken(manager.token)
      .json({ status: 'confirmed', note: 'Intento de sobrescribir la revisión anterior' })

    reviewedAgain.assertStatus(409)
    assert.equal(reviewedAgain.body().error.code, 'E_DUPLICATE_REVIEW_CONFLICT')
  })

  test('lista y consulta únicamente los reportes del ciudadano con paginación y filtros', async ({
    client,
    assert,
  }) => {
    const reporter = await createReporter()
    const anotherReporter = await createReporter()
    const category = await createCategory({ name: `Bache seguimiento ${Date.now()}` })

    const ownResponse = await reportRequest(client, reporter.token, {
      categoria: category.name,
      descripcion: 'Bache para buscar mediante filtros',
      latitud: 20.67665,
      longitud: -103.34751,
      origenUbicacion: 'gps',
    })
    ownResponse.assertStatus(201)

    await reportRequest(client, anotherReporter.token, {
      categoria: category.name,
      descripcion: 'No debe aparecer para el primer ciudadano',
      latitud: 20.67666,
      longitud: -103.34752,
      origenUbicacion: 'gps',
    })

    const list = await client
      .get('/api/v1/reports')
      .bearerToken(reporter.token)
      .qs({ page: 1, perPage: 1, search: 'buscar', status: 'pending', categoryId: category.id })

    list.assertStatus(200)
    const listBody = list.body() as unknown as {
      data: Array<{ id: number }>
      meta: { currentPage: number; perPage: number }
    }
    assert.lengthOf(listBody.data, 1)
    assert.equal(listBody.data[0].id, ownResponse.body().id)
    assert.equal(listBody.meta.currentPage, 1)
    assert.equal(listBody.meta.perPage, 1)

    const detail = await client
      .get(`/api/v1/reports/${ownResponse.body().id}`)
      .bearerToken(reporter.token)

    detail.assertStatus(200)
    const detailBody = detail.body() as unknown as {
      folio: string
      estadoCodigo: string
      historial: Array<{ estadoNuevoCodigo: string }>
    }
    assert.equal(detailBody.folio, ownResponse.body().folio)
    assert.equal(detailBody.estadoCodigo, 'pending')
    assert.lengthOf(detailBody.historial, 1)
    assert.equal(detailBody.historial[0].estadoNuevoCodigo, 'pending')

    const foreignDetail = await client
      .get(`/api/v1/reports/${ownResponse.body().id}`)
      .bearerToken(anotherReporter.token)
    foreignDetail.assertStatus(404)
  })

  test('limita el seguimiento administrativo a la dependencia correspondiente', async ({
    client,
    assert,
  }) => {
    const dependencyA = await Dependency.create({
      name: `Dependencia A ${Date.now()}-${sequence++}`,
      description: null,
      isActive: true,
    })
    const dependencyB = await Dependency.create({
      name: `Dependencia B ${Date.now()}-${sequence++}`,
      description: null,
      isActive: true,
    })
    const reporterA = await createReporter({ dependency: dependencyA })
    const reporterB = await createReporter({ dependency: dependencyB })
    const managerA = await createReporter({ dependency: dependencyA, roleSlug: 'dependency_admin' })
    const admin = await createReporter({ roleSlug: 'admin' })
    const categoryA = await createCategory({ dependencyId: dependencyA.id })
    const categoryB = await createCategory({ dependencyId: dependencyB.id })

    const reportA = await reportRequest(client, reporterA.token, {
      categoria: categoryA.name,
      latitud: 20.67665,
      longitud: -103.34751,
      origenUbicacion: 'gps',
    })
    const reportB = await reportRequest(client, reporterB.token, {
      categoria: categoryB.name,
      latitud: 20.67666,
      longitud: -103.34752,
      origenUbicacion: 'gps',
    })

    const scopedList = await client
      .get('/api/v1/admin/reports')
      .bearerToken(managerA.token)
      .qs({ perPage: 100 })
    scopedList.assertStatus(200)
    assert.deepEqual(
      scopedList.body().data.map((item: { id: number }) => item.id),
      [reportA.body().id]
    )

    const forbiddenDetail = await client
      .get(`/api/v1/admin/reports/${reportB.body().id}`)
      .bearerToken(managerA.token)
    forbiddenDetail.assertStatus(403)

    const globalList = await client
      .get('/api/v1/admin/reports')
      .bearerToken(admin.token)
      .qs({ perPage: 100 })
    globalList.assertStatus(200)
    const globalIds = globalList.body().data.map((item: { id: number }) => item.id)
    assert.includeMembers(globalIds, [reportA.body().id, reportB.body().id])
  })

  test('cambia estados con transiciones controladas y conserva el historial', async ({
    client,
    assert,
  }) => {
    const dependency = await Dependency.create({
      name: `Dependencia estados ${Date.now()}-${sequence++}`,
      description: null,
      isActive: true,
    })
    const reporter = await createReporter({ dependency })
    const manager = await createReporter({ dependency, roleSlug: 'dependency_admin' })
    const category = await createCategory({ dependencyId: dependency.id })
    const created = await reportRequest(client, reporter.token, {
      categoria: category.name,
      latitud: 20.67665,
      longitud: -103.34751,
      origenUbicacion: 'gps',
    })

    const resolveTooEarly = await client
      .patch(`/api/v1/admin/reports/${created.body().id}/status`)
      .bearerToken(manager.token)
      .json({ status: 'resolved', expectedVersion: 1 })
    resolveTooEarly.assertStatus(409)
    assert.equal(
      (resolveTooEarly.body() as unknown as { error: { code: string } }).error.code,
      'E_REPORT_STATUS_TRANSITION_INVALID'
    )

    const inProgress = await client
      .patch(`/api/v1/admin/reports/${created.body().id}/status`)
      .bearerToken(manager.token)
      .json({
        status: 'in_progress',
        note: 'Cuadrilla revisando la incidencia',
        expectedVersion: 1,
      })
    inProgress.assertStatus(200)
    assert.equal(inProgress.body().estadoCodigo, 'in_progress')
    assert.equal(inProgress.body().version, 2)

    const staleUpdate = await client
      .patch(`/api/v1/admin/reports/${created.body().id}/status`)
      .bearerToken(manager.token)
      .json({ status: 'resolved', note: 'Vista desactualizada', expectedVersion: 1 })
    staleUpdate.assertStatus(409)
    assert.equal((staleUpdate.body() as any).error.code, 'E_REPORT_CONCURRENCY_CONFLICT')

    const resolved = await client
      .patch(`/api/v1/admin/reports/${created.body().id}/status`)
      .bearerToken(manager.token)
      .json({ status: 'resolved', note: 'Incidencia atendida', expectedVersion: 2 })
    resolved.assertStatus(200)
    const resolvedBody = resolved.body() as unknown as {
      estadoCodigo: string
      historial: Array<{ estadoAnteriorCodigo: string | null }>
    }
    assert.equal(resolvedBody.estadoCodigo, 'resolved')
    assert.lengthOf(resolvedBody.historial, 3)

    const reopenWithoutNote = await client
      .patch(`/api/v1/admin/reports/${created.body().id}/status`)
      .bearerToken(manager.token)
      .json({ status: 'in_progress', expectedVersion: 3 })
    reopenWithoutNote.assertStatus(422)
    assert.equal(
      (reopenWithoutNote.body() as unknown as { error: { code: string } }).error.code,
      'E_REPORT_STATUS_NOTE_REQUIRED'
    )

    const reopened = await client
      .patch(`/api/v1/admin/reports/${created.body().id}/status`)
      .bearerToken(manager.token)
      .json({ status: 'in_progress', note: 'El problema reapareció', expectedVersion: 3 })
    reopened.assertStatus(200)
    const reopenedBody = reopened.body() as unknown as {
      historial: Array<{ estadoAnteriorCodigo: string | null }>
    }
    assert.lengthOf(reopenedBody.historial, 4)
    assert.equal(reopenedBody.historial[3].estadoAnteriorCodigo, 'resolved')
  })

  test('impide a un ciudadano utilizar las rutas administrativas de reportes', async ({
    client,
  }) => {
    const reporter = await createReporter()
    const response = await client.get('/api/v1/admin/reports').bearerToken(reporter.token)
    response.assertStatus(403)
  })

  test('rechaza estados y rangos de fecha inválidos en los filtros', async ({ client, assert }) => {
    const reporter = await createReporter()

    const invalidStatus = await client
      .get('/api/v1/reports')
      .bearerToken(reporter.token)
      .qs({ status: 'deleted' })
    invalidStatus.assertStatus(422)
    assert.equal(
      (invalidStatus.body() as unknown as { error: { code: string } }).error.code,
      'E_REPORT_STATUS_INVALID'
    )

    const invalidRange = await client
      .get('/api/v1/reports')
      .bearerToken(reporter.token)
      .qs({ from: '2026-11-02', to: '2026-11-01' })
    invalidRange.assertStatus(422)
    assert.equal(
      (invalidRange.body() as unknown as { error: { code: string } }).error.code,
      'E_REPORT_DATE_RANGE_INVALID'
    )
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
