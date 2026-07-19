import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';

import { globalRateLimit } from './presentation/middleware/rateLimit';
import { csrfProtection } from './presentation/middleware/csrf';
import { mongoSanitize } from './presentation/middleware/mongoSanitize';
import { errorHandler } from './presentation/middleware/errorHandler';

import authRoutes from './presentation/routes/auth.routes';
import userRoutes from './presentation/routes/user.routes';
import listingRoutes from './presentation/routes/listing.routes';
import orderRoutes from './presentation/routes/order.routes';
import reviewRoutes from './presentation/routes/review.routes';
import messageRoutes from './presentation/routes/message.routes';
import notificationRoutes from './presentation/routes/notification.routes';
import wishlistRoutes from './presentation/routes/wishlist.routes';
import adminRoutes from './presentation/routes/admin.routes';

const app = express();

// Disable ETag on API responses — prevents Express returning 304 with empty body
// which breaks fetch().json() and logs the user out on page reload
app.set('etag', false);

// Serve uploaded images BEFORE Helmet so Cross-Origin-Resource-Policy doesn't block
// cross-origin image loading when frontend (5173) loads images from backend (8000)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Security headers. The Content-Security-Policy is written out explicitly
// (rather than relying on Helmet's defaults) so it is auditable and defensible:
// scripts/objects/frames are locked down, and the policy is documented directly
// here. upgrade-insecure-requests is only emitted in production, where the app
// is served over HTTPS — enabling it in local HTTP dev would break requests.
const cspIsProduction = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"], // clickjacking: no one may frame this app
        frameSrc: ["'none'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'none'"], // no Flash/Java/other plugins
        scriptSrc: ["'self'"], // no inline scripts → blunts reflected/stored XSS
        scriptSrcAttr: ["'none'"], // no inline event handlers (onclick=...)
        styleSrc: ["'self'", "'unsafe-inline'"], // utility-class styles need inline
        connectSrc: ["'self'"],
        ...(cspIsProduction ? { upgradeInsecureRequests: [] } : {}),
      },
    },
  }),
);

// In development, Vite auto-increments its port (5173, 5174, ...) whenever the
// preferred port is already taken by another project, so a single hardcoded
// origin silently breaks CORS. Allow any localhost port in dev; pin to
// CLIENT_URL in production.
const isProduction = process.env.NODE_ENV === 'production';
app.use(
  cors({
    origin: isProduction
      ? (process.env.CLIENT_URL ?? 'http://localhost:5173')
      : /^http:\/\/localhost:\d+$/,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Strip MongoDB query operators ($-prefixed / dotted keys) from all user input
// to prevent NoSQL injection (defence in depth behind Zod validation).
app.use(mongoSanitize);

// Rate limiting
app.use(globalRateLimit);

// CSRF protection (double-submit cookie). Issues a csrfToken cookie on every
// request and requires a matching x-csrf-token header on state-changing methods.
app.use(csrfProtection);

// Trust proxy (for correct IP behind reverse proxy)
app.set('trust proxy', 1);

// Every /api response may carry personal or session-tied data (profiles,
// orders, messages), so none of it should be stored by an intermediary
// caching proxy or the browser's own cache — found via an OWASP ZAP baseline
// scan (see docs/pentest-findings.md, Finding V4). Static assets under
// /uploads are served separately above and are unaffected by this.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Hands the current CSRF token to the SPA so it can echo it back in the header.
app.get('/api/csrf-token', (_req, res) => {
  res.json({ csrfToken: res.locals.csrfToken });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
