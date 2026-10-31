# Registro de cambios

Los cambios importantes de City Care se documentan en este archivo.

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
