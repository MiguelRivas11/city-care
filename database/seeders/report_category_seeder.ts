import { BaseSeeder } from '@adonisjs/lucid/seeders'

import ReportCategory from '#models/report_category'

const categories = [
  { code: 'pothole', name: 'Bache' },
  { code: 'public_lighting', name: 'Alumbrado público' },
  { code: 'water_leak', name: 'Fuga de agua' },
  { code: 'accumulated_garbage', name: 'Basura acumulada' },
  { code: 'damaged_traffic_light', name: 'Semáforo dañado' },
  { code: 'damaged_sidewalk', name: 'Banqueta dañada' },
  { code: 'fallen_tree', name: 'Árbol caído' },
  { code: 'graffiti_or_vandalism', name: 'Grafiti o vandalismo' },
  { code: 'other', name: 'Otro', requiresDescription: true },
] as const

export default class extends BaseSeeder {
  async run() {
    for (const category of categories) {
      await ReportCategory.updateOrCreate(
        { code: category.code },
        {
          code: category.code,
          name: category.name,
          description: null,
          dependencyId: null,
          requiresDescription:
            'requiresDescription' in category ? category.requiresDescription : false,
          isActive: true,
        }
      )
    }
  }
}
