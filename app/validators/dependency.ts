import vine from '@vinejs/vine'

const dependencyName = () => vine.string().trim().minLength(2).maxLength(150)

export const listDependenciesValidator = vine.create({
  page: vine.number().positive().withoutDecimals().optional(),
  perPage: vine.number().range([1, 100]).withoutDecimals().optional(),
  search: vine.string().trim().maxLength(150).optional(),
  isActive: vine.boolean().optional(),
})

export const createDependencyValidator = vine.create({
  name: dependencyName().unique({ table: 'dependencies', column: 'name' }),
  description: vine.string().trim().maxLength(1000).nullable().optional(),
  isActive: vine.boolean().optional(),
})

export const updateDependencyValidator = vine.withMetaData<{ dependencyId: number }>().create({
  name: dependencyName()
    .unique({
      table: 'dependencies',
      column: 'name',
      filter: (query, _value, field) => {
        query.whereNot('id', field.meta.dependencyId)
      },
    })
    .optional(),
  description: vine.string().trim().maxLength(1000).nullable().optional(),
})

export const updateDependencyStatusValidator = vine.create({
  isActive: vine.boolean(),
})

export const updateDependencyManagersValidator = vine.create({
  userIds: vine.array(vine.number().positive().withoutDecimals()).minLength(1),
})
