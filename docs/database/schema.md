# Modelo de datos

El esquema completo está en [`database/prisma/schema.prisma`](../../database/prisma/schema.prisma). PostgreSQL se gestiona con Prisma Migrate sobre Neon. La migración inicial está en `database/prisma/migrations/20261117000000_init`.

## Entidades

| Entidad               | Propósito                                                    |
| --------------------- | ------------------------------------------------------------ |
| `users`               | Cuentas, invitados, privacidad y borrado lógico              |
| `sessions`            | Sesiones revocables con expiración (Better Auth)             |
| `accounts`            | Métodos de autenticación; contraseñas hasheadas con Argon2id |
| `verifications`       | Tokens temporales de verificación y recuperación             |
| `user_profiles`       | Datos opcionales del perfil personal                         |
| `quizzes`             | Definiciones versionadas del cuestionario                    |
| `questions`           | Preguntas con tipo, categoría, peso y metadatos adaptativos  |
| `answers`             | Opciones con pesos de puntuación en JSON                     |
| `quiz_sessions`       | Intentos de cuestionario y su progreso                       |
| `user_responses`      | Respuestas por pregunta y sesión                             |
| `music_profiles`      | Identidad musical calculada                                  |
| `music_genres`        | Géneros y subgéneros (árbol)                                 |
| `genre_scores`        | Afinidad por género y perfil                                 |
| `personality_traits`  | Catálogo de rasgos                                           |
| `personality_scores`  | Puntuación de rasgos por perfil                              |
| `artists`             | Artistas de catálogo / Spotify                               |
| `recommendations`     | Recomendaciones, incluida la zona de confort                 |
| `user_favorites`      | Favoritos del usuario                                        |
| `spotify_connections` | Tokens cifrados y estado de conexión                         |
| `profile_comparisons` | Compatibilidad entre dos perfiles                            |
| `shared_profiles`     | Enlaces compartidos con control de campos y visibilidad      |

## Convenciones

- Identificadores `UUID`: los genera Better Auth en las entidades de autenticación y Prisma/Database en el resto.
- Tablas en `snake_case` mediante `@@map`; modelos en PascalCase.
- Auditoría con `created_at` y `updated_at` en las entidades mutables.
- Borrado en cascada solo cuando la dependencia no tiene sentido sin su padre; el resto usa `SetNull`.
- Puntuaciones `Decimal(5,2)` en el rango 0-100.
- Índices en las claves foráneas y en los campos de consulta frecuente.
- Los tokens de Spotify se guardan cifrados; las claves de cifrado viven solo en el backend.
- El email de un invitado es sintético (`@guest.musicdna.local`) y `is_guest = true`.

## Migraciones

La primera migración ya está generada. Con `DATABASE_URL` configurada:

```powershell
pnpm db:migrate   # aplica migraciones pendientes en Neon
pnpm db:generate  # regenera el cliente de Prisma
pnpm db:studio    # explora la base de datos
```

`pnpm db:migrate --name <nombre>` creará las siguientes migraciones a medida que avancen las fases.
