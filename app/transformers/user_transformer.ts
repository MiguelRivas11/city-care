import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { getRolePermissions } from '#services/authorization_service'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'dependencyId',
        'roleId',
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'jobTitle',
        'createdAt',
        'updatedAt',
        'initials',
      ]),

      isActive: Boolean(this.resource.isActive),

      role: {
        id: this.resource.role.id,
        name: this.resource.role.name,
        slug: this.resource.role.slug,
        ...(this.resource.role.description ? { description: this.resource.role.description } : {}),
        permissions: getRolePermissions(this.resource.role.slug),
      },

      dependency: {
        id: this.resource.dependency.id,
        name: this.resource.dependency.name,
        isActive: Boolean(this.resource.dependency.isActive),
        managers: [],
      },
    }
  }
}
