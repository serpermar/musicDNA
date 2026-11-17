import type { Request, Response } from 'express';

export function healthController(_request: Request, response: Response): void {
  response.status(200).json({
    status: 'ok',
    service: 'musicdna-backend',
    version: '0.1.0',
    uptime: process.uptime(),
  });
}
