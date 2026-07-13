import 'dotenv/config';
import app from './app';
import { connectDatabase } from './infrastructure/database/connection';

const PORT = Number(process.env.PORT ?? 5000);

async function bootstrap() {
  try {
    await connectDatabase(process.env.MONGODB_URI!);
    app.listen(PORT, () => {
      console.log(`[Server] ThriftNest API running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

bootstrap();
