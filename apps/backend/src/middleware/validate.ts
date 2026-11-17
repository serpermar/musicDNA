import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/** Valida req.body con un esquema Zod compartido y sustituye el cuerpo por el resultado. */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Valida parámetros de la URL con un esquema Zod. */
export function validateParams<T extends Record<string, string>>(
  schema: ZodType<T>,
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.params = result.data;
    next();
  };
}
