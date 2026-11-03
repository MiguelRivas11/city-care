import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'report_status_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('report_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('reports')
        .onDelete('CASCADE')
      table.string('previous_status', 20).nullable()
      table.string('new_status', 20).notNullable()
      table
        .integer('changed_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('source', 30).notNullable().defaultTo('admin')
      table.text('note').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      table.index(['report_id', 'created_at'])
      table.index(['changed_by_user_id'])
      table.index(['new_status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
