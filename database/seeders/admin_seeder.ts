import hash from '@adonisjs/core/services/hash'
import Dependency from '#models/dependency'
import User from '#models/user'
import Credential from '#models/credential'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // 1. Crear (o reusar) una dependencia para el admin
    const dependency = await Dependency.firstOrCreate(
      { name: 'Administracion' },
      {
        name: 'Administracion',
        description: 'Dependencia general para cuentas administrativas',
      }
    )

    // 2. Crear (o reusar) el usuario admin
    const user = await User.firstOrCreate(
      { email: 'admin@citycare.com' },
      {
        dependencyId: dependency.id,
        firstName: 'Admin',
        lastName: 'Principal',
        email: 'admin@citycare.com',
        phoneNumber: null,
        jobTitle: 'Administrador',
        isActive: true,
      }
    )

    // 3. Crear (o reusar) la credencial con el password hasheado
    const passwordHash = await hash.make('Admin1234')

    await Credential.firstOrCreate(
      { userId: user.id },
      {
        userId: user.id,
        email: user.email,
        passwordHash,
      }
    )

    console.log('Usuario admin listo -> email: admin@citycare.com | password: Admin1234')
  }
}