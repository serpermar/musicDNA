# Arquitectura de MusicDNA

## Visión general

MusicDNA es un monorepo con tres aplicaciones desplegables que comparten tipos, validaciones y lógica de negocio:

```text
apps/web  ─┐
           ├─> packages/api-client ─> API REST /api/v1 ─> apps/backend ─> Neon PostgreSQL
apps/mobile ┘                              │                   │
                                           ├── packages/quiz-engine
                                           └── packages/music-engine
```

## Capas del backend

El backend sigue una arquitectura modular por capas. Cada módulo de dominio (auth, users, quizzes, profiles, recommendations, spotify, comparisons, admin) puede contener:

```text
routes/ -> controllers/ -> services/ -> repositories/ -> Prisma
              │              │
          validators/    integrations/
```

- **routes**: definición de rutas y middleware por endpoint.
- **controllers**: lectura de request/response; sin reglas de negocio.
- **services**: reglas de negocio y orquestación.
- **repositories**: acceso a datos con Prisma.
- **middleware**: autenticación, autorización, rate limiting y manejo de errores.
- **validators**: esquemas Zod compartidos con el frontend cuando sea posible.
- **integrations**: adaptadores externos (Spotify). Aislados del dominio.
- **utils**: helpers sin estado.

## Paquetes compartidos

| Paquete | Responsabilidad | Depende de |
| --- | --- | --- |
| `shared` | Tipos y esquemas Zod comunes | Zod |
| `config` | Tokens de diseño y constantes de entorno seguras | Nada |
| `quiz-engine` | Carga de preguntas, validación de respuestas y progreso | `shared` |
| `music-engine` | Cálculo de afinidades y personalidades musicales | `shared` |
| `api-client` | Cliente HTTP tipado para web y móvil | `shared` |

`quiz-engine` y `music-engine` son puros: no acceden a bases de datos ni a APIs externas. Así pueden testearse con Vitest y reutilizarse en backend, web y móvil.

## Fronteras importantes

- El **cuestionario y el algoritmo funcionan sin Spotify**. Spotify solo añade descubrimiento y enlaces externos.
- El **frontend nunca contiene secretos** de Spotify ni credenciales de base de datos.
- Los tokens de Spotify se guardan cifrados en la base de datos y se almacenan solo en el backend.
- El uso de datos de escucha de Spotify para perfiles queda **bloqueado** hasta verificar que las políticas lo permiten.
- Las respuestas y resultados son propiedad del usuario: privacidad y borrado de cuenta son requisitos de diseño.

## Despliegue previsto

| Componente | Proveedor |
| --- | --- |
| Web | Vercel o Netlify |
| Backend | Render o Railway |
| Base de datos | Neon PostgreSQL |
| Móvil | Expo EAS Build |
