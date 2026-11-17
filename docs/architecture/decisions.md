# Decisiones de arquitectura (ADR)

## ADR-001 — Monorepo con pnpm y Turborepo

- **Estado:** aceptada (Fase 1).
- **Contexto:** tres aplicaciones (web, móvil, backend) deben compartir tipos, validaciones y lógica; se quiere evitar duplicación y mantener un único flujo de dependencias.
- **Decisión:** usar pnpm workspaces y Turborepo con paquetes bajo `packages/`.
- **Consecuencias:** un único `pnpm install`, builds en caché y publicación interna de paquetes. Requiere Node >= 22 y pnpm 12.

## ADR-002 — Algoritmo propio independiente de Spotify e IA

- **Estado:** aceptada (Fase 1).
- **Contexto:** el núcleo del producto es el test de personalidad musical; dependencias externas podrían limitar su funcionamiento o cumplimiento de políticas.
- **Decisión:** `music-engine` implementa puntuaciones deterministas a partir de las respuestas del cuestionario. Spotify es una integración opcional en el backend.
- **Consecuencias:** el test funciona sin credenciales externas y la lógica es testeable y auditable.

## ADR-003 — API REST versionada desde el inicio

- **Estado:** aceptada (Fase 1).
- **Contexto:** web y móvil evolucionarán a ritmos distintos; se necesita un contrato estable.
- **Decisión:** prefijo `/api/v1` y esquemas Zod compartidos entre backend y clientes.
- **Consecuencias:** cambios rupturistas requieren una nueva versión de la API.

## ADR-004 — Sin Docker en la fase inicial

- **Estado:** aceptada (Fase 1).
- **Contexto:** prioridad de aprendizaje y simplicidad; los proveedores de despliegue elegidos soportan Node y PostgreSQL directamente.
- **Decisión:** no incluir contenedores todavía.
- **Consecuencias:** menos configuración inicial; se reconsiderará si aparece una necesidad real.

## ADR-005 — Arquetipos por reglas, no por IA

- **Estado:** aceptada (Fase 4).
- **Contexto:** el nombre y la descripción de la personalidad musical deben ser reproducibles, explicables y consistentes entre web y móvil.
- **Decisión:** `music-engine` define un catálogo ordenado de arquetipos con predicados sobre puntuaciones normalizadas; el primero que cumple gana y el último actúa como fallback.
- **Consecuencias:** el resultado es auditable y testeable; cambiar un arquetipo es un cambio de código versionado con `algorithmVersion`.

## ADR-006 — Bearer token persistido en SecureStore

- **Estado:** aceptada (Fase 6).
- **Contexto:** la app móvil no usa cookies y necesita mantener la sesión de Better Auth entre reinicios sin exponer el token en texto plano.
- **Decisión:** el cliente HTTP compartido emite el token de `set-auth-token`; móvil lo guarda con `expo-secure-store` y lo envía como `Authorization: Bearer`. En web se mantiene el modo cookie con `credentials: 'include'`.
- **Consecuencias:** no se comparte almacenamiento entre plataformas; si SecureStore falla (web/emulador) se usa un fallback en memoria y la sesión dura solo mientras la app está abierta.

## ADR-007 — Recomendaciones y compatibilidad por reglas puras

- **Estado:** aceptada (Fase 7).
- **Contexto:** el producto necesita recomendaciones y comparaciones entre perfiles sin recurrir a IA ni a servicios externos, y con resultados reproducibles en web y móvil.
- **Decisión:** `buildRecommendations` y `compareProfiles` viven en `music-engine`. La compatibilidad pondera géneros compartidos (Jaccard, 50), cercanía de energía (25), emoción (15) y década (10); todo determinista y con explicación textual.
- **Consecuencias:** se puede testear y versionar con `algorithmVersion`; cambiar una regla afecta de forma predecible a todos los clientes.

## ADR-008 — Enlaces compartidos opacos y Spotify cifrado

- **Estado:** aceptada (Fase 7).
- **Contexto:** compartir un perfil y conectar Spotify introducen datos sensibles: identidad del usuario y tokens de acceso a su cuenta musical.
- **Decisión:** los enlaces usan un slug aleatorio y una vista limitada (`SharedProfileView`) que excluye `userId`, correo y tokens. Solo se puede comparar contra perfiles propios o marcados como `PUBLIC`. El OAuth de Spotify usa un `state` firmado con caducidad, intercambia el código en el backend y guarda `access_token`/`refresh_token` cifrados con AES-256-GCM; el callback solo devuelve un estado al frontend.
- **Consecuencias:** no hay fugas de identidad ni de secretos; si falta `SPOTIFY_TOKEN_KEY` u otras credenciales, la integración responde `503` y el núcleo del producto sigue funcionando.

## ADR-009 — Calidad automatizada como compuerta de merge

- **Estado:** aceptada (Fase 8).
- **Contexto:** `pnpm lint` no ejecutaba ninguna tarea y la calidad dependía de la disciplina manual; además, Zod 4 y pnpm 12 cambiaban la configuración de validación y de overrides.
- **Decisión:** ESLint 9+ con configuración plana en la raíz y script `lint` en los 8 paquetes; GitHub Actions ejecuta `format:check`, `lint`, `typecheck`, `test`, `build` y `prisma generate` con `--frozen-lockfile`. Zod se actualizó a `^4.6.7` y los overrides de dependencias se trasladaron a `pnpm-workspace.yaml`.
- **Consecuencias:** cualquier PR con errores de estilo, tipos, tests o formato se bloquea antes de fusionarse; la regla `react-hooks/set-state-in-effect` se desactiva de forma documentada porque la carga inicial de datos es asíncrona y deliberada.

## ADR-010 — Defensa en profundidad y auditoría con excepciones explícitas

- **Estado:** aceptada (Fase 8).
- **Contexto:** la auditoría de dependencias mostraba hallazgos de severidad alta en el toolchain de Expo/Metro y en la CLI de Prisma, con correcciones que exigen cambios major. Bloquear el pipeline por todos ellos impediría publicar, pero ignorarlos sería irresponsable.
- **Decisión:** el backend añade `Cache-Control: no-store`, límite de cuerpo de 256 KB con `413`, rate limit específico para Spotify y `TRUST_PROXY` explícito. CI bloquea solo vulnerabilidades **critical** (`pnpm audit:ci`) y ejecuta la auditoría completa como trabajo informativo. Las excepciones y su plan de revisión se documentan en `docs/security.md`.
- **Consecuencias:** no hay hallazgos critical pendientes; las excepciones restantes son de build-time y no forman parte del artefacto de producción. Cualquier nueva vulnerabilidad critical rompe el pipeline.
