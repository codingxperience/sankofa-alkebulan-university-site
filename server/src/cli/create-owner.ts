import 'reflect-metadata';
import { parseArgs } from 'node:util';
import { NestFactory } from '@nestjs/core';
import { z } from 'zod';
import { AppModule } from '../app.module';
import { logger } from '../common/logger';
import { PrismaService } from '../database/prisma.service';
import { AuditService, SYSTEM_ACTOR } from '../audit/audit.service';
import { StaffAuthService } from '../staff/staff-auth.service';

/**
 * Creates an owner account from the command line and prints a one-time link
 * for choosing a password. Useful when the console is set up from a laptop
 * with database access, or to recover access if every owner is locked out.
 *
 *   npm run staff:create-owner -- --email founder@example.org --name "Full Name"
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { email: { type: 'string' }, name: { type: 'string' } },
  });
  const email = z.email().safeParse(values.email?.trim().toLowerCase());
  const name = values.name?.trim().replace(/\s+/g, ' ');
  if (!email.success || !name || name.length < 2) {
    process.stderr.write('Usage: npm run staff:create-owner -- --email person@example.org --name "Full Name"\n');
    process.exit(2);
  }

  logger.setLevel('warn');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const prisma = app.get(PrismaService);
    const auth = app.get(StaffAuthService);
    const audit = app.get(AuditService);

    const existing = await prisma.staffMember.findUnique({ where: { email: email.data } });
    let staffId: string;
    let purpose: 'INVITATION' | 'PASSWORD_RESET';
    if (existing) {
      const roles = existing.roles.includes('OWNER') ? existing.roles : [...existing.roles, 'OWNER' as const];
      await prisma.staffMember.update({
        where: { id: existing.id },
        data: { roles, lockedUntil: null, failedSignIns: 0, ...(existing.status === 'SUSPENDED' ? { status: 'ACTIVE' } : {}) },
      });
      staffId = existing.id;
      purpose = existing.status === 'INVITED' ? 'INVITATION' : 'PASSWORD_RESET';
    } else {
      const created = await prisma.staffMember.create({
        data: { email: email.data, name, roles: ['OWNER'], offices: [], status: 'INVITED' },
      });
      staffId = created.id;
      purpose = 'INVITATION';
    }

    const link = await auth.issueLink(staffId, purpose, 24 * 60, null);
    await audit.record({
      actor: SYSTEM_ACTOR,
      action: 'staff.owner_provisioned',
      entityType: 'staff',
      entityId: staffId,
      summary: `An owner account for ${email.data} was provisioned from the command line.`,
    });

    process.stdout.write(
      `\nOwner account ready for ${email.data}.\n` +
        `Open this link within 24 hours to choose a password (it works once):\n\n  ${link.url}\n\n`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
