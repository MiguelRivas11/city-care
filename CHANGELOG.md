# Registro de cambios

Los cambios importantes de City Care se documentan en este archivo.

## En desarrollo - Etapa 3.4

### Agregado

- Catálogo autenticado de categorías activas para el formulario Flutter.
- Seeder opcional de ciudadano de prueba sin contraseñas dentro del código fuente.
- Equipos de trabajo asociados obligatoriamente a una dependencia activa.
- Líder e integrantes activos, validados dentro de la misma dependencia y sin duplicados.
- Alta, listado, detalle, edición, baja lógica y reemplazo de integrantes de equipos.
- Asignación y reasignación de incidencias con prioridad, fecha límite y observaciones.
- Historial completo de asignaciones, retiros, responsables y motivos.
- Restricción transaccional para mantener una sola asignación activa por reporte.
- Permisos específicos para equipos y asignación de reportes.
- Nueve operaciones nuevas en OpenAPI y el cliente Orval.

### Seguridad e integridad

- El administrador de dependencia solo administra equipos y reportes de su ámbito.
- No es posible mezclar integrantes, equipos o reportes de dependencias diferentes.
- Un equipo con incidencias activas no puede desactivarse.
- Las reasignaciones conservan el registro anterior en lugar de sobrescribirlo.

### Validación

- Suite completa de 64 pruebas, typecheck, OpenAPI y Orval aprobados.
- Quince migraciones aplicadas y treinta y un endpoints registrados.

## En desarrollo - Etapa 3.3

### Agregado

- Listado paginado de reportes propios con búsqueda y filtros por estado, categoría y fechas.
- Consulta de detalle con evidencia firmada e historial completo de estados.
- Listado y detalle administrativo con alcance global o limitado por dependencia.
- Cambios controlados entre `pending`, `in_progress` y `resolved`.
- Observación obligatoria al retroceder o reabrir una incidencia.
- Tabla `report_status_histories` con actor, origen, observación y fecha de cada movimiento.
- Permisos `reports.list`, `reports.read` y `reports.status`.
- Cinco operaciones nuevas en OpenAPI y el cliente Orval.

### Validación

- Suite completa de 57 pruebas, typecheck, lint, build, OpenAPI y Orval aprobados.
- Doce migraciones aplicadas y veintidós endpoints registrados.

## En desarrollo - Etapa 3.2

### Agregado

- Cliente S3 compatible con MinIO y configuración validada mediante variables de entorno.
- Almacenamiento de fotografías en el bucket privado `city-care`.
- URL firmada temporal en `fotoUrl`, compatible con Android Emulator mediante `10.0.2.2`.
- Eliminación del archivo de preparación después de transferirlo.
- Compensación automática en MinIO cuando falla la transacción de MySQL.
- Error uniforme `E_REPORT_STORAGE_UNAVAILABLE` con estado HTTP 503.
- Configuración aislada para pruebas funcionales sin dependencia de servicios externos.

### Validación

- Conexión real verificada mediante subida, consulta, firma y eliminación de un objeto temporal.
- Suite completa de 52 pruebas, typecheck, lint, build, OpenAPI y Orval aprobados.

## En desarrollo - Etapa 3.1

### Agregado

- Catálogo normalizado con las nueve categorías iniciales de incidencias.
- Tablas de reportes y evidencias con integridad referencial e índices de consulta.
- Endpoint autenticado `POST /api/v1/reports` para recibir reportes multipart.
- Validación de categoría, descripción condicional, coordenadas, origen y fotografía.
- Folio público generado por el servidor y estado inicial `Pendiente`.
- Preparación privada local de evidencias hasta su transferencia a MinIO en el 3.2.
- Contrato OpenAPI y cliente Orval con soporte para `FormData` y archivos.
- Seis pruebas funcionales nuevas; suite completa de 52 pruebas.

## 1.0.0 - 2026-10-31

### Agregado

- Autenticación mediante correo, contraseña y tokens con expiración.
- Perfil autenticado y cierre de sesión.
- Roles, permisos y autorización por operación.
- Administración completa de usuarios con baja lógica.
- Administración de dependencias y responsables.
- Contrato OpenAPI, Swagger, documentación visual y SDK Orval.
- Suite funcional de 46 pruebas.
- Documentación técnica de los apartados 2.1 a 2.7.

### Seguridad

- Bloqueo de inicio de sesión para cuentas inactivas.
- Revocación de tokens al desactivar cuentas o restablecer contraseñas.
- Rate limiting para intentos de autenticación.
- Contraseña inicial del administrador retirada del código fuente.
- Respuestas de error uniformes sin exposición de información sensible.

### Base de datos

- Siete migraciones aplicadas para dependencias, usuarios, tokens, credenciales y roles.
- Integridad referencial de dependencias protegida mediante restricciones.
- Operaciones críticas ejecutadas dentro de transacciones.
