import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    const httpError = this.toHttpError(error)
    const status = httpError.status || 500
    const code = httpError.code || `E_HTTP_${status}`

    const knownMessages: Record<string, string> = {
      E_INVALID_CREDENTIALS: 'Credenciales inválidas',
      E_ACCOUNT_INACTIVE: 'La cuenta está inactiva',
      E_UNAUTHORIZED_ACCESS: 'No autorizado',
      E_ADMIN_REQUIRED: 'No tienes permisos para realizar esta acción',
      E_PERMISSION_REQUIRED: 'No tienes el permiso requerido para realizar esta acción',
      E_DEPENDENCY_SCOPE: 'No puedes administrar usuarios de otra dependencia',
      E_ROLE_ASSIGNMENT_FORBIDDEN: 'No puedes asignar ese rol',
      E_ROLE_SCOPE: 'No puedes administrar una cuenta con ese rol',
      E_DEPENDENCY_NOT_FOUND: 'Dependencia no encontrada',
      E_EMPTY_DEPENDENCY_UPDATE: 'Envía al menos un campo para actualizar la dependencia',
      E_DEPENDENCY_HAS_ACTIVE_USERS: 'No puedes desactivar una dependencia con usuarios activos',
      E_DEPENDENCY_INACTIVE: 'La dependencia está inactiva',
      E_INVALID_DEPENDENCY_MANAGERS:
        'Los responsables deben ser usuarios activos de la dependencia',
      E_USER_NOT_FOUND: 'Usuario no encontrado',
      E_CREDENTIAL_NOT_FOUND: 'El usuario no tiene una credencial asociada',
      E_EMPTY_UPDATE: 'Envía al menos un campo para actualizar',
      E_SELF_DEACTIVATION: 'No puedes desactivar tu propia cuenta',
      E_SELF_ROLE_CHANGE: 'No puedes retirar tu propio rol de administrador',
      E_VALIDATION_ERROR: 'Los datos enviados no son válidos',
      E_TOO_MANY_REQUESTS: 'Demasiados intentos. Intenta nuevamente más tarde',
      E_REPORT_CATEGORY_INVALID: 'La categoría seleccionada no es válida',
      E_REPORT_DESCRIPTION_REQUIRED: 'La descripción es obligatoria para la categoría Otro',
      E_REPORT_LOCATION_INVALID: 'La ubicación proporcionada no es válida',
      E_REPORT_LOCATION_SOURCE_INVALID: 'El origen de la ubicación debe ser gps o manual',
    }

    const message =
      knownMessages[code] ||
      (status >= 500 ? 'Ocurrió un error interno en el servidor' : httpError.message)

    const details = Array.isArray(httpError.messages) ? httpError.messages : undefined

    return ctx.response.status(status).send({
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    })
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
