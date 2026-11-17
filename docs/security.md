# Seguridad de MusicDNA

Este documento resume los controles implementados, la política de dependencias y las excepciones aceptadas tras la auditoría de la Fase 8.

## Controles implementados

### Autenticación y sesiones

- Better Auth con adaptador de Prisma. Contraseñas hasheadas con **Argon2id** (`@node-rs/argon2`), longitud entre 10 y 128 caracteres.
- Cookies seguras en web y bearer token en móvil (`expo-secure-store`); `resolveSession` acepta ambos.
- Sesiones revocables, listado de sesiones, borrado de cuenta y revocación al restablecer contraseña.
- Acceso como invitado mediante el plugin anónimo de Better Auth.
- `SESSION_SECRET` de al menos 32 caracteres es obligatorio en producción.

### API y transporte

- Prefijo `/api/v1`, CORS restringido a `CORS_ORIGIN` (lista separada por comas) con credenciales.
- `helmet()`, `X-Powered-By` desactivado y `Cache-Control: no-store` en todas las respuestas de la API.
- Rate limits: 30 peticiones/15 min para `/auth` y `/spotify`, 200 peticiones/15 min para el resto de la API.
- Cuerpo JSON limitado a 256 KB; excesos responden `413 PAYLOAD_TOO_LARGE`.
- `TRUST_PROXY=1` solo debe activarse detrás de un reverse proxy de confianza; por defecto está a `0`.
- Validación Zod en todas las fronteras (cuerpo, parámetros y variables de entorno).
- Errores: mensajes genéricos, sin stacks ni secretos; Prisma `P2002`/`P2025` se traducen a `409`/`404`.

### Datos sensibles

- Spotify es opcional: si se configura, requiere `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI` y `SPOTIFY_TOKEN_KEY` en producción.
- El `state` OAuth va firmado con HMAC-SHA256 (secreto de Better Auth), incluye nonce y caduca en 10 minutos.
- `access_token` y `refresh_token` se cifran con **AES-256-GCM** antes de persistirse; cada cifrado usa un IV nuevo.
- Ningún token, correo ajeno ni `userId` se devuelve en enlaces compartidos o respuestas públicas: `SharedProfileView` es una proyección explícita.
- Los secretos solo viven en variables de entorno del backend; `.env` está ignorado por Git.

## Auditoría de dependencias

Scripts disponibles:

| Script            | Comando                                    | Uso                                                     |
| ----------------- | ------------------------------------------ | ------------------------------------------------------- |
| `pnpm audit`      | `pnpm audit --audit-level=high`            | Auditoría completa (incluye dependencias de desarrollo) |
| `pnpm audit:prod` | `pnpm audit --prod --audit-level=high`     | Solo dependencias de producción                         |
| `pnpm audit:ci`   | `pnpm audit --prod --audit-level=critical` | Compuerta obligatoria en CI                             |

Los overrides de pnpm viven en `pnpm-workspace.yaml` (pnpm 12 ya no lee `pnpm.overrides` de `package.json`):

```yaml
overrides:
  tinypool: ^2.2.0
  postcss: ^8.5.18
```

Con esos overrides se resolvió el hallazgo **critical** de Tinypool. El estado actual es:

- Auditoría completa: **9 hallazgos** (5 moderate, 4 high, 0 critical).
- Auditoría de producción: **5 hallazgos** (2 moderate, 3 high, 0 critical).

CI bloquea solo vulnerabilidades **critical** y ejecuta la auditoría completa como trabajo informativo (`continue-on-error`), para que las excepciones documentadas a continuación no rompan el pipeline sin dejar de ser visibles.

### Excepciones aceptadas

| Paquete                     | Severidad     | Origen                                  | Justificación y plan                                                                                                                                                                                                                                                               |
| --------------------------- | ------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `image-size`                | high (x2)     | Expo SDK 54 → Metro 0.83.3              | Parche disponible solo en `>=2.0.3` (cambio major incompatible con el buscador de imágenes de Metro). Es dependencia de **build-time** del bundle móvil; no procesa entradas del usuario. Se revisará al actualizar Expo SDK/Metro.                                                |
| `glob`                      | moderate      | React Native codegen (Expo 54)          | Se usa en tiempo de generación de código nativo, no en el servidor ni en las apps publicadas. Las versiones parcheadas pertenecen a otra rama major. Se revisará con el próximo SDK de Expo.                                                                                       |
| `minimatch`                 | moderate      | Vía `glob@7` (React Native)             | Misma dependencia de build-time que `glob`. No expone superficie de ataque en producción.                                                                                                                                                                                          |
| `deepmerge-ts`              | high          | Prisma 6.19.3 (`@prisma/config`)        | Solo se ejecuta en los comandos CLI de Prisma (`generate`, `migrate`). La corrección exige `>=8.0.0`; se planifica con la actualización major de Prisma.                                                                                                                           |
| `picomatch`                 | high          | Chokidar/Tailwind y Jest (React Native) | La versión publicada más reciente (`4.0.7`) sigue dentro del rango vulnerable: **no hay corrección disponible**. Se usa para observación de archivos en desarrollo y en el toolchain de RN; no procesa entradas del usuario en producción. Se vigilará hasta que exista un parche. |
| `vitest` / `@vitest/mocker` | moderate (x3) | Runner de tests de backend y motores    | Únicamente en desarrollo/CI; no se publica en el artefacto de producción. Se actualizará a la línea 4.x cuando se unifiquen todos los paquetes.                                                                                                                                    |

Ninguna excepción afecta al backend desplegado: el artefacto de producción no incluye Metro, React Native codegen, Prisma CLI ni Vitest.

## Tareas pendientes antes de un lanzamiento público

1. Conectar un proveedor de email de producción para verificación y recuperación (actualmente los enlaces se imprimen en consola solo en desarrollo).
2. Ejecutar pruebas de integración contra PostgreSQL/Neon reales (`DATABASE_URL`) y verificar `pnpm db:deploy`.
3. Rotar `SESSION_SECRET` y `SPOTIFY_TOKEN_KEY` con un gestor de secretos; no reutilizar los valores de ejemplo.
4. Revisar las excepciones de esta tabla con cada actualización de Expo, Prisma y Vitest.
