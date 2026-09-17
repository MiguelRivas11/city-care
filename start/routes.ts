/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import AutoSwagger from 'adonis-autoswagger'
import swaggerConfig from '#config/swagger'

router.get('/', () => {
  return { hello: 'world' }
})

// devuelve el JSON de la especificación OpenAPI
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swaggerConfig)
})

// muestra la interfaz visual de Swagger UI
router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swaggerConfig)
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
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
  })
  .prefix('/api/v1')