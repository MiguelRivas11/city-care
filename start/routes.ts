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

const WorkTeamsController = () => import('#controllers/work_teams_controller')
const ReportCategoriesController = () => import('#controllers/report_categories_controller')

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
 * Convierte el metadato `choices` de VineJS al `enum` estándar de OpenAPI.
 * AutoSwagger conserva el nombre interno y puede inferir number para cadenas.
 */
function normalizeVineChoices(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(normalizeVineChoices)
    return
  }

  if (!value || typeof value !== 'object') return

  const object = value as Record<string, unknown>
  if (Array.isArray(object.choices)) {
    object.enum = object.choices
    if (object.choices.every((choice) => typeof choice === 'string')) object.type = 'string'
    delete object.choices
  }

  Object.values(object).forEach(normalizeVineChoices)
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
  const generatedDocument = await AutoSwagger.default.json(router.toJSON(), swaggerConfig)
  const document = JSON.parse(JSON.stringify(generatedDocument))

  document.servers = [{ url: appUrl }]
  normalizeRequiredProperties(document)
  normalizeVineChoices(document)
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
      .get('report-categories', [ReportCategoriesController, 'index'])
      .as('report_categories.index')
      .use(middleware.auth())

    router
      .get('reports', [controllers.ReportQueries, 'mine'])
      .as('reports.index')
      .use(middleware.auth())

    router
      .get('reports/:id', [controllers.ReportQueries, 'showMine'])
      .as('reports.show')
      .use(middleware.auth())

    router
      .group(() => {
        router
          .get('reports', [controllers.ReportQueries, 'index'])
          .use(middleware.permission({ permission: 'reports.list' }))
        router
          .get('reports/:id', [controllers.ReportQueries, 'show'])
          .use(middleware.permission({ permission: 'reports.read' }))
        router
          .get('reports/:id/possible-duplicates', [controllers.ReportQueries, 'possibleDuplicates'])
          .use(middleware.permission({ permission: 'reports.read' }))
        router
          .patch('reports/:id/possible-duplicates/:reviewId', [
            controllers.ReportQueries,
            'reviewPossibleDuplicate',
          ])
          .use(middleware.permission({ permission: 'reports.status' }))
        router
          .patch('reports/:id/status', [controllers.ReportQueries, 'updateStatus'])
          .use(middleware.permission({ permission: 'reports.status' }))
        router
          .post('reports/:id/assignments', [WorkTeamsController, 'assignReport'])
          .use(middleware.permission({ permission: 'reports.assign' }))
        router
          .get('reports/:id/assignments', [WorkTeamsController, 'assignmentHistory'])
          .use(middleware.permission({ permission: 'reports.read' }))
        router
          .delete('reports/:id/assignment', [WorkTeamsController, 'unassignReport'])
          .use(middleware.permission({ permission: 'reports.assign' }))
        router
          .get('teams', [WorkTeamsController, 'index'])
          .use(middleware.permission({ permission: 'teams.list' }))
        router
          .post('teams', [WorkTeamsController, 'store'])
          .use(middleware.permission({ permission: 'teams.create' }))
        router
          .get('teams/:id', [WorkTeamsController, 'show'])
          .use(middleware.permission({ permission: 'teams.read' }))
        router
          .patch('teams/:id', [WorkTeamsController, 'update'])
          .use(middleware.permission({ permission: 'teams.update' }))
        router
          .patch('teams/:id/status', [WorkTeamsController, 'updateStatus'])
          .use(middleware.permission({ permission: 'teams.status' }))
        router
          .put('teams/:id/members', [WorkTeamsController, 'updateMembers'])
          .use(middleware.permission({ permission: 'teams.members' }))
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
