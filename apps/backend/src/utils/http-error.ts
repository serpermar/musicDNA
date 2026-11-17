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

export const unauthorized = (message = 'No autenticado') =>
  new HttpError(message, 401, 'UNAUTHORIZED');

export const notFound = (message = 'Recurso no encontrado') =>
  new HttpError(message, 404, 'NOT_FOUND');
