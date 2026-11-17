# Roadmap de MusicDNA

El proyecto se desarrolla por fases. No se implementa una fase hasta que la anterior esté cerrada y documentada.

| Fase | Nombre                 | Estado         | Entregable principal                               |
| ---- | ---------------------- | -------------- | -------------------------------------------------- |
| 1    | Fundación              | **Completada** | Monorepo, apps, paquetes, Prisma y documentación   |
| 2    | Autenticación          | **Completada** | Registro, login, sesiones y perfil de usuario      |
| 3    | Cuestionario           | **Completada** | Preguntas, respuestas, sesiones y Quiz Engine      |
| 4    | MusicDNA               | **Completada** | Algoritmo de puntuación, perfiles y personalidades |
| 5    | Aplicación web         | Pendiente      | Landing, cuestionario, dashboard y recomendaciones |
| 6    | Aplicación móvil       | Pendiente      | Android/iOS con Expo y NativeWind                  |
| 7    | Integraciones y social | Pendiente      | Spotify, comparador, compartir e historial         |
| 8    | Calidad y lanzamiento  | Pendiente      | Tests, seguridad, CI/CD y despliegue               |

## Fase 1 — Fundación

- [x] Estructura de carpetas del monorepo.
- [x] Configuración de pnpm workspaces y Turborepo.
- [x] Skeleton de apps web, mobile y backend.
- [x] Paquetes compartidos (`shared`, `quiz-engine`, `music-engine`, `api-client`, `config`).
- [x] Modelo relacional de Prisma con las entidades mínimas requeridas.
- [x] Documentación inicial y convenciones.
- [x] Verificación de instalación, tipos, build y tests iniciales.

## Fase 2 — Autenticación

- [x] Integrar Better Auth Express con el adaptador de Prisma.
- [x] Mapear el esquema central (`users`, `sessions`, `accounts`, `verifications`) sobre el modelo existente.
- [x] Registro e inicio de sesión con email y contraseña; hash Argon2id.
- [x] Acceso como invitado mediante el plugin anónimo.
- [x] Sesiones revocables, listado de sesiones y borrado de cuenta.
- [x] Recuperación de contraseña (enlace dev; proveedor de email pendiente para producción).
- [x] Soporte de bearer token para la app móvil.
- [x] Cliente API compartido y pantalla web de autenticación/perfil.
- [x] Tests de esquemas, hash y rutas protegidas.

## Fase 3 — Cuestionario

- [x] Motor puro `quiz-engine`: validación por tipo de pregunta, reglas adaptativas `showIf`, vista, progreso y finalización.
- [x] Esquemas y tipos compartidos para sesiones, respuestas y progreso.
- [x] Repositorio Prisma de quizzes, preguntas, respuestas y sesiones.
- [x] Servicio de quiz con inyección de dependencias: catálogo, sesiones, respuesta, navegación y cierre.
- [x] Rutas `/quizzes` y `/quiz-sessions` con validación Zod y propiedad de sesión verificada.
- [x] Seed idempotente del quiz "MusicDNA Core" con preguntas de personalidad, géneros, décadas, instrumentos, energía, letras y hábitos.
- [x] Tests del servicio (progreso, adaptatividad, validación, permisos) y de protección/validación de rutas.

## Fase 4 — MusicDNA

- [x] `music-engine` puro: agregación de géneros, décadas, instrumentos, energía, emoción y rasgos con puntuaciones 0-100 y rangos.
- [x] Catálogo determinista de 8 arquetipos de personalidad con reglas por prioridad y fallback equilibrado.
- [x] Servicio de perfiles: valida sesión completada y propiedad, calcula el perfil, resuelve catálogos y persiste `MusicProfile`, `GenreScore` y `PersonalityScore`.
- [x] Regeneración idempotente del perfil de una sesión (sustituye puntuaciones anteriores).
- [x] Rutas `POST /profiles` y `GET /profiles/me` con autenticación y validación Zod.
- [x] Seed extendido con géneros y rasgos necesarios para la persistencia.
- [x] Tests del algoritmo, del servicio de perfiles y de protección de rutas.

## Criterios de desarrollo

- Arquitectura limpia y modular; sin duplicación de lógica de negocio.
- TypeScript estricto y validación con Zod en las fronteras de datos.
- Tests para la lógica principal (quiz-engine, music-engine y comparador).
- Commits organizados, preferiblemente con Conventional Commits.
- Sin Docker, sin IA y sin dependencia de Spotify para el núcleo del producto.
