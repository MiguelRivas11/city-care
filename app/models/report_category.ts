import { ReportCategorySchema } from '#database/schema'
import Dependency from '#models/dependency'
import Report from '#models/report'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class ReportCategory extends ReportCategorySchema {
  @belongsTo(() => Dependency)
  declare dependency: BelongsTo<typeof Dependency>

  @hasMany(() => Report)
  declare reports: HasMany<typeof Report>
}
