import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('hashPassword (Argon2id)', () => {
  it('genera un hash Argon2id distinto del password original', async () => {
    const hash = await hashPassword('musicdna-password');

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('musicdna-password');
  });

  it('verifica contraseñas correctas e incorrectas', async () => {
    const hash = await hashPassword('musicdna-password');

    await expect(verifyPassword({ password: 'musicdna-password', hash })).resolves.toBe(true);
    await expect(verifyPassword({ password: 'otra-contraseña', hash })).resolves.toBe(false);
  });
});
