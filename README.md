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
5. Ejecuta `node ace migration:run`.
6. Ejecuta `node ace db:seed` cuando necesites crear los datos iniciales.
7. Inicia el servidor con `npm run dev`.

El backend se publica localmente en `http://localhost:3333` salvo que `HOST` o `PORT` indiquen otra dirección.

## Comandos principales

| Comando | Función |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera la compilación de producción. |
| `npm run lint` | Ejecuta ESLint. |
| `npm run typecheck` | Valida TypeScript sin emitir archivos. |
| `npm test` | Ejecuta las pruebas funcionales. |
| `npm run openapi:generate` | Regenera el SDK Orval desde OpenAPI. |
| `node ace list:routes` | Muestra las rutas registradas. |
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

## Seguridad

- No confirmes archivos `.env` ni contraseñas reales.
- La contraseña inicial del administrador se recibe mediante `ADMIN_INITIAL_PASSWORD`.
- Las cuentas se eliminan mediante baja lógica; no existe una ruta de eliminación física.
- Desactivar una cuenta o restablecer su contraseña revoca las sesiones existentes.

## Alcance posterior

Incidencias, equipos de trabajo, evidencias, auditoría extendida, recuperación de contraseña y despliegue productivo pertenecen a la siguiente etapa.
