import fs from 'fs';
import path from 'path';
import type { IStorageService, UploadResult } from '../../application/interfaces/IStorageService';

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveBuffer(buffer: Buffer, folder: string): UploadResult {
  const dir = path.join(UPLOADS_ROOT, folder);
  ensureDir(dir);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  const publicId = `${folder}/${filename}`;
  const baseUrl = process.env.SERVER_URL ?? 'http://localhost:8000';
  return { url: `${baseUrl}/uploads/${publicId}`, publicId };
}

export class LocalStorageService implements IStorageService {
  async upload(fileBuffer: Buffer, folder: string): Promise<UploadResult> {
    return saveBuffer(fileBuffer, folder);
  }

  async delete(publicId: string): Promise<void> {
    const filepath = path.join(UPLOADS_ROOT, publicId);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  async uploadMultiple(files: Buffer[], folder: string): Promise<UploadResult[]> {
    return files.map((f) => saveBuffer(f, folder));
  }
}
