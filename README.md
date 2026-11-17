# MusicDNA

> Your music. Your personality. Your DNA.

Plataforma multiplataforma de descubrimiento musical y personalidad musical. MusicDNA transforma las respuestas de un cuestionario en una identidad musical propia y genera recomendaciones, comparaciones entre perfiles y un historial de evolución.

## Estado del proyecto

**Fase 6 — Móvil completada.** El monorepo incluye autenticación con Better Auth, cuestionario adaptativo con sesiones reanudables, el algoritmo determinista `music-engine`, una aplicación web con dashboard/resultados y una app Expo + NativeWind con las mismas pantallas. El token móvil se guarda con `expo-secure-store` y se envía como bearer. Las recomendaciones personalizadas llegarán en la Fase 7.

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
│   ├── music-engine/   # Algoritmo MusicDNA (Fase 4)
│   ├── api-client/     # Cliente HTTP tipado (Fase 2)
│   └── config/         # Configuración y tokens de diseño compartidos
├── database/
│   ├── prisma/     # schema.prisma y migraciones
│   └── scripts/    # Scripts de base de datos
└── docs/
    ├── specifications/
    ├── architecture/
    ├── database/
    └── api/
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

# 3. Crear el archivo de entorno
Copy-Item .env.example .env

# 4. Comandos disponibles
pnpm dev          # arranca todas las apps en modo desarrollo
pnpm build        # compila todas las apps y paquetes
pnpm typecheck    # chequeo de tipos del monorepo
pnpm lint         # lint del monorepo
pnpm test         # tests del monorepo
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
- **Secretos** solo en el backend y en variables de entorno; nunca en el frontend ni en el repositorio.
- **Sin Docker** en esta etapa del proyecto.

Más detalles en [`docs/architecture/overview.md`](docs/architecture/overview.md).

## Licencia

Uso privado / portfolio. Sin licencia de código abierto por ahora.
