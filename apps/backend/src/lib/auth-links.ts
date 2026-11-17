import { env } from '../config/env';

type AuthLinkKind = 'verify-email' | 'reset-password';

/**
 * Entrega de enlaces de autenticación.
 * En desarrollo se imprimen en consola para poder probar el flujo sin proveedor de email.
 * En producción NO se registran URLs ni tokens; se debe conectar un proveedor real.
 */
export function deliverAuthLink(kind: AuthLinkKind, url: string, email: string): void {
  if (env.NODE_ENV === 'production') {
    console.warn(`[auth] Se ha solicitado un enlace de ${kind}. Pendiente de proveedor de email.`);
    return;
  }

  console.info(`[auth][dev] ${kind} para ${email}: ${url}`);
}
