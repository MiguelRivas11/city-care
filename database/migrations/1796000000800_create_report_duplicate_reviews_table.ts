import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'report_duplicate_reviews'

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
      table
        .integer('candidate_report_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('reports')
        .onDelete('CASCADE')
      table.string('status', 20).notNullable().defaultTo('pending')
      table.decimal('distance_meters', 10, 2).notNullable()
      table.timestamp('detected_at').notNullable().defaultTo(this.now())
      table
        .integer('reviewed_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('reviewed_at').nullable()
      table.text('note').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['report_id', 'candidate_report_id'])
      table.index(['report_id', 'status'])
      table.index(['candidate_report_id', 'status'])
      table.index(['reviewed_by_user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
