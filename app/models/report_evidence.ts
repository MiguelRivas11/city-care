import { ReportEvidenceSchema } from '#database/schema'
import Report from '#models/report'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ReportEvidence extends ReportEvidenceSchema {
  @belongsTo(() => Report)
  declare report: BelongsTo<typeof Report>
}
