import multer from 'multer';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';

export interface UploadedFile {
  id: string;
  userId: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
  uploadedAt: Date;
  category?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    thumbnail?: string;
    tags?: string[];
  };
}

export interface UploadConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  storageProvider: 'local' | 'aws' | 'cloudinary';
  uploadPath: string;
  generateThumbnails: boolean;
  compressImages: boolean;
}

export class FileUploadService {
  private static instance: FileUploadService;
  private config: UploadConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    storageProvider: 'local',
    uploadPath: './uploads',
    generateThumbnails: true,
    compressImages: true
  };

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Configure multer for file uploads
   */
  public getMulterConfig() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.config.uploadPath)) {
      fs.mkdirSync(this.config.uploadPath, { recursive: true });
    }

    const storageConfig = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.config.uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${nanoid()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (this.config.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`));
      }
    };

    return multer({
      storage: storageConfig,
      fileFilter: fileFilter,
      limits: {
        fileSize: this.config.maxFileSize,
        files: 10 // Maximum 10 files per request
      }
    });
  }

  /**
   * Upload single file
   */
  public async uploadFile(file: Express.Multer.File, userId: string, category?: string): Promise<UploadedFile> {
    try {
      // Validate file
      this.validateFile(file);

      // Process file based on type
      const processedFile = await this.processFile(file);

      // Save file metadata to database
      const uploadedFile: UploadedFile = {
        id: nanoid(),
        userId,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: this.generateFileUrl(file.filename),
        path: file.path,
        uploadedAt: new Date(),
        category: category || 'general',
        metadata: processedFile.metadata
      };

      await storage.createUploadedFile(uploadedFile);

      return uploadedFile;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  public async uploadFiles(files: Express.Multer.File[], userId: string, category?: string): Promise<UploadedFile[]> {
    try {
      const uploadedFiles: UploadedFile[] = [];

      for (const file of files) {
        const uploadedFile = await this.uploadFile(file, userId, category);
        uploadedFiles.push(uploadedFile);
      }

      return uploadedFiles;
    } catch (error) {
      console.error('Multiple file upload error:', error);
      throw new Error('Failed to upload files');
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size ${file.size} exceeds maximum allowed size ${this.config.maxFileSize}`);
    }

    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }
  }

  /**
   * Process file based on type
   */
  private async processFile(file: Express.Multer.File): Promise<{ metadata?: any }> {
    let metadata: any = {};

    if (file.mimetype.startsWith('image/')) {
      metadata = await this.processImage(file);
    } else if (file.mimetype.startsWith('video/')) {
      metadata = await this.processVideo(file);
    } else if (file.mimetype.startsWith('audio/')) {
      metadata = await this.processAudio(file);
    }

    return { metadata };
  }

  /**
   * Process image file
   */
  private async processImage(file: Express.Multer.File): Promise<any> {
    try {
      // Prefer Cloudinary on-the-fly transformations if configured
      const useCloudinary = this.config.storageProvider === 'cloudinary' || !!process.env.CLOUDINARY_CLOUD_NAME;
      if (useCloudinary) {
        const cloud = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
        const publicId = path.parse(file.filename).name;
        // Construct transformation URLs (resize + quality auto)
        const optimizedUrl = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1600/${publicId}.jpg`;
        const thumbnailUrl = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_400/${publicId}.jpg`;
        return {
          width: 1600,
          height: 0,
          optimized: optimizedUrl,
          thumbnail: thumbnailUrl,
        };
      }

      // Fallback: no-op but return a thumbnail URL placeholder
      const metadata = {
        width: 0,
        height: 0,
        thumbnail: this.generateThumbnailUrl(file.filename)
      };
      return metadata;
    } catch (error) {
      console.error('Image processing error:', error);
      return {};
    }
  }

  /**
   * Process video file
   */
  private async processVideo(file: Express.Multer.File): Promise<any> {
    try {
      // In production, you would use ffmpeg or similar
      // For now, we'll simulate video processing
      const metadata = {
        duration: 120, // seconds
        width: 1920,
        height: 1080,
        thumbnail: this.generateThumbnailUrl(file.filename)
      };

      // Simulate video thumbnail generation
      console.log(`Generating video thumbnail for: ${file.filename}`);

      return metadata;
    } catch (error) {
      console.error('Video processing error:', error);
      return {};
    }
  }

  /**
   * Process audio file
   */
  private async processAudio(file: Express.Multer.File): Promise<any> {
    try {
      // In production, you would use audio processing libraries
      // For now, we'll simulate audio processing
      const metadata = {
        duration: 180, // seconds
        bitrate: 320,
        sampleRate: 44100
      };

      return metadata;
    } catch (error) {
      console.error('Audio processing error:', error);
      return {};
    }
  }

  /**
   * Generate file URL
   */
  private generateFileUrl(filename: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${filename}`;
  }

  /**
   * Generate thumbnail URL
   */
  private generateThumbnailUrl(filename: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const nameWithoutExt = path.parse(filename).name;
    return `${baseUrl}/uploads/thumbnails/${nameWithoutExt}-thumb.jpg`;
  }

  /**
   * Get uploaded files for user
   */
  public async getUserFiles(userId: string, options?: {
    limit?: number;
    offset?: number;
    category?: string;
    mimetype?: string;
  }): Promise<{ files: UploadedFile[]; total: number }> {
    try {
      return await storage.getUserFiles(userId, options);
    } catch (error) {
      console.error('Error fetching user files:', error);
      throw new Error('Failed to fetch user files');
    }
  }

  /**
   * Get file by ID
   */
  public async getFileById(fileId: string, userId: string): Promise<UploadedFile | null> {
    try {
      const file = await storage.getFileById(fileId);
      
      if (!file || file.userId !== userId) {
        return null;
      }

      return file;
    } catch (error) {
      console.error('Error fetching file:', error);
      throw new Error('Failed to fetch file');
    }
  }

  /**
   * Delete file
   */
  public async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const file = await storage.getFileById(fileId);
      
      if (!file || file.userId !== userId) {
        throw new Error('File not found or access denied');
      }

      // Delete physical file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Delete from database
      await storage.deleteFile(fileId);

      console.log(`Deleted file: ${fileId}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Update file metadata
   */
  public async updateFileMetadata(fileId: string, userId: string, metadata: any): Promise<UploadedFile> {
    try {
      const file = await storage.getFileById(fileId);
      
      if (!file || file.userId !== userId) {
        throw new Error('File not found or access denied');
      }

      const updatedFile = await storage.updateFileMetadata(fileId, metadata);
      return updatedFile;
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw new Error('Failed to update file metadata');
    }
  }

  /**
   * Search files
   */
  public async searchFiles(userId: string, query: string): Promise<UploadedFile[]> {
    try {
      return await storage.searchFiles(userId, query);
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error('Failed to search files');
    }
  }

  /**
   * Get file statistics
   */
  public async getFileStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    recentUploads: number;
  }> {
    try {
      const files = await storage.getUserFiles(userId);
      
      const stats = {
        totalFiles: files.files.length,
        totalSize: 0,
        fileTypes: {} as Record<string, number>,
        recentUploads: 0
      };

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      files.files.forEach(file => {
        stats.totalSize += file.size;
        
        const fileType = file.mimetype.split('/')[0];
        stats.fileTypes[fileType] = (stats.fileTypes[fileType] || 0) + 1;
        
        if (file.uploadedAt > oneWeekAgo) {
          stats.recentUploads++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting file stats:', error);
      throw new Error('Failed to get file statistics');
    }
  }

  /**
   * Upload to cloud storage (AWS S3)
   */
  public async uploadToCloud(file: Express.Multer.File, userId: string): Promise<UploadedFile> {
    try {
      if (this.config.storageProvider === 'aws') {
        return await this.uploadToS3(file, userId);
      } else if (this.config.storageProvider === 'cloudinary') {
        return await this.uploadToCloudinary(file, userId);
      } else {
        return await this.uploadFile(file, userId);
      }
    } catch (error) {
      console.error('Cloud upload error:', error);
      throw new Error('Failed to upload to cloud storage');
    }
  }

  /**
   * Upload to AWS S3
   */
  private async uploadToS3(file: Express.Multer.File, userId: string): Promise<UploadedFile> {
    try {
      // In production, you would use AWS SDK
      // For now, we'll simulate S3 upload
      console.log(`Simulating S3 upload for: ${file.filename}`);
      
      const uploadedFile: UploadedFile = {
        id: nanoid(),
        userId,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: `https://s3.amazonaws.com/bucket/${file.filename}`,
        path: `s3://bucket/${file.filename}`,
        uploadedAt: new Date()
      };

      await storage.createUploadedFile(uploadedFile);
      return uploadedFile;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  /**
   * Upload to Cloudinary
   */
  private async uploadToCloudinary(file: Express.Multer.File, userId: string): Promise<UploadedFile> {
    try {
      // In production, you would use Cloudinary SDK
      // For now, we'll simulate Cloudinary upload
      console.log(`Simulating Cloudinary upload for: ${file.filename}`);
      
      const uploadedFile: UploadedFile = {
        id: nanoid(),
        userId,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: `https://res.cloudinary.com/cloud/image/upload/${file.filename}`,
        path: `cloudinary://cloud/${file.filename}`,
        uploadedAt: new Date()
      };

      await storage.createUploadedFile(uploadedFile);
      return uploadedFile;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Configure upload settings
   */
  public configure(config: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get upload configuration
   */
  public getConfig(): UploadConfig {
    return { ...this.config };
  }
} 