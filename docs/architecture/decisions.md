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
