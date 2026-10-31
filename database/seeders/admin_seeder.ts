import hash from '@adonisjs/core/services/hash'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Role from '#models/role'
import User from '#models/user'
import Dependency from '#models/dependency'
import Credential from '#models/credential'
import env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    /*
     * Crear los roles básicos si todavía no existen.
     */
    const adminRole = await Role.firstOrCreate(
      {
        slug: 'admin',
      },
      {
        name: 'Administrador',
        slug: 'admin',
        description: 'Acceso administrativo al sistema',
      }
    )

    await Role.firstOrCreate(
      {
        slug: 'dependency_admin',
      },
      {
        name: 'Administrador de dependencia',
        slug: 'dependency_admin',
        description: 'Administra usuarios únicamente dentro de su dependencia',
      }
    )

    await Role.firstOrCreate(
      {
        slug: 'user',
      },
      {
        name: 'Usuario',
        slug: 'user',
        description: 'Acceso normal al sistema',
      }
    )

    /*
     * Crear o recuperar la dependencia administrativa.
     */
    const dependency = await Dependency.firstOrCreate(
      {
        name: 'Administracion',
      },
      {
        name: 'Administracion',
        description: 'Dependencia general para cuentas administrativas',
      }
    )

    const initialPassword = env.get('ADMIN_INITIAL_PASSWORD')
    const existingAdmin = await User.findBy('email', 'admin@citycare.com')

    if (!existingAdmin && (!initialPassword || initialPassword.length < 12)) {
      throw new Error(
        'Define ADMIN_INITIAL_PASSWORD con al menos 12 caracteres antes de ejecutar el seeder'
      )
    }

    /*
     * Crear o recuperar al administrador.
     */
    const user = await User.firstOrCreate(
      {
        email: 'admin@citycare.com',
      },
      {
        dependencyId: dependency.id,
        roleId: adminRole.id,
        firstName: 'Admin',
        lastName: 'Principal',
        email: 'admin@citycare.com',
        phoneNumber: null,
        jobTitle: 'Administrador',
        isActive: true,
      }
    )

    /*
     * Si el administrador ya existía, garantizar que conserve el rol admin.
     */
    if (user.roleId !== adminRole.id) {
      user.roleId = adminRole.id
      await user.save()
    }

    /*
     * Crear la credencial solamente cuando todavía no exista.
     * Ejecutar nuevamente el seeder no restablece la contraseña.
     */
    const existingCredential = await Credential.findBy('userId', user.id)

    if (!existingCredential) {
      if (!initialPassword || initialPassword.length < 12) {
        throw new Error(
          'Define ADMIN_INITIAL_PASSWORD con al menos 12 caracteres antes de ejecutar el seeder'
        )
      }

      const passwordHash = await hash.make(initialPassword)

      await Credential.create({
        userId: user.id,
        email: user.email,
        passwordHash,
      })
    }

    console.log('Usuario administrador configurado correctamente')
  }
}
