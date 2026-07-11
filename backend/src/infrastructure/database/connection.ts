import mongoose from 'mongoose';

export async function connectDatabase(uri: string): Promise<void> {
  mongoose.connection.on('connected', () => console.log('[MongoDB] Connected'));
  mongoose.connection.on('error', (err) => console.error('[MongoDB] Error:', err));
  mongoose.connection.on('disconnected', () => console.log('[MongoDB] Disconnected'));

  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
