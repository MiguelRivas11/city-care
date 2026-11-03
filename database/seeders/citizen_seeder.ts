import hash from '@adonisjs/core/services/hash'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Credential from '#models/credential'
import Dependency from '#models/dependency'
import Role from '#models/role'
import User from '#models/user'
import env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    const initialPassword = env.get('CITIZEN_INITIAL_PASSWORD')
    const email = env.get('CITIZEN_INITIAL_EMAIL', 'ciudadano@citycare.com').toLowerCase()

    if (!initialPassword) {
      console.log('Ciudadano de prueba omitido: CITIZEN_INITIAL_PASSWORD no está definida')
      return
    }

    if (initialPassword.length < 12) {
      throw new Error('CITIZEN_INITIAL_PASSWORD debe contener al menos 12 caracteres')
    }

    const role = await Role.firstOrCreate(
      { slug: 'user' },
      {
        name: 'Usuario',
        slug: 'user',
        description: 'Acceso ciudadano para crear y consultar reportes propios',
      }
    )

    const dependency = await Dependency.firstOrCreate(
      { name: 'Ciudadania' },
      {
        name: 'Ciudadania',
        description: 'Agrupación técnica para cuentas ciudadanas sin funciones administrativas',
        isActive: true,
      }
    )

    const user = await User.firstOrCreate(
      { email },
      {
        dependencyId: dependency.id,
        roleId: role.id,
        firstName: 'Ciudadano',
        lastName: 'Prueba',
        email,
        phoneNumber: null,
        jobTitle: null,
        isActive: true,
      }
    )

    if (user.roleId !== role.id || user.dependencyId !== dependency.id || !user.isActive) {
      user.roleId = role.id
      user.dependencyId = dependency.id
      user.isActive = true
      await user.save()
    }

    const credential = await Credential.findBy('userId', user.id)

    if (!credential) {
      await Credential.create({
        userId: user.id,
        email: user.email,
        passwordHash: await hash.make(initialPassword),
      })
    }

    console.log(`Usuario ciudadano configurado correctamente: ${email}`)
  }
}
