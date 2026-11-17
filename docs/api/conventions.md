# Convenciones de la API

- Prefijo obligatorio: `/api/v1`.
- Formato: JSON. Cabecera `Content-Type: application/json`.
- Autenticación prevista: sesión/cookie segura y bearer token para móvil (Fase 2).
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

### Disponibles en la Fase 1

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/health` | Comprobación de estado del servicio |

### Planificados

| Fase | Recursos |
| --- | --- |
| 2 | `/auth`, `/users` |
| 3 | `/quizzes`, `/questions`, `/responses` |
| 4 | `/profiles`, `/genres`, `/recommendations` |
| 7 | `/spotify`, `/comparisons`, `/history`, `/admin` |
