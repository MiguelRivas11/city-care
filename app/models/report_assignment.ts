import { ReportAssignmentSchema } from '#database/schema'
import Report from '#models/report'
import User from '#models/user'
import WorkTeam from '#models/work_team'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ReportAssignment extends ReportAssignmentSchema {
  @belongsTo(() => Report)
  declare report: BelongsTo<typeof Report>

  @belongsTo(() => WorkTeam)
  declare workTeam: BelongsTo<typeof WorkTeam>

  @belongsTo(() => User, { foreignKey: 'assignedByUserId' })
  declare assignedBy: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'unassignedByUserId' })
  declare unassignedBy: BelongsTo<typeof User>
}
