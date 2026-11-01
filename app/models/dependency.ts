import { DependencySchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import ReportCategory from '#models/report_category'
import Report from '#models/report'

export default class Dependency extends DependencySchema {
  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @hasMany(() => ReportCategory)
  declare reportCategories: HasMany<typeof ReportCategory>

  @hasMany(() => Report)
  declare reports: HasMany<typeof Report>
}
