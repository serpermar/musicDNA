# Convenciones de la API

- Prefijo obligatorio: `/api/v1`.
- Formato: JSON. Cabecera `Content-Type: application/json`.
- Autenticación: cookie segura en web y bearer token en móvil, gestionadas por Better Auth. El middleware `resolveSession` acepta ambas.
- Validación de entrada con esquemas Zod de `@musicdna/shared`.
- Respuestas de error consistentes:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": {}
  }
}
```

- Códigos de estado: `200` éxito, `201` creación, `204` sin contenido, `400` validación, `401` no autenticado, `403` sin permisos, `404` no encontrado, `429` rate limit, `500` error interno.
- Rate limiting global aplicado desde la Fase 1.
- Ninguna respuesta contendrá secretos, tokens de Spotify ni credenciales.

## Endpoints

### Disponibles en la Fase 2

| Método | Ruta                                   | Descripción                             |
| ------ | -------------------------------------- | --------------------------------------- |
| GET    | `/api/v1/health`                       | Comprobación de estado del servicio     |
| GET    | `/api/v1/auth/ok`                      | Estado de Better Auth                   |
| POST   | `/api/v1/auth/sign-up/email`           | Registro con email y contraseña         |
| POST   | `/api/v1/auth/sign-in/email`           | Inicio de sesión                        |
| POST   | `/api/v1/auth/sign-in/anonymous`       | Acceso como invitado                    |
| POST   | `/api/v1/auth/sign-out`                | Cierre de sesión                        |
| GET    | `/api/v1/auth/get-session`             | Sesión actual (cookie o bearer)         |
| POST   | `/api/v1/auth/request-password-reset`  | Solicitar recuperación                  |
| POST   | `/api/v1/auth/reset-password`          | Restablecer contraseña                  |
| POST   | `/api/v1/auth/change-password`         | Cambiar contraseña                      |
| POST   | `/api/v1/auth/update-user`             | Actualizar nombre/avatar en Better Auth |
| GET    | `/api/v1/auth/me`                      | Usuario de la sesión (forma canónica)   |
| GET    | `/api/v1/users/me`                     | Usuario + perfil personal               |
| PATCH  | `/api/v1/users/me`                     | Actualizar perfil y privacidad          |
| DELETE | `/api/v1/users/me`                     | Eliminar cuenta                         |
| GET    | `/api/v1/users/me/sessions`            | Listar sesiones (sin tokens)            |
| DELETE | `/api/v1/users/me/sessions/:sessionId` | Revocar una sesión                      |

### Planificados

| Fase | Recursos                                         |
| ---- | ------------------------------------------------ |
| 3    | `/quizzes`, `/questions`, `/responses`           |
| 4    | `/profiles`, `/genres`, `/recommendations`       |
| 7    | `/spotify`, `/comparisons`, `/history`, `/admin` |
