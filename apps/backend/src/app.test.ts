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
});
