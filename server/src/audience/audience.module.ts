import { Global, Module } from '@nestjs/common';
import { AudienceController, PublicAudienceController } from './audience.controller';
import { SubscribersService } from './subscribers.service';

@Global()
@Module({
  providers: [SubscribersService],
  controllers: [PublicAudienceController, AudienceController],
  exports: [SubscribersService],
})
export class AudienceModule {}
