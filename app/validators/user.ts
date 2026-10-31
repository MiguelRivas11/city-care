import vine from '@vinejs/vine'

/**
 * Reglas compartidas.
 */
const email = () => vine.string().trim().email().maxLength(150)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Valida la creación administrativa de usuarios.
 */
export const createUserValidator = vine.create({
  dependencyId: vine.number().exists({ table: 'dependencies', column: 'id' }),

  roleId: vine.number().exists({ table: 'roles', column: 'id' }),

  firstName: vine.string().trim().minLength(1).maxLength(100),
  lastName: vine.string().trim().minLength(1).maxLength(100),

  email: email().unique({
    table: 'users',
    column: 'email',
  }),

  phoneNumber: vine.string().trim().maxLength(20).nullable().optional(),
  jobTitle: vine.string().trim().maxLength(100).nullable().optional(),
  isActive: vine.boolean().optional(),

  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Valida el inicio de sesión.
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

/**
 * Valida los filtros y la paginación del listado administrativo.
 */
export const listUsersValidator = vine.create({
  page: vine.number().positive().withoutDecimals().optional(),
  perPage: vine.number().range([1, 100]).withoutDecimals().optional(),
  search: vine.string().trim().maxLength(150).optional(),
  roleId: vine.number().positive().withoutDecimals().optional(),
  dependencyId: vine.number().positive().withoutDecimals().optional(),
  isActive: vine.boolean().optional(),
})

/**
 * Valida la edición administrativa. El identificador del usuario se recibe
 * como metadata para permitir conservar su propio correo.
 */
export const updateUserValidator = vine.withMetaData<{ userId: number }>().create({
  dependencyId: vine.number().exists({ table: 'dependencies', column: 'id' }).optional(),

  roleId: vine.number().exists({ table: 'roles', column: 'id' }).optional(),

  firstName: vine.string().trim().minLength(1).maxLength(100).optional(),
  lastName: vine.string().trim().minLength(1).maxLength(100).optional(),

  email: email()
    .unique({
      table: 'users',
      column: 'email',
      filter: (query, _value, field) => {
        query.whereNot('id', field.meta.userId)
      },
    })
    .optional(),

  phoneNumber: vine.string().trim().maxLength(20).nullable().optional(),
  jobTitle: vine.string().trim().maxLength(100).nullable().optional(),
})

/**
 * Valida la baja lógica y reactivación de usuarios.
 */
export const updateUserStatusValidator = vine.create({
  isActive: vine.boolean(),
})

/**
 * Valida el restablecimiento administrativo de contraseña.
 */
export const resetUserPasswordValidator = vine.create({
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})
