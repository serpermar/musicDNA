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

- Códigos de estado: `200` éxito, `201` creación, `204` sin contenido, `400` validación, `401` no autenticado, `403` sin permisos, `404` no encontrado, `409` conflicto (recurso duplicado), `413` cuerpo demasiado grande (límite de 256 KB), `429` rate limit, `500` error interno, `503` integración no configurada (por ejemplo, Spotify sin credenciales).
- Rate limiting desde la Fase 1: 200 peticiones/15 min globales, 30 peticiones/15 min en `/auth` y `/spotify`.
- Todas las respuestas de `/api/v1` incluyen `Cache-Control: no-store`.
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

### Disponibles en la Fase 3

| Método | Ruta                                         | Descripción                                             | Auth |
| ------ | -------------------------------------------- | ------------------------------------------------------- | ---- |
| GET    | `/api/v1/quizzes/active`                     | Quiz activo (devuelve `{ quiz: null }` si no hay)       | No   |
| GET    | `/api/v1/quizzes/:quizId`                    | Quiz con preguntas y opciones                           | No   |
| POST   | `/api/v1/quiz-sessions`                      | Crear sesión (`quizId` o `slug`, por defecto el activo) | Sí   |
| GET    | `/api/v1/quiz-sessions/:sessionId`           | Sesión, quiz, vista adaptativa y respuestas             | Sí   |
| PATCH  | `/api/v1/quiz-sessions/:sessionId/progress`  | Fijar `currentQuestionIndex` visible                    | Sí   |
| POST   | `/api/v1/quiz-sessions/:sessionId/responses` | Enviar `{ sessionId, response }` validado               | Sí   |
| POST   | `/api/v1/quiz-sessions/:sessionId/complete`  | Cerrar sesión si no faltan preguntas visibles           | Sí   |

El cuerpo de `/responses` usa `submitAnswerSchema`: `sessionId` debe coincidir con el de la ruta. La vista de una sesión incluye `view.questions` (preguntas visibles tras aplicar `showIf`), `view.progress` (`answered`, `total`, `percent`) y `view.nextQuestionIndex`. Solo el dueño de la sesión puede consultarla o modificarla; el resto recibe `403`.

### Disponibles en la Fase 4

| Método | Ruta                  | Descripción                                              | Auth |
| ------ | --------------------- | -------------------------------------------------------- | ---- |
| POST   | `/api/v1/profiles`    | Generar perfil desde `{ sessionId }` completado          | Sí   |
| GET    | `/api/v1/profiles/me` | Último perfil del usuario (`profile: null` si no existe) | Sí   |

`POST /profiles` devuelve `201` con afinidades de género (dominante + secundarias), década favorita, energía, emoción, rasgos y arquetipo. Solo se puede generar a partir de una sesión propia en estado `COMPLETED`; repetir la llamada sobre la misma sesión actualiza el perfil existente. Los géneros y rasgos se resuelven contra los catálogos cargados por `pnpm db:seed`.

### Fase 5 — Cliente web

La Fase 5 no añade endpoints: la web consume los recursos anteriores mediante `createQuizApi` (`@musicdna/api-client`), que cubre catálogo, sesiones, respuestas, cierre y perfil. La UI reanuda sesiones `IN_PROGRESS` y crea una nueva cuando la sesión no existe o ya está cerrada.

### Fase 6 — Cliente móvil

La app Expo reutiliza `createAuthApi` y `createQuizApi`. El bearer token se obtiene de Better Auth en la cabecera `set-auth-token`, se persiste con `expo-secure-store` y se envía en `Authorization` en cada petición. La variable `EXPO_PUBLIC_API_BASE_URL` apunta a `/api/v1` (por defecto `http://localhost:4000/api/v1`).

### Disponibles en la Fase 7

| Método | Ruta                         | Descripción                                                    | Auth |
| ------ | ---------------------------- | -------------------------------------------------------------- | ---- |
| GET    | `/api/v1/recommendations/me` | Recomendaciones del último perfil (se calculan la primera vez) | Sí   |
| GET    | `/api/v1/profiles/history`   | Historial de perfiles, más reciente primero                    | Sí   |
| POST   | `/api/v1/shares`             | Crear enlace con `{ profileId?, visibility, allowedFields? }`  | Sí   |
| GET    | `/api/v1/shares/:slug`       | Perfil compartido (sin `userId`, correo ni tokens)             | No   |
| POST   | `/api/v1/comparisons`        | Comparar con `{ targetProfileId }` propio o `PUBLIC`           | Sí   |
| GET    | `/api/v1/spotify/status`     | Estado de la conexión (`ACTIVE`, `DISCONNECTED`, `EXPIRED`)    | Sí   |
| GET    | `/api/v1/spotify/auth`       | Redirige a la autorización de Spotify                          | Sí   |
| GET    | `/api/v1/spotify/callback`   | Callback público; valida `state` y guarda tokens cifrados      | No   |
| POST   | `/api/v1/spotify/disconnect` | Borra tokens cifrados y marca la conexión como desconectada    | Sí   |

El callback de Spotify redirige al origen configurado en `CORS_ORIGIN` con `?spotify=connected` o `?spotify=error`. El `state` va firmado con HMAC-SHA256 y caduca en 10 minutos. Si faltan credenciales de Spotify, `/spotify/auth` responde `503 SPOTIFY_UNAVAILABLE`. En ningún caso se devuelven `access_token`, `refresh_token` ni el identificador de Spotify al cliente.

### Fase 8 — Calidad y lanzamiento

La Fase 8 no añade endpoints de negocio. Refuerza los existentes con `Cache-Control: no-store`, límite de cuerpo de 256 KB, rate limit específico para Spotify y errores sin stacks. Los generadores de catálogo (`/genres`) y administración (`/admin`) siguen pendientes para una fase posterior.
