import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { AdmissionsAdminController } from './admissions-admin.controller';
import { AdmissionsAdminService } from './admissions-admin.service';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';

@Module({
  imports: [SettingsModule],
  providers: [AdmissionsService, AdmissionsAdminService],
  controllers: [AdmissionsController, AdmissionsAdminController],
})
export class AdmissionsModule {}
