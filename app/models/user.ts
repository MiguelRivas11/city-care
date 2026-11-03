import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Dependency from '#models/dependency'
import Credential from '#models/credential'
import Role from '#models/role'
import env from '#start/env'
import Report from '#models/report'
import ReportStatusHistory from '#models/report_status_history'
import WorkTeam from '#models/work_team'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: env.get('ACCESS_TOKEN_EXPIRES_IN', '7d'),
  })

  // @no-swagger
  declare currentAccessToken?: AccessToken

  @belongsTo(() => Dependency)
  declare dependency: BelongsTo<typeof Dependency>
  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @hasOne(() => Credential)
  declare credential: HasOne<typeof Credential>

  @hasMany(() => Report)
  declare reports: HasMany<typeof Report>

  @hasMany(() => ReportStatusHistory, { foreignKey: 'changedByUserId' })
  declare reportStatusChanges: HasMany<typeof ReportStatusHistory>

  @hasMany(() => WorkTeam, { foreignKey: 'leaderUserId' })
  declare ledWorkTeams: HasMany<typeof WorkTeam>

  get initials() {
    const first = this.firstName ?? ''
    const last = this.lastName ?? ''
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${this.email.slice(0, 2)}`.toUpperCase()
  }
}
