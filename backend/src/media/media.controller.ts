import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService, MediaFile } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('media')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<MediaFile> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      return await this.mediaService.saveFile(file);
    } catch (error) {
      throw new BadRequestException('Failed to save file');
    }
  }

  @Get()
  getAllMedia(): MediaFile[] {
    return this.mediaService.findAll();
  }

  @Get('audio')
  getAudioFiles(): MediaFile[] {
    return this.mediaService.findByType('audio');
  }

  @Get('video')
  getVideoFiles(): MediaFile[] {
    return this.mediaService.findByType('video');
  }

  @Get(':id')
  getMediaById(@Param('id') id: string): MediaFile {
    const file = this.mediaService.findById(id);
    if (!file) {
      throw new NotFoundException('Media file not found');
    }
    return file;
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.mediaService.deleteFile(id);
    if (!success) {
      throw new NotFoundException('Media file not found or could not be deleted');
    }
    return { success: true };
  }

  @Get('stats/summary')
  getMediaStats() {
    return this.mediaService.getStats();
  }
}
