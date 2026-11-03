import { WorkTeamSchema } from '#database/schema'
import Dependency from '#models/dependency'
import ReportAssignment from '#models/report_assignment'
import User from '#models/user'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class WorkTeam extends WorkTeamSchema {
  @belongsTo(() => Dependency)
  declare dependency: BelongsTo<typeof Dependency>

  @belongsTo(() => User, { foreignKey: 'leaderUserId' })
  declare leader: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'work_team_members',
    localKey: 'id',
    pivotForeignKey: 'work_team_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
    pivotTimestamps: { createdAt: 'created_at', updatedAt: false },
  })
  declare members: ManyToMany<typeof User>

  @hasMany(() => ReportAssignment)
  declare assignments: HasMany<typeof ReportAssignment>
}
