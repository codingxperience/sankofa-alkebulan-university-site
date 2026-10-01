import { Injectable } from '@nestjs/common';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import type { Office } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { OFFICE_DEFAULTS, OFFICE_ORDER } from '../inquiries/offices';

export interface OfficeRouteView {
  readonly office: Office;
  readonly label: string;
  readonly responseTarget: string;
  readonly notifyEmails: readonly string[];
}

/** Where each office's mail goes. Falls back to the built-in defaults until edited in the console. */
@Injectable()
export class OfficeRoutesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  async all(): Promise<OfficeRouteView[]> {
    const stored = await this.prisma.officeRoute.findMany();
    const byOffice = new Map(stored.map((route) => [route.office, route]));
    return OFFICE_ORDER.map((office) => {
      const route = byOffice.get(office);
      return {
        office,
        label: route?.label ?? OFFICE_DEFAULTS[office].label,
        responseTarget: route?.responseTarget ?? OFFICE_DEFAULTS[office].responseTarget,
        notifyEmails: route?.notifyEmails.length ? route.notifyEmails : this.config.email.staffNotificationEmails,
      };
    });
  }

  async get(office: Office): Promise<OfficeRouteView> {
    const route = await this.prisma.officeRoute.findUnique({ where: { office } });
    return {
      office,
      label: route?.label ?? OFFICE_DEFAULTS[office].label,
      responseTarget: route?.responseTarget ?? OFFICE_DEFAULTS[office].responseTarget,
      notifyEmails: route?.notifyEmails.length ? route.notifyEmails : this.config.email.staffNotificationEmails,
    };
  }

  async update(
    office: Office,
    input: { label: string; responseTarget: string; notifyEmails: string[] },
    updatedById: string,
  ): Promise<OfficeRouteView> {
    await this.prisma.officeRoute.upsert({
      where: { office },
      create: { office, ...input, updatedById },
      update: { ...input, updatedById },
    });
    return this.get(office);
  }
}
