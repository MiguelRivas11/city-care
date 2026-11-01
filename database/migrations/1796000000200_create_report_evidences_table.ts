import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'report_evidences'

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
      table.string('kind', 20).notNullable().defaultTo('image')
      table.string('storage_provider', 30).notNullable().defaultTo('local_staging')
      table.string('storage_status', 20).notNullable().defaultTo('staged')
      table.string('bucket', 100).nullable()
      table.string('object_key', 500).notNullable().unique()
      table.string('original_name', 255).notNullable()
      table.string('mime_type', 100).notNullable()
      table.bigInteger('size_bytes').unsigned().notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['report_id'])
      table.index(['storage_status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
