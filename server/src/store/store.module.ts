import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { FlutterwaveClient } from './flutterwave.client';
import { StoreAdminService } from './store-admin.service';
import { AdminStoreController, PublicStoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  imports: [SettingsModule],
  providers: [StoreService, StoreAdminService, FlutterwaveClient],
  controllers: [PublicStoreController, AdminStoreController],
})
export class StoreModule {}
