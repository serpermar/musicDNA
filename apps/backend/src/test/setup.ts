// Valores temporales solo para tests. Nunca se usan en producción.
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/musicdna_test';
process.env.SESSION_SECRET ??= 'musicdna-test-secret-at-least-32-characters';
process.env.BETTER_AUTH_URL ??= 'http://localhost:4000';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';
