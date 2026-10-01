import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { z } from 'zod';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { AuditService } from '../audit/audit.service';
import { validate } from '../common/http/zod.pipe';
import { line } from '../common/validation/fields';
import { Office } from '../generated/prisma/client';
import { OutboxService } from '../notifications/outbox.service';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly, actorOf } from '../staff/staff.guard';
import { OfficeRoutesService } from './office-routes.service';

const OfficeBody = z.object({
  label: line('Office name', 80, 2),
  responseTarget: line('Reply time', 40, 2),
  notifyEmails: z
    .array(z.string().trim().toLowerCase().pipe(z.email('Each address must be a valid email.')))
    .min(1, 'Add at least one address to notify.')
    .max(10, 'Notify at most ten addresses.')
    .transform((list) => [...new Set(list)]),
});

const OfficeParam = z.enum(Office);

@Controller('admin/settings')
export class SettingsController {
  constructor(
    private readonly offices: OfficeRoutesService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  @Get('offices')
  @StaffOnly()
  listOffices() {
    return this.offices.all();
  }

  @Put('offices/:office')
  @StaffOnly('settings.manage')
  async updateOffice(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('office', validate(OfficeParam)) office: Office,
    @Body(validate(OfficeBody)) body: z.infer<typeof OfficeBody>,
  ) {
    const updated = await this.offices.update(office, body, staff.id);
    await this.audit.record({
      actor: actorOf(staff),
      action: 'settings.office_updated',
      entityType: 'office',
      entityId: office,
      summary: `${staff.name} updated ${updated.label}: notifies ${updated.notifyEmails.join(', ')}; replies within ${updated.responseTarget}.`,
    });
    return updated;
  }

  /**
   * What is switched on, and what is waiting. Shows whether integrations are
   * configured without ever revealing their keys.
   */
  @Get('system')
  @StaffOnly('overview.read')
  async system() {
    const email = await this.outbox.stats();
    return {
      siteUrl: this.config.siteUrl,
      email: {
        configured: this.outbox.deliveryConfigured,
        from: this.config.email.from ?? null,
        replyTo: this.config.email.replyTo,
        ...email,
      },
      payments: {
        flutterwave: Boolean(this.config.payments.flutterwaveSecretKey),
      },
      maintenance: {
        scheduled: Boolean(this.config.cronSecret),
      },
    };
  }
}
