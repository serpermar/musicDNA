# Roadmap de MusicDNA

El proyecto se desarrolla por fases. No se implementa una fase hasta que la anterior esté cerrada y documentada.

| Fase | Nombre | Estado | Entregable principal |
| --- | --- | --- | --- |
| 1 | Fundación | **En curso** | Monorepo, apps, paquetes, Prisma y documentación |
| 2 | Autenticación | Pendiente | Registro, login, sesiones y perfil de usuario |
| 3 | Cuestionario | Pendiente | Preguntas, respuestas, sesiones y Quiz Engine |
| 4 | MusicDNA | Pendiente | Algoritmo de puntuación, perfiles y personalidades |
| 5 | Aplicación web | Pendiente | Landing, cuestionario, dashboard y recomendaciones |
| 6 | Aplicación móvil | Pendiente | Android/iOS con Expo y NativeWind |
| 7 | Integraciones y social | Pendiente | Spotify, comparador, compartir e historial |
| 8 | Calidad y lanzamiento | Pendiente | Tests, seguridad, CI/CD y despliegue |

## Fase 1 — Fundación

- [x] Estructura de carpetas del monorepo.
- [x] Configuración de pnpm workspaces y Turborepo.
- [x] Skeleton de apps web, mobile y backend.
- [x] Paquetes compartidos (`shared`, `quiz-engine`, `music-engine`, `api-client`, `config`).
- [x] Modelo relacional de Prisma con las entidades mínimas requeridas.
- [x] Documentación inicial y convenciones.
- [x] Verificación de instalación, tipos, build y tests iniciales.

## Criterios de desarrollo

- Arquitectura limpia y modular; sin duplicación de lógica de negocio.
- TypeScript estricto y validación con Zod en las fronteras de datos.
- Tests para la lógica principal (quiz-engine, music-engine y comparador).
- Commits organizados, preferiblemente con Conventional Commits.
- Sin Docker, sin IA y sin dependencia de Spotify para el núcleo del producto.
