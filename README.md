# City Care API

Backend de City Care construido con AdonisJS, Lucid y MySQL. La versión 1.0 incluye autenticación por tokens, administración de usuarios, roles y permisos, dependencias, contrato OpenAPI y un cliente TypeScript generado con Orval.

## Requisitos

- Node.js compatible con el proyecto
- npm
- MySQL
- Base de datos `city-care` o el nombre configurado en `DB_DATABASE`

## Configuración local

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env` y configura la conexión MySQL.
3. Genera un valor seguro para `APP_KEY`.
4. Define `ADMIN_INITIAL_PASSWORD` únicamente antes de ejecutar el seeder inicial.
5. Para crear la cuenta ciudadana de desarrollo, define `CITIZEN_INITIAL_EMAIL` y
   `CITIZEN_INITIAL_PASSWORD`. La contraseña debe tener al menos 12 caracteres.
6. Ejecuta `node ace migration:run`.
7. Ejecuta `node ace db:seed` cuando necesites crear los datos iniciales.
8. Inicia el servidor con `npm run dev`.

El backend se publica localmente en `http://localhost:3333` salvo que `HOST` o `PORT` indiquen otra dirección.

## Comandos principales

| Comando                     | Función                                |
| --------------------------- | -------------------------------------- |
| `npm run dev`               | Inicia el servidor de desarrollo.      |
| `npm run build`             | Genera la compilación de producción.   |
| `npm run lint`              | Ejecuta ESLint.                        |
| `npm run typecheck`         | Valida TypeScript sin emitir archivos. |
| `npm test`                  | Ejecuta las pruebas funcionales.       |
| `npm run openapi:generate`  | Regenera el SDK Orval desde OpenAPI.   |
| `node ace list:routes`      | Muestra las rutas registradas.         |
| `node ace migration:status` | Consulta el estado de las migraciones. |

## API y documentación

- Swagger JSON: `GET /swagger`
- Interfaz de documentación: `GET /docs`
- Contrato versionado: `openapi/city-care.v1.yaml`
- SDK generado: `sdk/generated/city-care.ts`

Las rutas de administración requieren un token Bearer y un permiso compatible con la operación solicitada.

## Módulos de la versión 1.0

- Inicio y cierre de sesión mediante tokens con expiración.
- Consulta del perfil autenticado.
- Bloqueo de cuentas inactivas y revocación de sesiones.
- Alta, consulta, edición, baja lógica y contraseña de usuarios.
- Roles `admin`, `dependency_admin` y `user` con permisos centralizados.
- Alta, consulta, edición, estado y responsables de dependencias.
- Errores JSON uniformes y rate limiting en autenticación.
- OpenAPI, Swagger y cliente Orval.

## Pruebas

La suite funcional usa SQLite de forma aislada para no alterar MySQL. El servidor de pruebas escucha en `127.0.0.1:3333` y las tablas se migran, limpian y revierten durante la ejecución.

La versión 1.0 se cerró con 46 pruebas aprobadas, lint, typecheck, build, 16 endpoints de API y 7 migraciones aplicadas en MySQL.

## Desarrollo actual: etapa 3.4

La creación de reportes ciudadanos se encuentra implementada en `POST /api/v1/reports`.
La ruta requiere token Bearer y recibe `multipart/form-data` con categoría, descripción,
dirección, coordenadas, precisión, origen de ubicación y fotografía.

- Las categorías se normalizan en `report_categories`.
- El usuario se obtiene exclusivamente desde el token.
- Las coordenadas `0,0` y los valores fuera de rango se rechazan.
- La categoría `Otro` exige una descripción.
- El servidor genera un folio `CC-AÑO-000000` y el estado inicial `Pendiente`.
- La fotografía se prepara de forma privada, se transfiere al bucket privado de MinIO y
  el archivo temporal se elimina.
- La metadata queda registrada en `report_evidences` con proveedor `minio`, estado
  `stored`, bucket y clave de objeto.
- La respuesta incluye `fotoUrl` firmada y temporal. En desarrollo con Android Emulator,
  la URL utiliza `10.0.2.2:9000` para llegar al MinIO de la computadora anfitriona.
- Si la transacción de MySQL falla después de subir la imagen, el backend elimina el
  objeto de MinIO como compensación.

La consulta y el seguimiento se encuentran disponibles mediante las rutas siguientes:

- `GET /api/v1/report-categories`: catálogo activo para el formulario móvil.
- `GET /api/v1/reports`: lista paginada de reportes del ciudadano autenticado.
- `GET /api/v1/reports/:id`: detalle propio con evidencia e historial.
- `GET /api/v1/admin/reports`: seguimiento administrativo con alcance por dependencia.
- `GET /api/v1/admin/reports/:id`: detalle administrativo con ciudadano e historial.
- `PATCH /api/v1/admin/reports/:id/status`: transición controlada de estado.

Los listados aceptan búsqueda por folio, descripción o dirección; filtros por estado,
categoría, fechas y, para administración global, dependencia y ciudadano. Los estados
permitidos son `pending`, `in_progress` y `resolved`. Retroceder o reabrir exige una
observación, y cada movimiento queda registrado en `report_status_histories`.

Los ciudadanos solamente consultan sus propios reportes. El administrador general puede
consultarlos todos y el administrador de dependencia queda limitado a su ámbito.

La asignación operativa se administra mediante equipos de trabajo:

- `GET /api/v1/admin/teams`: listado paginado y filtrado de equipos.
- `POST /api/v1/admin/teams`: creación con líder e integrantes.
- `GET /api/v1/admin/teams/:id`: detalle del equipo.
- `PATCH /api/v1/admin/teams/:id`: edición de nombre, descripción o líder.
- `PATCH /api/v1/admin/teams/:id/status`: activación o baja lógica.
- `PUT /api/v1/admin/teams/:id/members`: reemplazo controlado de integrantes.
- `POST /api/v1/admin/reports/:id/assignments`: asignación o reasignación.
- `GET /api/v1/admin/reports/:id/assignments`: historial de asignaciones.
- `DELETE /api/v1/admin/reports/:id/assignment`: retiro justificado de la asignación actual.

Cada equipo pertenece a una dependencia. Su líder forma parte de los integrantes y todas
las cuentas deben estar activas. Las asignaciones admiten prioridad `low`, `medium`, `high`
o `urgent`, fecha límite y observaciones. Una reasignación cierra el registro actual y crea
otro, por lo que la trazabilidad nunca se sobrescribe. El administrador de dependencia queda
limitado a sus propios equipos y reportes.

El proyecto cuenta ahora con 15 migraciones aplicadas, 32 endpoints y 65 pruebas funcionales.

## Conexión desde Flutter

- El backend escucha en `0.0.0.0:3333` durante el desarrollo local.
- Android Emulator utiliza `http://10.0.2.2:3333` para llegar al backend anfitrión.
- Las fotografías firmadas de MinIO utilizan `http://10.0.2.2:9000` en el emulador.
- Flutter debe guardar el token en almacenamiento seguro y enviarlo mediante
  `Authorization: Bearer TOKEN`.
- El contrato OpenAPI permanece publicado en `openapi/city-care.v1.yaml`.

Las variables `MINIO_*` de `.env` controlan la conexión interna, el endpoint público,
el bucket, la región y la duración de las URL firmadas. Las credenciales reales nunca
deben incluirse en el repositorio.

## Seguridad

- No confirmes archivos `.env` ni contraseñas reales.
- La contraseña inicial del administrador se recibe mediante `ADMIN_INITIAL_PASSWORD`.
- Las cuentas se eliminan mediante baja lógica; no existe una ruta de eliminación física.
- Desactivar una cuenta o restablecer su contraseña revoca las sesiones existentes.

## Alcance posterior

La asignación a dependencias y equipos corresponde al punto 3.4. La inteligencia artificial,
la integración completa con el frontend y el cierre de la versión 2.0 corresponden a los
puntos 3.5, 3.6 y 3.7.
