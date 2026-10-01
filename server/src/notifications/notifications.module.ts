import { Global, Module } from '@nestjs/common';
import { Mailer } from './mailer';
import { OutboxService } from './outbox.service';

@Global()
@Module({
  providers: [Mailer, OutboxService],
  exports: [OutboxService],
})
export class NotificationsModule {}
