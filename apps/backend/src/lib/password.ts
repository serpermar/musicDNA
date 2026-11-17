import { hash, type Options, verify } from '@node-rs/argon2';

/** Argon2id con parámetros alineados con las recomendaciones de OWASP. */
const options: Options = {
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
  outputLen: 32,
  algorithm: 2, // Argon2id
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, options);
}

export function verifyPassword(data: { password: string; hash: string }): Promise<boolean> {
  return verify(data.hash, data.password, options);
}
