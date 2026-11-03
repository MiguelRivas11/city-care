import Report from '#models/report'
import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class ReportDuplicateReview extends BaseModel {
  static table = 'report_duplicate_reviews'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare reportId: number

  @column()
  declare candidateReportId: number

  @column()
  declare status: string

  @column()
  declare distanceMeters: string

  @column.dateTime()
  declare detectedAt: DateTime

  @column()
  declare reviewedByUserId: number | null

  @column.dateTime()
  declare reviewedAt: DateTime | null

  @column()
  declare note: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Report, { foreignKey: 'reportId' })
  declare report: BelongsTo<typeof Report>

  @belongsTo(() => Report, { foreignKey: 'candidateReportId' })
  declare candidateReport: BelongsTo<typeof Report>

  @belongsTo(() => User, { foreignKey: 'reviewedByUserId' })
  declare reviewedBy: BelongsTo<typeof User>
}
