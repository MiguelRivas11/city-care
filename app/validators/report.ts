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
