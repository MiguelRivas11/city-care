import type Report from '#models/report'
import MinioReportEvidenceService from '#services/minio_report_evidence_service'
import { Exception } from '@adonisjs/core/exceptions'

export const reportStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  resolved: 'Resuelto',
}

interface ReportPresentationOptions {
  includeCitizen?: boolean
  includeHistory?: boolean
}

export default class ReportPresenterService {
  static async present(report: Report, options: ReportPresentationOptions = {}) {
    const primaryEvidence = report.evidences[0]

    if (
      !primaryEvidence ||
      primaryEvidence.storageProvider !== 'minio' ||
      primaryEvidence.storageStatus !== 'stored' ||
      !primaryEvidence.bucket
    ) {
      throw new Exception('La evidencia del reporte no está disponible', {
        status: 500,
        code: 'E_REPORT_EVIDENCE_NOT_AVAILABLE',
      })
    }

    const fotoUrl = await MinioReportEvidenceService.getSignedUrl(
      primaryEvidence.bucket,
      primaryEvidence.objectKey
    )

    return {
      id: report.id,
      version: report.version,
      folio: report.folio,
      categoriaId: report.categoryId,
      categoriaCodigo: report.category.code,
      categoria: report.category.name,
      ...(report.description ? { descripcion: report.description } : {}),
      ...(report.address ? { direccion: report.address } : {}),
      latitud: Number(report.latitude),
      longitud: Number(report.longitude),
      ...(report.locationAccuracy === null
        ? {}
        : { precisionUbicacion: Number(report.locationAccuracy) }),
      origenUbicacion: report.locationSource,
      estadoCodigo: report.status,
      estado: reportStatusLabels[report.status] ?? report.status,
      fotoUrl,
      fotoUrlExpira: true,
      estadoEvidencia: 'Disponible',
      ...(report.dependency
        ? {
            dependencia: {
              id: report.dependency.id,
              nombre: report.dependency.name,
            },
          }
        : {}),
      ...(report.currentAssignment
        ? {
            asignacionActual: {
              id: report.currentAssignment.id,
              prioridad: report.currentAssignment.priority,
              ...(report.currentAssignment.observations
                ? { observaciones: report.currentAssignment.observations }
                : {}),
              asignadoEn: report.currentAssignment.assignedAt.toUTC().toISO(),
              ...(report.currentAssignment.dueAt
                ? { fechaLimite: report.currentAssignment.dueAt.toUTC().toISO() }
                : {}),
              equipo: {
                id: report.currentAssignment.workTeam.id,
                nombre: report.currentAssignment.workTeam.name,
                dependenciaId: report.currentAssignment.workTeam.dependencyId,
                ...(report.currentAssignment.workTeam.leader
                  ? {
                      lider: {
                        id: report.currentAssignment.workTeam.leader.id,
                        nombre:
                          `${report.currentAssignment.workTeam.leader.firstName} ${report.currentAssignment.workTeam.leader.lastName}`.trim(),
                      },
                    }
                  : {}),
              },
            },
          }
        : {}),
      ...(options.includeCitizen && report.user
        ? {
            ciudadano: {
              id: report.user.id,
              nombre: `${report.user.firstName} ${report.user.lastName}`.trim(),
              email: report.user.email,
            },
          }
        : {}),
      ...(options.includeHistory
        ? {
            historial: report.statusHistory.map((entry) => ({
              id: entry.id,
              ...(entry.previousStatus
                ? {
                    estadoAnteriorCodigo: entry.previousStatus,
                    estadoAnterior:
                      reportStatusLabels[entry.previousStatus] ?? entry.previousStatus,
                  }
                : {}),
              estadoNuevoCodigo: entry.newStatus,
              estadoNuevo: reportStatusLabels[entry.newStatus] ?? entry.newStatus,
              origen: entry.source,
              ...(entry.note ? { observacion: entry.note } : {}),
              ...(entry.changedBy
                ? {
                    cambiadoPor: {
                      id: entry.changedBy.id,
                      nombre: `${entry.changedBy.firstName} ${entry.changedBy.lastName}`.trim(),
                    },
                  }
                : {}),
              creadoEn: entry.createdAt.toUTC().toISO(),
            })),
          }
        : {}),
      creadoEn: report.createdAt.toUTC().toISO(),
      actualizadoEn: report.updatedAt.toUTC().toISO(),
    }
  }
}
