import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  type: 'audio' | 'video';
  uploadedAt: Date;
  metadata?: {
    duration?: number;
    bitrate?: number;
    resolution?: string;
  };
}

@Injectable()
export class MediaService {
  private mediaFiles: MediaFile[] = [];
  private readonly uploadDir = './uploads/media';

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<MediaFile> {
    const id = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${id}${extension}`;

    // Move file to permanent location
    const filePath = path.join(this.uploadDir, filename);
    await fs.rename(file.path, filePath);

    const mediaFile: MediaFile = {
      id,
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/media/${filename}`,
      type: file.mimetype.startsWith('audio/') ? 'audio' : 'video',
      uploadedAt: new Date(),
    };

    this.mediaFiles.push(mediaFile);
    return mediaFile;
  }

  findAll(): MediaFile[] {
    return this.mediaFiles;
  }

  findById(id: string): MediaFile | undefined {
    return this.mediaFiles.find(file => file.id === id);
  }

  findByType(type: 'audio' | 'video'): MediaFile[] {
    return this.mediaFiles.filter(file => file.type === type);
  }

  async deleteFile(id: string): Promise<boolean> {
    const index = this.mediaFiles.findIndex(file => file.id === id);
    if (index === -1) return false;

    const file = this.mediaFiles[index];
    try {
      await fs.unlink(path.join(this.uploadDir, file.filename));
      this.mediaFiles.splice(index, 1);
      return true;
    } catch {
      return false;
    }
  }

  getStats() {
    const audioCount = this.mediaFiles.filter(f => f.type === 'audio').length;
    const videoCount = this.mediaFiles.filter(f => f.type === 'video').length;
    const totalSize = this.mediaFiles.reduce((sum, f) => sum + f.size, 0);

    return {
      total: this.mediaFiles.length,
      audio: audioCount,
      video: videoCount,
      totalSize,
    };
  }
}