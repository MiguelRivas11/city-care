import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    const rolesTableExists = await this.schema.hasTable(this.tableName)

    // La tabla puede existir porque inicialmente se creó directamente en MySQL.
    if (rolesTableExists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table.string('name', 100).notNullable()
      table.string('slug', 50).notNullable().unique()
      table.string('description', 255).nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    const rolesTableExists = await this.schema.hasTable(this.tableName)

    if (rolesTableExists) {
      this.schema.dropTable(this.tableName)
    }
  }
}
