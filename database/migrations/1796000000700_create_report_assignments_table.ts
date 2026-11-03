import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'report_assignments'

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
        .integer('work_team_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('work_teams')
        .onDelete('RESTRICT')
      table
        .integer('assigned_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('priority', 20).notNullable().defaultTo('medium')
      table.text('observations').nullable()
      table.timestamp('assigned_at').notNullable().defaultTo(this.now())
      table.timestamp('due_at').nullable()
      table.timestamp('unassigned_at').nullable()
      table
        .integer('unassigned_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.text('unassignment_note').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['report_id', 'assigned_at'])
      table.index(['work_team_id', 'unassigned_at'])
      table.index(['priority', 'due_at'])
    })

    this.schema.alterTable('reports', (table) => {
      table
        .integer('current_assignment_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('report_assignments')
        .onDelete('SET NULL')
      table.index(['current_assignment_id'])
    })
  }

  async down() {
    this.schema.alterTable('reports', (table) => {
      table.dropForeign(['current_assignment_id'])
      table.dropIndex(['current_assignment_id'])
      table.dropColumn('current_assignment_id')
    })
    this.schema.dropTable(this.tableName)
  }
}
