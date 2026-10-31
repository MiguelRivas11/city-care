import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const roleColumnExists = await this.schema.hasColumn(this.tableName, 'role_id')

    // La columna puede existir porque se agregó directamente en MySQL.
    if (roleColumnExists) {
      return
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.integer('role_id').unsigned().notNullable()

      table.index(['role_id'], 'idx_users_role_id')

      table
        .foreign('role_id', 'fk_users_role')
        .references('id')
        .inTable('roles')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
    })
  }

  async down() {
    const roleColumnExists = await this.schema.hasColumn(this.tableName, 'role_id')

    if (!roleColumnExists) {
      return
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['role_id'], 'fk_users_role')
      table.dropIndex(['role_id'], 'idx_users_role_id')
      table.dropColumn('role_id')
    })
  }
}
