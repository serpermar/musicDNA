# Modelo de datos

El esquema completo está en [`database/prisma/schema.prisma`](../../database/prisma/schema.prisma). PostgreSQL se gestiona con Prisma Migrate sobre Neon.

## Entidades

| Entidad | Propósito |
| --- | --- |
| `users` | Cuentas, invitados, privacidad y borrado lógico |
| `sessions` | Sesiones revocables con expiración |
| `user_profiles` | Datos opcionales del perfil personal |
| `quizzes` | Definiciones versionadas del cuestionario |
| `questions` | Preguntas con tipo, categoría, peso y metadatos adaptativos |
| `answers` | Opciones con pesos de puntuación en JSON |
| `quiz_sessions` | Intentos de cuestionario y su progreso |
| `user_responses` | Respuestas por pregunta y sesión |
| `music_profiles` | Identidad musical calculada |
| `music_genres` | Géneros y subgéneros (árbol) |
| `genre_scores` | Afinidad por género y perfil |
| `personality_traits` | Catálogo de rasgos |
| `personality_scores` | Puntuación de rasgos por perfil |
| `artists` | Artistas de catálogo / Spotify |
| `recommendations` | Recomendaciones, incluida la zona de confort |
| `user_favorites` | Favoritos del usuario |
| `spotify_connections` | Tokens cifrados y estado de conexión |
| `profile_comparisons` | Compatibilidad entre dos perfiles |
| `shared_profiles` | Enlaces compartidos con control de campos y visibilidad |

## Convenciones

- Identificadores `UUID` generados por la base de datos.
- Tablas en `snake_case` mediante `@@map`; modelos en PascalCase.
- Auditoría con `created_at` y `updated_at` en las entidades mutables.
- Borrado en cascada solo cuando la dependencia no tiene sentido sin su padre; el resto usa `SetNull`.
- Puntuaciones `Decimal(5,2)` en el rango 0-100.
- Índices en las claves foráneas y en los campos de consulta frecuente.
- Los tokens de Spotify se guardan cifrados; las claves de cifrado viven solo en el backend.

## Migraciones

Las migraciones se crearán cuando se conecte la base de datos de Neon:

```powershell
pnpm db:migrate --name init
pnpm db:generate
```

El primer commit de migración se hará en la Fase 2, cuando el backend empiece a usar Prisma.
