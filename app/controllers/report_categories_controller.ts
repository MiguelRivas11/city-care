import ReportCategory from '#models/report_category'

export default class ReportCategoriesController {
  /**
   * @index
   * @operationId listReportCategories
   * @summary Consultar categorías disponibles para reportar
   * @description Devuelve únicamente las categorías activas que Flutter puede mostrar en el formulario ciudadano.
   * @responseBody 200 - <ReportCategoriesListApiResponse>
   * @responseBody 401 - <ApiErrorResponse>
   */
  async index() {
    const categories = await ReportCategory.query().where('is_active', true).orderBy('name', 'asc')

    return {
      data: categories.map((category) => ({
        id: category.id,
        codigo: category.code,
        nombre: category.name,
        requiereDescripcion: Boolean(category.requiresDescription),
        ...(category.description ? { descripcion: category.description } : {}),
        ...(category.dependencyId !== null ? { dependenciaId: category.dependencyId } : {}),
      })),
    }
  }
}
