import { signUpSchema, updateUserSchema } from '@musicdna/shared';
import { describe, expect, it } from 'vitest';

describe('esquemas de autenticación compartidos', () => {
  it('acepta un registro válido y normaliza el email', () => {
    const result = signUpSchema.parse({
      name: 'Ana',
      email: '  ANA@Example.COM ',
      password: 'contraseña-segura-123',
    });

    expect(result.email).toBe('ana@example.com');
  });

  it('rechaza emails inválidos y contraseñas cortas', () => {
    expect(
      signUpSchema.safeParse({ name: 'Ana', email: 'no-email', password: 'corta' }).success,
    ).toBe(false);
  });

  it('exige al menos un campo al actualizar el perfil', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
    expect(updateUserSchema.safeParse({ bio: 'Me encanta el indie' }).success).toBe(true);
  });
});
