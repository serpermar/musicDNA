# Despliegue de MusicDNA

No se usa Docker. El backend es un proceso Node que corre con `tsx`, la web es un sitio estático de Vite y la app móvil se distribuye con Expo. La guía es válida para Railway, Render, Fly.io o cualquier PaaS que ejecute Node 22.

## Requisitos previos

- Node `>=22` y pnpm `12.21.0` (`corepack` puede instalarlo automáticamente).
- PostgreSQL (Neon recomendado) con SSL y una URL de conexión accesible desde el backend.
- Un dominio HTTPS para la web y otro para la API (o un mismo dominio con reverse proxy).

## Variable de entorno por servicio

### Backend (`apps/backend`)

| Variable                | Obligatoria en producción | Descripción                                                                         |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| `NODE_ENV`              | Sí                        | `production`.                                                                       |
| `PORT`                  | No                        | Puerto HTTP; por defecto `4000`.                                                    |
| `DATABASE_URL`          | Sí                        | PostgreSQL con `?sslmode=require`.                                                  |
| `SESSION_SECRET`        | Sí                        | Al menos 32 caracteres aleatorios.                                                  |
| `BETTER_AUTH_URL`       | Sí                        | URL pública de la API, p. ej. `https://api.tudominio.com`.                          |
| `CORS_ORIGIN`           | Sí                        | Origen(es) de la web separados por comas.                                           |
| `TRUST_PROXY`           | Recomendado               | `1` detrás de reverse proxy; `0` si el proceso está expuesto.                       |
| `SPOTIFY_CLIENT_ID`     | Solo si se usa Spotify    | Dashboard de Spotify.                                                               |
| `SPOTIFY_CLIENT_SECRET` | Solo si se usa Spotify    | Secreto de la app.                                                                  |
| `SPOTIFY_REDIRECT_URI`  | Solo si se usa Spotify    | Debe coincidir exactamente con `https://api.tudominio.com/api/v1/spotify/callback`. |
| `SPOTIFY_TOKEN_KEY`     | Solo si se usa Spotify    | Al menos 16 caracteres para cifrar tokens con AES-256-GCM.                          |

La validación centralizada en `src/config/env.ts` hace fallar el arranque si falta cualquier obligatoria o si Spotify está a medias configurado. Copiar `.env.example` tal cual es seguro: las variables de Spotify vacías significan «integración desactivada».

### Web (`apps/web`)

| Variable            | Descripción                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://api.tudominio.com/api/v1`. Solo variables `VITE_` se exponen al navegador. |

### Móvil (`apps/mobile`)

| Variable                   | Descripción                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL` | URL pública de la API. Se incluye en el bundle; nunca guardar secretos aquí. |

## Base de datos

El esquema de Prisma vive en `database/prisma/schema.prisma`. En despliegue:

```powershell
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:deploy
```

`db:deploy` ejecuta `prisma migrate deploy` y es idempotente: debe correrse antes de arrancar la nueva versión del backend. El seed (`pnpm db:seed`) solo es necesario la primera vez o para entornos de demostración.

## Backend

```powershell
pnpm --filter @musicdna/backend start
```

El proceso escucha en `PORT` y expone la comprobación `GET /api/v1/health`. Configura el health check de la plataforma con esa ruta. Detrás de un proxy, activa `TRUST_PROXY=1` para que el rate limit lea correctamente `X-Forwarded-For`.

Antes de publicar, revisa `docs/security.md`: los enlaces de verificación y recuperación se imprimen en consola en desarrollo, por lo que hace falta un proveedor de email en producción.

## Web

```powershell
pnpm --filter @musicdna/web build
```

El resultado está en `apps/web/dist`. Sírvelo como sitio estático con una regla de reescritura: cualquier ruta que no corresponda a un archivo debe devolver `index.html`, para que `/s/:slug` (enlaces compartidos) funcione con recarga directa.

La web usa cookies de Better Auth: `CORS_ORIGIN` debe incluir exactamente el origen público de la web y el proxy debe reenviar las cabeceras `Cookie`/`Set-Cookie`.

## Móvil

```powershell
pnpm --filter @musicdna/mobile start
```

Para producción, genera el bundle con EAS Build y distribuye mediante EAS Update/App Store/Google Play. El token de sesión se guarda con `expo-secure-store` y se envía como bearer; no hay cookies en móvil. `EXPO_PUBLIC_API_BASE_URL` debe apuntar a la misma API HTTPS que la web.

## Verificación posterior al despliegue

1. `GET https://api.tudominio.com/api/v1/health` devuelve `{ "status": "ok", ... }` y `Cache-Control: no-store`.
2. Registro/login desde la web y desde la app móvil; la sesión persiste tras recargar.
3. Cuestionario completo → perfil → recomendaciones y compartir un enlace `/s/:slug`.
4. Si Spotify está activo: `GET /api/v1/spotify/auth` redirige a Spotify y el callback vuelve a la web con `?spotify=connected`, sin tokens en la URL.
5. `pnpm audit:ci` pasa en CI (0 vulnerabilidades critical).
