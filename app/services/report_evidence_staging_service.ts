import app from '@adonisjs/core/services/app'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { randomUUID } from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

export interface StagedReportEvidence {
  objectKey: string
  absolutePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
}

export default class ReportEvidenceStagingService {
  static async stage(file: MultipartFile): Promise<StagedReportEvidence> {
    const now = new Date()
    const extension = file.extname?.toLowerCase() || 'bin'
    const directoryParts = [
      'reports',
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
    ]
    const fileName = `${randomUUID()}.${extension}`
    const objectKey = [...directoryParts, fileName].join('/')
    const stagingDirectory = app.makePath('storage', 'report-evidence-staging', ...directoryParts)
    const absolutePath = path.join(stagingDirectory, fileName)

    await mkdir(stagingDirectory, { recursive: true })
    await file.move(stagingDirectory, { name: fileName, overwrite: false })

    if (!file.isValid) {
      throw new Error(file.errors.map((error) => error.message).join(', '))
    }

    return {
      objectKey,
      absolutePath,
      originalName: file.clientName,
      mimeType:
        file.type && file.subtype ? `${file.type}/${file.subtype}` : 'application/octet-stream',
      sizeBytes: file.size,
    }
  }

  static async remove(stagedEvidence: StagedReportEvidence): Promise<void> {
    await rm(stagedEvidence.absolutePath, { force: true })
  }
}
