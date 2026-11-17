# MusicDNA

> Your music. Your personality. Your DNA.

Plataforma multiplataforma de descubrimiento musical y personalidad musical. MusicDNA transforma las respuestas de un cuestionario en una identidad musical propia y genera recomendaciones, comparaciones entre perfiles y un historial de evolución.

## Estado del proyecto

**Fase 8 — Calidad y lanzamiento completada.** El monorepo incluye autenticación con Better Auth, cuestionario adaptativo reanudable, el algoritmo determinista `music-engine`, aplicaciones web y móvil, recomendaciones y comparador deterministas, historial de perfiles, enlaces compartidos sin datos personales y OAuth opcional de Spotify con tokens cifrados en reposo. Spotify no es necesario para el test ni para el algoritmo. El pipeline de GitHub Actions verifica formato, lint, tipos, tests, build y auditoría de dependencias en cada PR.

Ver el plan completo en [`docs/roadmap.md`](docs/roadmap.md).

## Estructura

```text
musicdna/
├── apps/
│   ├── web/        # React + Vite + TypeScript + Tailwind CSS
│   ├── mobile/     # Expo + React Native + TypeScript + NativeWind
│   └── backend/    # Node.js + Express + TypeScript (API /api/v1)
├── packages/
│   ├── shared/         # Tipos y esquemas Zod compartidos
│   ├── quiz-engine/    # Motor del cuestionario (Fase 3)
│   ├── music-engine/   # Algoritmo, recomendaciones y comparador (Fases 4 y 7)
│   ├── api-client/     # Cliente HTTP tipado (Fase 2)
│   └── config/         # Configuración y tokens de diseño compartidos
├── database/
│   ├── prisma/     # schema.prisma y migraciones
│   └── scripts/    # Scripts de base de datos
└── docs/
    ├── specifications/
    ├── architecture/
    ├── database/
    ├── api/
    ├── security.md      # controles y auditoría de dependencias
    └── deployment.md    # despliegue sin Docker
```

## Requisitos

- Node.js >= 22
- pnpm 12.x (incluido vía `packageManager`; se puede activar con `corepack enable`)
- Git
- Cuenta de Neon para PostgreSQL (necesaria para ejecutar el backend contra una base de datos real)

## Puesta en marcha

```powershell
# 1. Activar pnpm (una sola vez)
corepack enable

# 2. Instalar dependencias del workspace
pnpm install

# 3. Crear los archivos de entorno
# El backend carga apps/backend/.env (dotenv lo resuelve desde su carpeta).
Copy-Item apps/backend/.env.example apps/backend/.env
# La raíz sirve como referencia compartida; web y móvil tienen valores por defecto en local.
Copy-Item .env.example .env
# Rellena DATABASE_URL y SESSION_SECRET en apps/backend/.env antes de continuar.

# 4. Comandos disponibles
pnpm dev          # arranca todas las apps en modo desarrollo
pnpm build        # compila todas las apps y paquetes
pnpm typecheck    # chequeo de tipos del monorepo
pnpm lint         # lint del monorepo (ESLint)
pnpm test         # tests del monorepo
pnpm format:check # comprueba el formato con Prettier
pnpm audit        # auditoría completa de dependencias
pnpm audit:ci     # auditoría de producción (bloquea críticos)
pnpm db:generate  # genera el cliente de Prisma
pnpm db:migrate   # aplica migraciones (requiere DATABASE_URL)
pnpm db:seed      # carga el quiz "MusicDNA Core" (requiere DATABASE_URL)
pnpm db:studio    # abre Prisma Studio
```

> **Windows / permisos:** si `corepack enable` falla por falta de permisos al escribir en `C:\Program Files\nodejs`, crea los shims en una carpeta del usuario y añádela al `PATH`:
>
> ```powershell
> New-Item -ItemType Directory -Force -Path "$env:LOCALAPPDATA\pnpm-shims"
> corepack enable --install-directory "$env:LOCALAPPDATA\pnpm-shims"
> $env:PATH = "$env:LOCALAPPDATA\pnpm-shims;$env:PATH"
> ```

Cada aplicación también puede ejecutarse de forma aislada:

```powershell
pnpm --filter @musicdna/web dev
pnpm --filter @musicdna/mobile start
pnpm --filter @musicdna/backend dev
```

## Decisiones y convenciones

- **Monorepo** con pnpm workspaces y Turborepo. Un único backend y un único conjunto de tipos para web y móvil.
- **API REST versionada** bajo el prefijo `/api/v1`.
- **Dominio** en paquetes separados: `quiz-engine` y `music-engine` no dependen de Spotify ni de IA.
- **Autenticación** centralizada en Better Auth; el backend mapea su esquema sobre Prisma y hashea contraseñas con Argon2id.
- **Sesiones**: cookies en web y bearer token en móvil; ambas revocables desde `/api/v1/users/me`.
- **Cuestionario**: `quiz-engine` es puro; el backend solo orquesta persistencia y propiedad de la sesión. Las reglas adaptativas usan `metadata.showIf`.
- **Algoritmo**: `music-engine` es determinista y auditable (sin IA ni Spotify); los arquetipos se eligen por reglas con umbrales sobre puntuaciones 0-100.
- **Social**: recomendaciones y compatibilidad se calculan con reglas puras; los enlaces compartidos usan un slug opaco y no exponen `userId`, correo ni tokens.
- **Spotify**: integración opcional en el backend; el `state` del OAuth va firmado y los tokens se cifran con AES-256-GCM usando `SPOTIFY_TOKEN_KEY`. Nunca se envían al frontend.
- **Secretos** solo en el backend y en variables de entorno; nunca en el frontend ni en el repositorio.
- **Calidad**: ESLint con configuración plana y CI obligatoria en GitHub Actions; los hallazgos de seguridad y sus excepciones se documentan en [`docs/security.md`](docs/security.md).
- **Sin Docker** en esta etapa del proyecto; el despliegue se describe en [`docs/deployment.md`](docs/deployment.md).

Más detalles en [`docs/architecture/overview.md`](docs/architecture/overview.md) y en las [decisiones de arquitectura](docs/architecture/decisions.md).

## Licencia

Uso privado / portfolio. Sin licencia de código abierto por ahora.
