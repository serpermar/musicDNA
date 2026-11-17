export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message = 'Datos inválidos', details?: unknown) =>
  new HttpError(message, 400, 'VALIDATION_ERROR', details);

export const unauthorized = (message = 'No autenticado') =>
  new HttpError(message, 401, 'UNAUTHORIZED');

export const notFound = (message = 'Recurso no encontrado') =>
  new HttpError(message, 404, 'NOT_FOUND');

export const forbidden = (message = 'Sin permisos para acceder a este recurso') =>
  new HttpError(message, 403, 'FORBIDDEN');
