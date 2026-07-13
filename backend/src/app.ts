import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';

import { globalRateLimit } from './presentation/middleware/rateLimit';
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

// Security headers
app.use(helmet());

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

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use(globalRateLimit);

// Trust proxy (for correct IP behind reverse proxy)
app.set('trust proxy', 1);

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
