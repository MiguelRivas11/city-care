import hash from '@adonisjs/core/services/hash'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Credential from '#models/credential'
import Dependency from '#models/dependency'
import Report from '#models/report'
import ReportCategory from '#models/report_category'
import Role from '#models/role'
import User from '#models/user'
import env from '#start/env'

const operationalDependencies = [
  {
    name: 'Obras Públicas',
    description: 'Atiende infraestructura vial, baches y banquetas dañadas.',
    email: 'obras.publicas@citycare.com',
    lastName: 'Obras Públicas',
    categoryCodes: ['pothole', 'damaged_sidewalk'],
  },
  {
    name: 'Alumbrado Público',
    description: 'Atiende luminarias y fallas del alumbrado público.',
    email: 'alumbrado.publico@citycare.com',
    lastName: 'Alumbrado Público',
    categoryCodes: ['public_lighting'],
  },
  {
    name: 'Agua Potable',
    description: 'Atiende fugas y afectaciones de la red de agua potable.',
    email: 'agua.potable@citycare.com',
    lastName: 'Agua Potable',
    categoryCodes: ['water_leak'],
  },
  {
    name: 'Aseo Público',
    description: 'Atiende acumulación de basura y limpieza de espacios públicos.',
    email: 'aseo.publico@citycare.com',
    lastName: 'Aseo Público',
    categoryCodes: ['accumulated_garbage'],
  },
  {
    name: 'Movilidad',
    description: 'Atiende semáforos y elementos de control vial dañados.',
    email: 'movilidad@citycare.com',
    lastName: 'Movilidad',
    categoryCodes: ['damaged_traffic_light'],
  },
  {
    name: 'Parques y Jardines',
    description: 'Atiende arbolado y afectaciones en parques y áreas verdes.',
    email: 'parques.jardines@citycare.com',
    lastName: 'Parques y Jardines',
    categoryCodes: ['fallen_tree'],
  },
  {
    name: 'Servicios Públicos',
    description: 'Atiende grafiti, vandalismo y mantenimiento urbano general.',
    email: 'servicios.publicos@citycare.com',
    lastName: 'Servicios Públicos',
    categoryCodes: ['graffiti_or_vandalism'],
  },
] as const

export default class extends BaseSeeder {
  async run() {
    const managerRole = await Role.firstOrCreate(
      { slug: 'dependency_admin' },
      {
        name: 'Administrador de dependencia',
        slug: 'dependency_admin',
        description: 'Administra usuarios, equipos y reportes únicamente dentro de su dependencia',
      }
    )

    const initialPassword = env.get('DEPENDENCY_ADMIN_INITIAL_PASSWORD')
    const passwordHash = initialPassword ? await hash.make(initialPassword) : null

    for (const item of operationalDependencies) {
      const dependency = await Dependency.updateOrCreate(
        { name: item.name },
        {
          name: item.name,
          description: item.description,
          isActive: true,
        }
      )

      for (const categoryCode of item.categoryCodes) {
        const category = await ReportCategory.findBy('code', categoryCode)

        if (!category) {
          throw new Error(
            `No existe la categoría ${categoryCode}. Ejecuta primero report_category_seeder.ts`
          )
        }

        category.dependencyId = dependency.id
        await category.save()

        await Report.query()
          .where('category_id', category.id)
          .whereNull('dependency_id')
          .update({ dependencyId: dependency.id })
      }

      let manager = await User.findBy('email', item.email)

      if (!manager) {
        manager = await User.create({
          dependencyId: dependency.id,
          roleId: managerRole.id,
          firstName: 'Administrador',
          lastName: item.lastName,
          email: item.email,
          phoneNumber: null,
          jobTitle: `Administrador de ${item.name}`,
          isActive: true,
        })
      } else {
        manager.merge({
          dependencyId: dependency.id,
          roleId: managerRole.id,
          firstName: 'Administrador',
          lastName: item.lastName,
          jobTitle: `Administrador de ${item.name}`,
          isActive: true,
        })
        await manager.save()
      }

      const credential = await Credential.findBy('userId', manager.id)

      if (!credential) {
        if (!initialPassword || initialPassword.length < 12 || !passwordHash) {
          throw new Error(
            'Define DEPENDENCY_ADMIN_INITIAL_PASSWORD con al menos 12 caracteres antes de crear las credenciales'
          )
        }

        await Credential.create({
          userId: manager.id,
          email: manager.email,
          passwordHash,
        })
      } else if (credential.email !== manager.email) {
        credential.email = manager.email
        await credential.save()
      }
    }

    const otherCategory = await ReportCategory.findBy('code', 'other')
    if (otherCategory) {
      otherCategory.dependencyId = null
      await otherCategory.save()
    }

    console.log('Dependencias, categorías y administradores operativos configurados correctamente')
  }
}
