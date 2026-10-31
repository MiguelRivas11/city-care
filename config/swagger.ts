import app from '@adonisjs/core/services/app'

export default {
  path: app.makePath(),

  info: {
    title: 'City Care API',
    version: '1.0.0',
    description:
      'API de City Care. Incluye autenticación, perfil, cierre de sesión y creación administrativa de usuarios.',
  },

  tagIndex: 3,

  ignore: ['/', '/swagger', '/docs'],

  snakeCase: false,
  preferredPutPatch: 'PUT',

  common: {
    parameters: {},
    headers: {},
  },

  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Access Token',
      description: 'Token obtenido mediante POST /api/v1/auth/login',
    },
  },

  authMiddlewares: ['auth'],
  defaultSecurityScheme: 'BearerAuth',
  persistAuthorization: true,
  showFullPath: true,
}
