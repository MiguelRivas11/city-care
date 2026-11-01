import { randomUUID } from 'node:crypto'

import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

import Report from '#models/report'
import ReportCategory from '#models/report_category'
import ReportEvidence from '#models/report_evidence'
import ReportEvidenceStagingService from '#services/report_evidence_staging_service'
import { createReportValidator } from '#validators/report'

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  resolved: 'Resuelto',
}

function reportCategoryNotFound() {
  return new Exception('La categoría seleccionada no es válida', {
    status: 422,
    code: 'E_REPORT_CATEGORY_INVALID',
  })
}

function toPublicReport(report: Report) {
  const primaryEvidence = report.evidences[0]

  return {
    id: report.id,
    folio: report.folio,
    categoria: report.category.name,
    ...(report.description ? { descripcion: report.description } : {}),
    ...(report.address ? { direccion: report.address } : {}),
    latitud: Number(report.latitude),
    longitud: Number(report.longitude),
    ...(report.locationAccuracy === null
      ? {}
      : { precisionUbicacion: Number(report.locationAccuracy) }),
    origenUbicacion: report.locationSource,
    estado: statusLabels[report.status] ?? report.status,
    estadoEvidencia: primaryEvidence?.storageStatus === 'staged' ? 'Pendiente' : 'No disponible',
    creadoEn: report.createdAt.toUTC().toISO(),
  }
}

export default class ReportsController {
  /**
   * @store
   * @operationId createReport
   * @summary Crear un reporte ciudadano
   * @description Recibe la categoría, ubicación, descripción y fotografía. La evidencia queda resguardada en preparación privada hasta su transferencia a MinIO.
   * @requestFormDataBody {"categoria":{"type":"string","required":true,"example":"Bache"},"descripcion":{"type":"string","nullable":true},"direccion":{"type":"string","nullable":true},"latitud":{"type":"number","format":"double","required":true,"example":20.67665},"longitud":{"type":"number","format":"double","required":true,"example":-103.34751},"precisionUbicacion":{"type":"number","format":"double","nullable":true,"example":12.5},"origenUbicacion":{"type":"string","enum":["gps","manual"],"required":true},"foto":{"type":"string","format":"binary","required":true}}
   * @responseBody 201 - <ReportPublic>
   * @responseBody 401 - <ApiErrorResponse>
   * @responseBody 422 - <ApiErrorResponse>
   */
  async store({ auth, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createReportValidator)
    const category = await ReportCategory.query()
      .where('name', payload.categoria)
      .where('is_active', true)
      .first()

    if (!category) {
      throw reportCategoryNotFound()
    }

    if (category.requiresDescription && !payload.descripcion) {
      throw new Exception('La descripción es obligatoria para la categoría Otro', {
        status: 422,
        code: 'E_REPORT_DESCRIPTION_REQUIRED',
      })
    }

    if (payload.latitud === 0 && payload.longitud === 0) {
      throw new Exception('La ubicación 0,0 no es válida para crear un reporte', {
        status: 422,
        code: 'E_REPORT_LOCATION_INVALID',
      })
    }

    if (!['gps', 'manual'].includes(payload.origenUbicacion)) {
      throw new Exception('El origen de la ubicación debe ser gps o manual', {
        status: 422,
        code: 'E_REPORT_LOCATION_SOURCE_INVALID',
      })
    }

    const stagedEvidence = await ReportEvidenceStagingService.stage(payload.foto)

    let report: Report

    try {
      report = await db.transaction(async (trx) => {
        const createdReport = await Report.create(
          {
            folio: `TMP-${randomUUID()}`,
            userId: actor.id,
            categoryId: category.id,
            dependencyId: category.dependencyId,
            description: payload.descripcion ?? null,
            address: payload.direccion ?? null,
            latitude: payload.latitud.toFixed(6),
            longitude: payload.longitud.toFixed(6),
            locationAccuracy: payload.precisionUbicacion?.toFixed(2) ?? null,
            locationSource: payload.origenUbicacion,
            status: 'pending',
          },
          { client: trx }
        )

        createdReport.folio = `CC-${createdReport.createdAt.year}-${String(createdReport.id).padStart(6, '0')}`
        await createdReport.save()

        await ReportEvidence.create(
          {
            reportId: createdReport.id,
            kind: 'image',
            storageProvider: 'local_staging',
            storageStatus: 'staged',
            bucket: null,
            objectKey: stagedEvidence.objectKey,
            originalName: stagedEvidence.originalName,
            mimeType: stagedEvidence.mimeType,
            sizeBytes: stagedEvidence.sizeBytes,
          },
          { client: trx }
        )

        return createdReport
      })
    } catch (error) {
      await ReportEvidenceStagingService.remove(stagedEvidence)
      throw error
    }

    await report.load('category')
    await report.load('evidences')

    logger.info(
      {
        actorUserId: actor.id,
        reportId: report.id,
        reportFolio: report.folio,
        categoryId: report.categoryId,
      },
      'report_created'
    )

    return response.created(toPublicReport(report))
  }
}
