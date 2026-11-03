import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'work_teams'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('dependency_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('dependencies')
        .onDelete('RESTRICT')
      table.string('name', 150).notNullable()
      table.text('description').nullable()
      table
        .integer('leader_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['dependency_id', 'name'])
      table.index(['dependency_id', 'is_active'])
      table.index(['leader_user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
