import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { AdminInquiriesController, PublicInquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';

@Module({
  imports: [SettingsModule],
  providers: [InquiriesService],
  controllers: [PublicInquiriesController, AdminInquiriesController],
})
export class InquiriesModule {}
