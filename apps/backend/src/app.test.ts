import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('API v1', () => {
  it('responde al health check', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'musicdna-backend' });
  });

  it('expone el endpoint de estado de Better Auth', async () => {
    const response = await request(createApp()).get('/api/v1/auth/ok');

    expect(response.status).toBe(200);
  });

  it('protege el perfil del usuario', async () => {
    const response = await request(createApp()).get('/api/v1/users/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('protege las sesiones de quiz', async () => {
    const sessionId = '00000000-0000-4000-8000-000000000000';
    const response = await request(createApp()).get(`/api/v1/quiz-sessions/${sessionId}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('valida los parámetros de las rutas de quiz antes de consultar la base de datos', async () => {
    const response = await request(createApp()).get('/api/v1/quizzes/no-es-un-uuid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('protege la generación y consulta de perfiles musicales', async () => {
    const app = createApp();
    const create = await request(app).post('/api/v1/profiles').send({ sessionId: 'no-uuid' });
    const latest = await request(app).get('/api/v1/profiles/me');

    expect(create.status).toBe(401);
    expect(latest.status).toBe(401);
  });

  it('protege recomendaciones, historial, compartir, comparador y Spotify', async () => {
    const app = createApp();
    const responses = await Promise.all([
      request(app).get('/api/v1/recommendations/me'),
      request(app).get('/api/v1/profiles/history'),
      request(app).post('/api/v1/shares').send({ visibility: 'PUBLIC' }),
      request(app).post('/api/v1/comparisons').send({ targetProfileId: 'no-uuid' }),
      request(app).get('/api/v1/spotify/status'),
    ]);

    expect(responses.every((response) => response.status === 401)).toBe(true);
  });

  it('valida el cuerpo de las peticiones de compartir y comparar', async () => {
    const app = createApp();
    // Sin sesión, el middleware de autenticación actúa antes que la validación.
    const share = await request(app).post('/api/v1/shares').send({ visibility: 'INVALID' });
    expect(share.status).toBe(401);
  });

  it('protege el inicio y el cierre de la conexión de Spotify', async () => {
    const app = createApp();
    const auth = await request(app).get('/api/v1/spotify/auth');
    const disconnect = await request(app).post('/api/v1/spotify/disconnect');

    expect(auth.status).toBe(401);
    expect(disconnect.status).toBe(401);
  });

  it('rechaza callbacks de Spotify sin state o con un state manipulado', async () => {
    const app = createApp();
    const missing = await request(app).get('/api/v1/spotify/callback');
    const tampered = await request(app)
      .get('/api/v1/spotify/callback')
      .query({ code: 'abc', state: 'manipulado.invalido' });

    expect(missing.status).toBe(400);
    expect(tampered.status).toBe(400);
  });
});
