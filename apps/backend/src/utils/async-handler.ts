import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Envuelve handlers asíncronos para que los errores lleguen al middleware de errores. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}
