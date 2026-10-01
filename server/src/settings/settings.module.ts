import { Module } from '@nestjs/common';
import { OfficeRoutesService } from './office-routes.service';
import { SettingsController } from './settings.controller';

@Module({
  providers: [OfficeRoutesService],
  controllers: [SettingsController],
  exports: [OfficeRoutesService],
})
export class SettingsModule {}
