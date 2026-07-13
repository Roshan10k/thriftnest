import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const authRateLimit = rateLimit({
  windowMs: Number(process.env.AUTH_LOCKOUT_DURATION_MS ?? 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 5),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many failed attempts. Account locked for 15 minutes.', code: 'RATE_LIMITED' },
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Upload limit reached. Try again in an hour.' },
});
