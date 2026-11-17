import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error';

function isPrismaError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (isPrismaError(error, 'P2002')) {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'El recurso ya existe' },
    });
    return;
  }

  if (isPrismaError(error, 'P2025')) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' },
    });
    return;
  }

  console.error('[backend] Error no controlado:', error);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
  });
};

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado' },
  });
};
