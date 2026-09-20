import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'dependencyId',
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'jobTitle',
      'isActive',
      'createdAt',
      'updatedAt',
      'initials',
    ])
  }
}