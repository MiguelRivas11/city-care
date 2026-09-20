import { DependencySchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Dependency extends DependencySchema {
  @hasMany(() => User)
  declare users: HasMany<typeof User>
}