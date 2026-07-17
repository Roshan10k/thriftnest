import type { Request, Response, NextFunction } from 'express';

/**
 * NoSQL-injection defence.
 *
 * MongoDB query operators are objects whose keys begin with `$` (e.g. `$ne`,
 * `$gt`, `$where`). If untrusted input like `{ "email": { "$ne": null } }` reaches
 * a query object, an attacker can subvert its logic (classic auth-bypass:
 * "find a user whose email is not null"). Dotted keys (`a.b`) can likewise reach
 * into nested paths.
 *
 * This middleware recursively strips any key that starts with `$` or contains a
 * `.` from req.body / req.query / req.params, mutating them in place. It is a
 * second layer behind Zod DTO validation (which already rejects a non-string
 * where a string is expected) — defence in depth, and it also covers query
 * parameters that aren't individually schema-validated.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !(value instanceof Date);
}

function stripOperators(input: unknown): void {
  if (!isPlainObject(input)) return;
  if (Array.isArray(input)) {
    input.forEach(stripOperators);
    return;
  }
  for (const key of Object.keys(input)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete input[key];
    } else {
      stripOperators(input[key]);
    }
  }
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
  stripOperators(req.body);
  stripOperators(req.query);
  stripOperators(req.params);
  next();
}
