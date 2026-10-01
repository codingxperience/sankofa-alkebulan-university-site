import { Global, Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { StaffAuthController } from './staff-auth.controller';
import { StaffAuthService } from './staff-auth.service';
import { StaffController } from './staff.controller';
import { StaffGuard } from './staff.guard';
import { StaffService } from './staff.service';

/** Global so every admin controller can use `@StaffOnly()` without importing this module. */
@Global()
@Module({
  providers: [SessionsService, StaffAuthService, StaffService, StaffGuard],
  controllers: [StaffAuthController, StaffController],
  exports: [SessionsService, StaffAuthService, StaffGuard],
})
export class StaffModule {}
