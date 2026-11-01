import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reports'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('folio', 32).notNullable().unique()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('report_categories')
        .onDelete('RESTRICT')
      table
        .integer('dependency_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('dependencies')
        .onDelete('RESTRICT')
      table.text('description').nullable()
      table.string('address', 500).nullable()
      table.decimal('latitude', 9, 6).notNullable()
      table.decimal('longitude', 9, 6).notNullable()
      table.decimal('location_accuracy', 10, 2).nullable()
      table.string('location_source', 20).notNullable()
      table.string('status', 20).notNullable().defaultTo('pending')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['user_id', 'created_at'])
      table.index(['category_id'])
      table.index(['dependency_id', 'status'])
      table.index(['status'])
      table.index(['latitude', 'longitude'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
