import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'

import Report from '#models/report'
import ReportDuplicateReview from '#models/report_duplicate_review'
import ReportStatusHistory from '#models/report_status_history'
import type User from '#models/user'
import { isGlobalAdministrator } from '#services/authorization_service'
import { assertReportVersion, incrementReportVersion } from '#services/report_concurrency_service'
import ReportDuplicateDetectionService, {
  duplicateDetectionRules,
} from '#services/report_duplicate_detection_service'
import ReportPresenterService from '#services/report_presenter_service'
import {
  listReportsValidator,
  reviewReportDuplicateValidator,
  updateReportStatusValidator,
} from '#validators/report'

type ReportQuery = ModelQueryBuilderContract<typeof Report, Report>

interface ReportFilters {
  search?: string
  status?: string
  categoryId?: number
  dependencyId?: number
  userId?: number
  from?: string
  to?: string
}

const allowedTransitions: Record<string, readonly string[]> = {
  pending: ['in_progress'],
  in_progress: ['pending', 'resolved'],
  resolved: ['in_progress'],
}

const reportStatuses = ['pending', 'in_progress', 'resolved'] as const
type ReportStatus = (typeof reportStatuses)[number]

function parseReportStatus(value: string | undefined): ReportStatus | undefined {
  if (value === undefined) return undefined

  if (!reportStatuses.includes(value as ReportStatus)) {
    throw new Exception('El estado del reporte no es válido', {
      status: 422,
      code: 'E_REPORT_STATUS_INVALID',
    })
  }

  return value as ReportStatus
}

function reportNotFound() {
  return new Exception('Reporte no encontrado', {
    status: 404,
    code: 'E_REPORT_NOT_FOUND',
  })
}

function parseReportId(value: string): number {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1) throw reportNotFound()
  return id
}

function parseFilterDate(value: string, endOfDay = false): DateTime {
  const date = DateTime.fromISO(value, { zone: 'utc' })

  if (!date.isValid || date.toFormat('yyyy-MM-dd') !== value) {
    throw new Exception('El rango de fechas no es válido', {
      status: 422,
      code: 'E_REPORT_DATE_RANGE_INVALID',
    })
  }

  return endOfDay ? date.endOf('day') : date.startOf('day')
}

function applyFilters(query: ReportQuery, filters: ReportFilters): void {
  if (filters.search) {
    const search = `%${filters.search}%`
    query.where((builder) => {
      builder
        .whereILike('folio', search)
        .orWhereILike('description', search)
        .orWhereILike('address', search)
    })
  }

  if (filters.status) query.where('status', filters.status)
  if (filters.categoryId !== undefined) query.where('category_id', filters.categoryId)
  if (filters.dependencyId !== undefined) query.where('dependency_id', filters.dependencyId)
  if (filters.userId !== undefined) query.where('user_id', filters.userId)

  const from = filters.from ? parseFilterDate(filters.from) : undefined
  const to = filters.to ? parseFilterDate(filters.to, true) : undefined

  if (from && to && from > to) {
    throw new Exception('La fecha inicial no puede ser posterior a la fecha final', {
      status: 422,
      code: 'E_REPORT_DATE_RANGE_INVALID',
    })
  }

  if (from) query.where('created_at', '>=', from.toSQL()!)
  if (to) query.where('created_at', '<=', to.toSQL()!)
}

function queryReports(includeHistory = false): ReportQuery {
  const query = Report.query()
    .preload('category')
    .preload('dependency')
    .preload('user')
    .preload('evidences', (evidenceQuery) => evidenceQuery.orderBy('id', 'asc'))
    .preload('currentAssignment', (assignmentQuery) => {
      assignmentQuery.preload('workTeam', (teamQuery) => {
        teamQuery.preload('dependency').preload('leader')
      })
    })
    .orderBy('id', 'desc')

  if (includeHistory) {
    query.preload('statusHistory', (historyQuery) => {
      historyQuery.preload('changedBy').orderBy('id', 'asc')
    })
  }

  return query
}

async function presentCollection(reports: Report[], includeCitizen: boolean) {
  return Promise.all(
    reports.map((report) => ReportPresenterService.present(report, { includeCitizen }))
  )
}

async function assertAdministrativeScope(actor: User, report: Report) {
  await actor.load((preloader) => preloader.load('role'))

  if (!isGlobalAdministrator(actor)) {
    if (report.dependencyId === null) {
      throw new Exception('El reporte todavía no tiene una dependencia asignada', {
        status: 403,
        code: 'E_REPORT_SCOPE',
      })
    }
    if (actor.dependencyId !== report.dependencyId) {
      throw new Exception('No puedes consultar reportes de otra dependencia', {
        status: 403,
        code: 'E_REPORT_SCOPE',
      })
    }
  }
}

export default class ReportQueriesController {
  /**
   * @mine
   * @operationId listMyReports
   * @summary Consultar mis reportes
   * @description Devuelve únicamente los reportes creados por el ciudadano autenticado, con filtros y paginación.
   * @paramQuery page - Número de página - @type(number)
   * @paramQuery perPage - Registros por página, máximo 100 - @type(number)
   * @paramQuery search - Folio, descripción o dirección - @type(string)
   * @paramQuery status - pending, in_progress o resolved - @type(string)
   * @paramQuery categoryId - Identificador de categoría - @type(number)
   * @paramQuery from - Fecha inicial YYYY-MM-DD - @type(string)
   * @paramQuery to - Fecha final YYYY-MM-DD - @type(string)
   * @responseBody 200 - <ReportsListApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async mine({ auth, request }: HttpContext) {
    const filters = await request.validateUsing(listReportsValidator)
    const actor = auth.getUserOrFail()
    const query = queryReports().where('user_id', actor.id)

    applyFilters(query, {
      search: filters.search,
      status: parseReportStatus(filters.status),
      categoryId: filters.categoryId,
      from: filters.from,
      to: filters.to,
    })

    const reports = await query.paginate(filters.page ?? 1, filters.perPage ?? 20)
    return { data: await presentCollection(reports.all(), false), meta: reports.getMeta() }
  }

  /**
   * @showMine
   * @operationId getMyReport
   * @summary Consultar el detalle de uno de mis reportes
   * @paramPath id - Identificador del reporte - @type(number) @required
   * @responseBody 200 - <ReportDetailApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   */
  async showMine({ auth, params }: HttpContext) {
    const report = await queryReports(true)
      .where('id', parseReportId(params.id))
      .where('user_id', auth.getUserOrFail().id)
      .first()

    if (!report) throw reportNotFound()
    return ReportPresenterService.present(report, { includeHistory: true })
  }

  /**
   * @index
   * @operationId listAdminReports
   * @summary Listar reportes para seguimiento administrativo
   * @description El administrador general consulta todos los reportes. El administrador de dependencia queda limitado a la suya.
   * @paramQuery page - Número de página - @type(number)
   * @paramQuery perPage - Registros por página, máximo 100 - @type(number)
   * @paramQuery search - Folio, descripción o dirección - @type(string)
   * @paramQuery status - pending, in_progress o resolved - @type(string)
   * @paramQuery categoryId - Identificador de categoría - @type(number)
   * @paramQuery dependencyId - Identificador de dependencia - @type(number)
   * @paramQuery userId - Identificador del ciudadano - @type(number)
   * @paramQuery from - Fecha inicial YYYY-MM-DD - @type(string)
   * @paramQuery to - Fecha final YYYY-MM-DD - @type(string)
   * @responseBody 200 - <ReportsListApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async index({ auth, request }: HttpContext) {
    const filters = await request.validateUsing(listReportsValidator)
    const actor = auth.getUserOrFail()
    await actor.load((preloader) => preloader.load('role'))

    const query = queryReports()
    let dependencyId = filters.dependencyId

    if (!isGlobalAdministrator(actor)) {
      if (dependencyId !== undefined && dependencyId !== actor.dependencyId) {
        throw new Exception('No puedes consultar reportes de otra dependencia', {
          status: 403,
          code: 'E_REPORT_SCOPE',
        })
      }
      dependencyId = actor.dependencyId
    }

    applyFilters(query, {
      ...filters,
      status: parseReportStatus(filters.status),
      dependencyId,
    })
    const reports = await query.paginate(filters.page ?? 1, filters.perPage ?? 20)
    return { data: await presentCollection(reports.all(), true), meta: reports.getMeta() }
  }

  /**
   * @show
   * @operationId getAdminReport
   * @summary Consultar un reporte para seguimiento administrativo
   * @paramPath id - Identificador del reporte - @type(number) @required
   * @responseBody 200 - <ReportDetailApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   */
  async show({ auth, params }: HttpContext) {
    const report = await queryReports(true).where('id', parseReportId(params.id)).first()
    if (!report) throw reportNotFound()
    await assertAdministrativeScope(auth.getUserOrFail(), report)
    return ReportPresenterService.present(report, { includeCitizen: true, includeHistory: true })
  }

  /**
   * @possibleDuplicates
   * @operationId listPossibleReportDuplicates
   * @summary Consultar posibles reportes duplicados
   * @description Compara categoría, dependencia, distancia máxima de 100 metros y una ventana de 72 horas. La detección no bloquea ni elimina reportes.
   * @paramPath id - Identificador del reporte - @type(number) @required
   * @responseBody 200 - <ReportDuplicateReviewsApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   */
  async possibleDuplicates({ auth, params }: HttpContext) {
    const report = await Report.find(parseReportId(params.id))
    if (!report) throw reportNotFound()
    await assertAdministrativeScope(auth.getUserOrFail(), report)

    return {
      data: await ReportDuplicateDetectionService.list(report),
      reglas: {
        distanciaMaximaMetros: duplicateDetectionRules.maximumDistanceMeters,
        ventanaMaximaHoras: duplicateDetectionRules.maximumAgeHours,
      },
    }
  }

  /**
   * @reviewPossibleDuplicate
   * @operationId reviewPossibleReportDuplicate
   * @summary Resolver una alerta de posible duplicado
   * @description Permite confirmar que dos reportes representan la misma incidencia o descartar la coincidencia. Ningún reporte se elimina automáticamente.
   * @paramPath id - Identificador del reporte consultado - @type(number) @required
   * @paramPath reviewId - Identificador de la coincidencia - @type(number) @required
   * @requestBody <ReviewReportDuplicateRequest>
   * @responseBody 200 - <ReportDuplicateReviewsApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async reviewPossibleDuplicate({ auth, params, request }: HttpContext) {
    const payload = await request.validateUsing(reviewReportDuplicateValidator)
    const report = await Report.find(parseReportId(params.id))
    if (!report) throw reportNotFound()

    const actor = auth.getUserOrFail()
    await assertAdministrativeScope(actor, report)

    const reviewId = Number(params.reviewId)
    if (!Number.isSafeInteger(reviewId) || reviewId < 1) throw reportNotFound()

    const review = await ReportDuplicateReview.query()
      .where('id', reviewId)
      .where((query) => {
        query.where('report_id', report.id).orWhere('candidate_report_id', report.id)
      })
      .first()

    if (!review) throw reportNotFound()

    const candidateId = review.reportId === report.id ? review.candidateReportId : review.reportId
    const candidate = await Report.find(candidateId)
    if (!candidate) throw reportNotFound()
    await assertAdministrativeScope(actor, candidate)

    await db.transaction(async (trx) => {
      const lockedReview = await ReportDuplicateReview.query({ client: trx })
        .where('id', review.id)
        .forUpdate()
        .firstOrFail()

      if (lockedReview.status !== 'pending') {
        throw new Exception('La coincidencia ya fue revisada por otro usuario', {
          status: 409,
          code: 'E_DUPLICATE_REVIEW_CONFLICT',
        })
      }

      lockedReview.useTransaction(trx)
      lockedReview.status = payload.status
      lockedReview.note = payload.note ?? null
      lockedReview.reviewedByUserId = actor.id
      lockedReview.reviewedAt = DateTime.utc()
      await lockedReview.save()
    })

    logger.info(
      {
        actorUserId: actor.id,
        reportId: report.id,
        candidateReportId: candidate.id,
        duplicateReviewId: review.id,
        status: payload.status,
      },
      'report_duplicate_reviewed'
    )

    return {
      data: await ReportDuplicateDetectionService.list(report),
      reglas: {
        distanciaMaximaMetros: duplicateDetectionRules.maximumDistanceMeters,
        ventanaMaximaHoras: duplicateDetectionRules.maximumAgeHours,
      },
    }
  }

  /**
   * @updateStatus
   * @operationId updateReportStatus
   * @summary Cambiar controladamente el estado de un reporte
   * @description Permite pending a in_progress, in_progress a pending o resolved, y resolved a in_progress. Retroceder o reabrir exige observación.
   * @paramPath id - Identificador del reporte - @type(number) @required
   * @requestBody <UpdateReportStatusRequest>
   * @responseBody 200 - <ReportDetailApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 403 - <ApiErrorResponse>
   * @responseBody 404 - <ApiErrorResponse>
   * @responseBody 409 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async updateStatus({ auth, params, request }: HttpContext) {
    const payload = await request.validateUsing(updateReportStatusValidator)
    const nextStatus = parseReportStatus(payload.status)!
    const actor = auth.getUserOrFail()
    const report = await Report.find(parseReportId(params.id))

    if (!report) throw reportNotFound()
    await assertAdministrativeScope(actor, report)

    const previousStatus = await db.transaction(async (trx) => {
      const lockedReport = await Report.query({ client: trx })
        .where('id', report.id)
        .forUpdate()
        .firstOrFail()

      assertReportVersion(lockedReport, payload.expectedVersion)

      if (!allowedTransitions[lockedReport.status]?.includes(nextStatus)) {
        throw new Exception('La transición de estado solicitada no está permitida', {
          status: 409,
          code: 'E_REPORT_STATUS_TRANSITION_INVALID',
        })
      }

      const requiresNote =
        (lockedReport.status === 'in_progress' && nextStatus === 'pending') ||
        (lockedReport.status === 'resolved' && nextStatus === 'in_progress')

      if (requiresNote && !payload.note) {
        throw new Exception('La observación es obligatoria para retroceder o reabrir un reporte', {
          status: 422,
          code: 'E_REPORT_STATUS_NOTE_REQUIRED',
        })
      }

      const currentStatus = lockedReport.status
      lockedReport.useTransaction(trx)
      lockedReport.status = nextStatus
      incrementReportVersion(lockedReport)
      await lockedReport.save()

      await ReportStatusHistory.create(
        {
          reportId: lockedReport.id,
          previousStatus: currentStatus,
          newStatus: nextStatus,
          changedByUserId: actor.id,
          source: 'admin',
          note: payload.note ?? null,
        },
        { client: trx }
      )

      return currentStatus
    })

    logger.info(
      {
        actorUserId: actor.id,
        reportId: report.id,
        previousStatus,
        newStatus: nextStatus,
      },
      'report_status_updated'
    )

    const updated = await queryReports(true).where('id', report.id).firstOrFail()
    return ReportPresenterService.present(updated, { includeCitizen: true, includeHistory: true })
  }
}
