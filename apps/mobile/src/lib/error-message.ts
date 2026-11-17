import { ApiError } from '@musicdna/api-client';

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as { error?: { message?: string } } | null;
    return body?.error?.message ?? `Error ${error.status}`;
  }
  return error instanceof Error ? error.message : 'Error inesperado';
}
