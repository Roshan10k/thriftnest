import { v2 as cloudinary } from 'cloudinary';
import type { IStorageService, UploadResult } from '../../application/interfaces/IStorageService';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function uploadBuffer(buffer: Buffer, folder: string, publicId?: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `thriftnest/${folder}`, public_id: publicId, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    bufferToStream(buffer).pipe(uploadStream);
  });
}

export class CloudinaryStorageService implements IStorageService {
  async upload(fileBuffer: Buffer, folder: string, filename?: string): Promise<UploadResult> {
    return uploadBuffer(fileBuffer, folder, filename);
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async uploadMultiple(files: Buffer[], folder: string): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => uploadBuffer(f, folder)));
  }
}
