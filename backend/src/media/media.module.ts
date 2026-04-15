import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import * as multer from 'multer';
import * as path from 'path';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      dest: './uploads/media',
      fileFilter: (req, file, callback) => {
        // Allow audio and video files
        if (file.mimetype.match(/\/(mp3|wav|ogg|mp4|avi|mov|webm)$/)) {
          callback(null, true);
        } else {
          callback(new Error('Only audio and video files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
