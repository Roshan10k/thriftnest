import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      _res.status(400).json({ success: false, message: messages, code: 'VALIDATION_ERROR' });
      return;
    }
    req[source] = result.data;
    next();
  };
}
