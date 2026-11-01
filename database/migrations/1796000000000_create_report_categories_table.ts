import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'report_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('dependency_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('dependencies')
        .onDelete('RESTRICT')
      table.string('code', 50).notNullable().unique()
      table.string('name', 100).notNullable().unique()
      table.text('description').nullable()
      table.boolean('requires_description').notNullable().defaultTo(false)
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['dependency_id'])
      table.index(['is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
