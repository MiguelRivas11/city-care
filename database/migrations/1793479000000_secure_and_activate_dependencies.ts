import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const activeColumnExists = await this.schema.hasColumn('dependencies', 'is_active')

    if (!activeColumnExists) {
      this.schema.alterTable('dependencies', (table) => {
        table.boolean('is_active').notNullable().defaultTo(true)
        table.unique(['name'], 'uq_dependencies_name')
      })
    }

    this.schema.alterTable('users', (table) => {
      table.dropForeign(['dependency_id'])
    })

    this.schema.alterTable('users', (table) => {
      table
        .foreign('dependency_id', 'fk_users_dependency')
        .references('id')
        .inTable('dependencies')
        .onUpdate('CASCADE')
        .onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropForeign(['dependency_id'], 'fk_users_dependency')
    })

    this.schema.alterTable('users', (table) => {
      table.foreign('dependency_id').references('id').inTable('dependencies').onDelete('CASCADE')
    })

    const activeColumnExists = await this.schema.hasColumn('dependencies', 'is_active')

    if (activeColumnExists) {
      this.schema.alterTable('dependencies', (table) => {
        table.dropUnique(['name'], 'uq_dependencies_name')
        table.dropColumn('is_active')
      })
    }
  }
}
