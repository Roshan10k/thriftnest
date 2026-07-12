export interface UploadResult {
  url: string;
  publicId: string;
}

export interface IStorageService {
  upload(fileBuffer: Buffer, folder: string, filename?: string): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
  uploadMultiple(files: Buffer[], folder: string): Promise<UploadResult[]>;
}
