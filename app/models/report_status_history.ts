import { ReportStatusHistorySchema } from '#database/schema'
import Report from '#models/report'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ReportStatusHistory extends ReportStatusHistorySchema {
  @belongsTo(() => Report)
  declare report: BelongsTo<typeof Report>

  @belongsTo(() => User, { foreignKey: 'changedByUserId' })
  declare changedBy: BelongsTo<typeof User>
}
