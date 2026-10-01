import { Module } from '@nestjs/common';
import { AdminEventsController, PublicEventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  providers: [EventsService],
  controllers: [PublicEventsController, AdminEventsController],
})
export class EventsModule {}
