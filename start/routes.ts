/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { appUrl } from '#config/app'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import AutoSwagger from 'adonis-autoswagger'
import swaggerConfig from '#config/swagger'

/**
 * Elimina arreglos required vacíos porque no son válidos en OpenAPI 3.
 * AutoSwagger puede generarlos en modelos sin columnas públicas.
 */
function removeEmptyRequiredArrays(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(removeEmptyRequiredArrays)
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  const object = value as Record<string, unknown>

  if (Array.isArray(object.required) && object.required.length === 0) {
    delete object.required
  }

  Object.values(object).forEach(removeEmptyRequiredArrays)
}

/**
 * Convierte los `required: true` que AutoSwagger coloca dentro de cada
 * propiedad al arreglo `required` exigido por OpenAPI a nivel del esquema.
 */
function normalizeRequiredProperties(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(normalizeRequiredProperties)
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  const object = value as Record<string, unknown>
  const properties = object.properties

  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    const required = new Set(Array.isArray(object.required) ? object.required : [])

    for (const [propertyName, propertyValue] of Object.entries(
      properties as Record<string, unknown>
    )) {
      if (propertyValue && typeof propertyValue === 'object' && !Array.isArray(propertyValue)) {
        const property = propertyValue as Record<string, unknown>

        if (property.required === true) {
          required.add(propertyName)
          delete property.required
        }
      }
    }

    if (required.size > 0) {
      object.required = [...required]
    }
  }

  Object.values(object).forEach(normalizeRequiredProperties)
}

/**
 * Marca como obligatorios los cuerpos documentados. AutoSwagger genera el
 * esquema del cuerpo, pero omite `requestBody.required`.
 */
function markRequestBodiesAsRequired(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(markRequestBodiesAsRequired)
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  const object = value as Record<string, unknown>
  const requestBody = object.requestBody

  if (requestBody && typeof requestBody === 'object' && !Array.isArray(requestBody)) {
    const body = requestBody as Record<string, unknown>
    body.required = true
  }

  Object.values(object).forEach(markRequestBodiesAsRequired)
}

/**
 * AutoSwagger omite campos sensibles de los ejemplos automáticos. El esquema
 * conserva password, pero Swagger UI prioriza el ejemplo y puede mostrar un
 * cuerpo incompleto. Definimos un ejemplo explícito sin credenciales reales.
 */
function setRequestBodyExamples(document: Record<string, any>): void {
  const loginContent =
    document.paths?.['/api/v1/auth/login']?.post?.requestBody?.content?.['application/json']

  if (loginContent) {
    loginContent.example = {
      email: 'usuario@citycare.com',
      password: 'TuPassword123!',
    }
  }
}

router.get('/', () => {
  return { hello: 'world' }
})

// Devuelve el contrato OpenAPI normalizado para herramientas de generación.
router.get('/swagger', async () => {
  const document = await AutoSwagger.default.json(router.toJSON(), swaggerConfig)

  document.servers = [{ url: appUrl }]
  normalizeRequiredProperties(document)
  removeEmptyRequiredArrays(document)
  markRequestBodiesAsRequired(document)
  setRequestBodyExamples(document)

  return AutoSwagger.default.jsonToYaml(document)
})

// Muestra la interfaz visual de Swagger.
router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swaggerConfig)
})

router
  .group(() => {
    router
      .group(() => {
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .post('reports', [controllers.Reports, 'store'])
      .as('reports.store')
      .use(middleware.auth())

    router
      .group(() => {
        router
          .get('dependencies', [controllers.Dependencies, 'index'])
          .use(middleware.permission({ permission: 'dependencies.list' }))
        router
          .post('dependencies', [controllers.Dependencies, 'store'])
          .use(middleware.permission({ permission: 'dependencies.create' }))
        router
          .get('dependencies/:id', [controllers.Dependencies, 'show'])
          .use(middleware.permission({ permission: 'dependencies.read' }))
        router
          .patch('dependencies/:id', [controllers.Dependencies, 'update'])
          .use(middleware.permission({ permission: 'dependencies.update' }))
        router
          .patch('dependencies/:id/status', [controllers.Dependencies, 'updateStatus'])
          .use(middleware.permission({ permission: 'dependencies.status' }))
        router
          .patch('dependencies/:id/managers', [controllers.Dependencies, 'updateManagers'])
          .use(middleware.permission({ permission: 'dependencies.manage' }))
        router
          .get('roles', [controllers.Roles, 'index'])
          .use(middleware.permission({ permission: 'roles.list' }))
        router
          .get('users', [controllers.AdminUsers, 'index'])
          .use(middleware.permission({ permission: 'users.list' }))
        router
          .post('users', [controllers.NewAccount, 'store'])
          .use(middleware.permission({ permission: 'users.create' }))
        router
          .get('users/:id', [controllers.AdminUsers, 'show'])
          .use(middleware.permission({ permission: 'users.read' }))
        router
          .patch('users/:id', [controllers.AdminUsers, 'update'])
          .use(middleware.permission({ permission: 'users.update' }))
        router
          .patch('users/:id/status', [controllers.AdminUsers, 'updateStatus'])
          .use(middleware.permission({ permission: 'users.status' }))
        router
          .patch('users/:id/password', [controllers.AdminUsers, 'resetPassword'])
          .use(middleware.permission({ permission: 'users.reset_password' }))
      })
      .prefix('admin')
      .as('admin')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
