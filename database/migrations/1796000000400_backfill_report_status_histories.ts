import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const reports = await this.db.from('reports').select('id', 'user_id', 'status', 'created_at')

    if (reports.length === 0) return

    await this.db.table('report_status_histories').multiInsert(
      reports.map((report) => ({
        report_id: report.id,
        previous_status: null,
        new_status: report.status,
        changed_by_user_id: report.user_id,
        source: 'migration',
        note: 'Estado inicial incorporado al habilitar el seguimiento',
        created_at: report.created_at,
      }))
    )
  }

  async down() {
    await this.db.from('report_status_histories').where('source', 'migration').delete()
  }
}
