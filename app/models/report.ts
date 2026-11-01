import { ReportSchema } from '#database/schema'
import Dependency from '#models/dependency'
import ReportCategory from '#models/report_category'
import ReportEvidence from '#models/report_evidence'
import User from '#models/user'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Report extends ReportSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => ReportCategory, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof ReportCategory>

  @belongsTo(() => Dependency)
  declare dependency: BelongsTo<typeof Dependency>

  @hasMany(() => ReportEvidence)
  declare evidences: HasMany<typeof ReportEvidence>
}
