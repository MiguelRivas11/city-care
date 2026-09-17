import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table
        .integer('dependency_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('dependencies')
        .onDelete('CASCADE')

      table.string('first_name', 100).notNullable()
      table.string('last_name', 100).notNullable()
      table.string('email', 150).notNullable().unique()
      table.string('phone_number', 20).nullable()
      table.string('job_title', 100).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}