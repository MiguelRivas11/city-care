import Report from '#models/report'
import ReportDuplicateReview from '#models/report_duplicate_review'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

export const duplicateDetectionRules = {
  maximumDistanceMeters: 100,
  maximumAgeHours: 72,
  maximumCandidates: 20,
} as const

interface DuplicateMatch {
  report: Report
  distanceMeters: number
}

function distanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const earthRadiusMeters = 6_371_000
  const toRadians = (value: number) => (value * Math.PI) / 180
  const deltaLatitude = toRadians(latitudeB - latitudeA)
  const deltaLongitude = toRadians(longitudeB - longitudeA)
  const firstLatitude = toRadians(latitudeA)
  const secondLatitude = toRadians(latitudeB)
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(deltaLongitude / 2) ** 2

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine))
}

function pairFor(report: Report, candidate: Report) {
  const reportIsNewer =
    report.createdAt.toMillis() > candidate.createdAt.toMillis() ||
    (report.createdAt.toMillis() === candidate.createdAt.toMillis() && report.id > candidate.id)

  return reportIsNewer
    ? { reportId: report.id, candidateReportId: candidate.id }
    : { reportId: candidate.id, candidateReportId: report.id }
}

export default class ReportDuplicateDetectionService {
  static async findMatches(
    report: Report,
    client?: TransactionClientContract
  ): Promise<DuplicateMatch[]> {
    const latitude = Number(report.latitude)
    const longitude = Number(report.longitude)
    const latitudeDelta = duplicateDetectionRules.maximumDistanceMeters / 111_320
    const longitudeDivisor = Math.max(111_320 * Math.cos((latitude * Math.PI) / 180), 1)
    const longitudeDelta = duplicateDetectionRules.maximumDistanceMeters / longitudeDivisor
    const start = report.createdAt.minus({ hours: duplicateDetectionRules.maximumAgeHours })
    const end = report.createdAt.plus({ hours: duplicateDetectionRules.maximumAgeHours })

    const query = Report.query({ client })
      .whereNot('id', report.id)
      .where('category_id', report.categoryId)
      .whereBetween('latitude', [latitude - latitudeDelta, latitude + latitudeDelta])
      .whereBetween('longitude', [longitude - longitudeDelta, longitude + longitudeDelta])
      .whereBetween('created_at', [start.toSQL()!, end.toSQL()!])
      .orderBy('created_at', 'desc')
      .limit(100)

    if (report.dependencyId === null) query.whereNull('dependency_id')
    else query.where('dependency_id', report.dependencyId)

    const candidates = await query
    return candidates
      .map((candidate) => ({
        report: candidate,
        distanceMeters: distanceMeters(
          latitude,
          longitude,
          Number(candidate.latitude),
          Number(candidate.longitude)
        ),
      }))
      .filter((match) => match.distanceMeters <= duplicateDetectionRules.maximumDistanceMeters)
      .sort((left, right) => left.distanceMeters - right.distanceMeters)
      .slice(0, duplicateDetectionRules.maximumCandidates)
  }

  static async synchronize(report: Report, client?: TransactionClientContract): Promise<void> {
    const matches = await this.findMatches(report, client)

    for (const match of matches) {
      const pair = pairFor(report, match.report)
      const existing = await ReportDuplicateReview.query({ client })
        .where('report_id', pair.reportId)
        .where('candidate_report_id', pair.candidateReportId)
        .first()

      if (existing) continue

      await ReportDuplicateReview.create(
        {
          ...pair,
          status: 'pending',
          distanceMeters: match.distanceMeters.toFixed(2),
          detectedAt: DateTime.utc(),
          reviewedByUserId: null,
          reviewedAt: null,
          note: null,
        },
        { client }
      )
    }
  }

  static async list(report: Report) {
    await this.synchronize(report)

    const reviews = await ReportDuplicateReview.query()
      .where((query) => {
        query.where('report_id', report.id).orWhere('candidate_report_id', report.id)
      })
      .preload('report', (query) => query.preload('category'))
      .preload('candidateReport', (query) => query.preload('category'))
      .preload('reviewedBy')
      .orderBy('id', 'desc')

    return reviews.map((review) => {
      const candidate = review.reportId === report.id ? review.candidateReport : review.report

      return {
        id: review.id,
        estado: review.status,
        distanciaMetros: Number(review.distanceMeters),
        detectadoEn: review.detectedAt.toUTC().toISO(),
        ...(review.reviewedAt ? { revisadoEn: review.reviewedAt.toUTC().toISO() } : {}),
        ...(review.note ? { observacion: review.note } : {}),
        ...(review.reviewedBy
          ? {
              revisadoPor: {
                id: review.reviewedBy.id,
                nombre: `${review.reviewedBy.firstName} ${review.reviewedBy.lastName}`.trim(),
              },
            }
          : {}),
        reporte: {
          id: candidate.id,
          folio: candidate.folio,
          categoria: candidate.category.name,
          estadoCodigo: candidate.status,
          latitud: Number(candidate.latitude),
          longitud: Number(candidate.longitude),
          ...(candidate.address ? { direccion: candidate.address } : {}),
          creadoEn: candidate.createdAt.toUTC().toISO(),
        },
      }
    })
  }
}
