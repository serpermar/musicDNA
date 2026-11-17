import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('API v1', () => {
  it('responde al health check', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'musicdna-backend' });
  });
});
