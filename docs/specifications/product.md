# Especificación de producto

## Identidad

- **Nombre:** MusicDNA.
- **Eslogan:** Your music. Your personality. Your DNA.
- **Promesa:** descubrir la identidad musical de cada usuario a partir de sus respuestas y ayudarle a encontrar música nueva.

## Funcionalidades por fase

### Fase 1 — Fundación

Estructura técnica, sin funcionalidad de usuario.

### Fase 2 — Autenticación y usuarios

Registro por email, login/logout, recuperación de contraseña, perfil, privacidad, sesiones revocables, borrado de cuenta y conexión Spotify.

### Fase 3 — Cuestionario musical

Preguntas de personalidad, emociones, géneros, décadas, instrumentos, energía, letras y hábitos. Tipos: única, múltiple, escala, dos opciones, tarjetas visuales y adaptativas. Barra de progreso, navegación, validación y guardado de progreso.

### Fase 4 — Algoritmo MusicDNA

Afinidades por género, década, instrumentos, energía y emociones; personalidad musical con nombre, descripción y puntuaciones normalizadas.

### Fase 5 — Web

Landing, cuestionario, dashboard, resultados visuales y recomendaciones.

### Fase 6 — Móvil

Android e iOS con Expo, NativeWind y almacenamiento seguro.

### Fase 7 — Integraciones y social

Spotify OAuth, buscador y enlaces externos; comparador de perfiles; compartir resultados; historial.

### Fase 8 — Calidad y lanzamiento

Vitest, Supertest, Playwright, React Native Testing Library; seguridad; CI/CD y despliegue.

## Fuera del alcance inicial

- Inteligencia artificial sin justificación.
- Dependencia de Spotify para el test o el algoritmo.
- Uso de datos de escucha para elaborar perfiles sin verificar políticas de Spotify.
- Docker.
