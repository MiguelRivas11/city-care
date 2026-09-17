import app from '@adonisjs/core/services/app'

export default {
  // ruta raíz de tu proyecto (en ESM ya no existe __dirname, usamos app.makePath)
  path: app.makePath(),

  // título que aparecerá arriba en la interfaz de Swagger
  title: "Mi API",

  // versión de tu API
  version: "1.0.0",

  // breve descripción de tu proyecto
  description: "Documentación de la API generada con AdonisJS y Swagger",

  // el índice del segmento de la URL que se usa como "tag" (categoría)
  // por ejemplo /api/users -> "users" sería el tag. Normalmente se deja en 2 o 3
  tagIndex: 2,

  // rutas que NO quieres que aparezcan documentadas (como las de swagger mismo)
  ignore: ["/swagger", "/docs"],

  // si tus campos usan snake_case (ej. first_name) pon true, si usas camelCase (ej. firstName) pon false
  snakeCase: false,

  // si usas rutas preflight de CORS, puedes ignorarlas también
  preferredPutPatch: "PUT",

  // opcional: define aquí esquemas de seguridad si usarás JWT o tokens
  common: {
    parameters: {},
    headers: {},
  },
}