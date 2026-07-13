import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../application/errors/AppError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(400).json({ success: false, message, code: 'VALIDATION_ERROR' });
    return;
  }

  if (err instanceof Error && (err as unknown as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate entry', code: 'DUPLICATE' });
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
}
