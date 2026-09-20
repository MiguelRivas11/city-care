import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Dependency from '#models/dependency'
import Credential from '#models/credential'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)

  // @no-swagger
  declare currentAccessToken?: AccessToken

  @belongsTo(() => Dependency)
  declare dependency: BelongsTo<typeof Dependency>

  @hasOne(() => Credential)
  declare credential: HasOne<typeof Credential>

  get initials() {
    const first = this.firstName ?? ''
    const last = this.lastName ?? ''
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${this.email.slice(0, 2)}`.toUpperCase()
  }
}