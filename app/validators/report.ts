import vine from '@vinejs/vine'

export const createReportValidator = vine.create({
  categoria: vine.string().trim().minLength(2).maxLength(100),
  descripcion: vine.string().trim().maxLength(2000).nullable().optional(),
  direccion: vine.string().trim().maxLength(500).nullable().optional(),
  latitud: vine.number().range([-90, 90]),
  longitud: vine.number().range([-180, 180]),
  precisionUbicacion: vine.number().range([0, 100_000]).nullable().optional(),
  origenUbicacion: vine.string().trim().maxLength(20),
  foto: vine.file({
    size: '10mb',
    extnames: ['jpg', 'jpeg', 'png'],
  }),
})

export const listReportsValidator = vine.create({
  page: vine.number().positive().withoutDecimals().optional(),
  perPage: vine.number().range([1, 100]).withoutDecimals().optional(),
  search: vine.string().trim().maxLength(150).optional(),
  status: vine.string().trim().maxLength(20).optional(),
  categoryId: vine.number().positive().withoutDecimals().optional(),
  dependencyId: vine.number().positive().withoutDecimals().optional(),
  userId: vine.number().positive().withoutDecimals().optional(),
  from: vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export const updateReportStatusValidator = vine.create({
  status: vine.string().trim().maxLength(20),
  expectedVersion: vine.number().positive().withoutDecimals(),
  note: vine.string().trim().minLength(3).maxLength(1000).optional(),
})

export const reviewReportDuplicateValidator = vine.create({
  status: vine.enum(['confirmed', 'dismissed']),
  note: vine.string().trim().minLength(3).maxLength(1000).optional(),
})
