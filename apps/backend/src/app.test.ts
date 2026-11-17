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
});
