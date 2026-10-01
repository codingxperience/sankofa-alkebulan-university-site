import { Module } from '@nestjs/common';
import { AdminJournalController, PublicJournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  providers: [JournalService],
  controllers: [PublicJournalController, AdminJournalController],
})
export class JournalModule {}
