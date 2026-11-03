import { Exception } from '@adonisjs/core/exceptions'

import type Report from '#models/report'

export function assertReportVersion(report: Report, expectedVersion: number): void {
  if (report.version !== expectedVersion) {
    throw new Exception(
      'El reporte fue modificado por otro usuario. Recarga la información antes de continuar',
      {
        status: 409,
        code: 'E_REPORT_CONCURRENCY_CONFLICT',
      }
    )
  }
}

export function incrementReportVersion(report: Report): void {
  report.version += 1
}
