import { Module } from '@nestjs/common';
import { AdmissionsModule } from './admissions/admissions.module';
import { AudienceModule } from './audience/audience.module';
import { AuditModule } from './audit/audit.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { HealthController } from './health/health.controller';
import { InquiriesModule } from './inquiries/inquiries.module';
import { JournalModule } from './journal/journal.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MaintenanceController } from './operations/maintenance.controller';
import { OverviewModule } from './overview/overview.module';
import { SecurityModule } from './security/security.module';
import { SettingsModule } from './settings/settings.module';
import { StaffModule } from './staff/staff.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    // Infrastructure, shared by everything below.
    ConfigModule,
    DatabaseModule,
    SecurityModule,
    AuditModule,
    NotificationsModule,
    StaffModule,
    AudienceModule,
    SettingsModule,
    // What the university does.
    InquiriesModule,
    AdmissionsModule,
    EventsModule,
    StoreModule,
    JournalModule,
    MediaModule,
    OverviewModule,
  ],
  controllers: [HealthController, MaintenanceController],
})
export class AppModule {}
