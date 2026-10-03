import { Module } from '@nestjs/common';
import { AdminMediaController, PublicMediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  providers: [MediaService],
  controllers: [AdminMediaController, PublicMediaController],
})
export class MediaModule {}
