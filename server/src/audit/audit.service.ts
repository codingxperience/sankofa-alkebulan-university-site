import { Injectable } from '@nestjs/common';
import { currentRequestContext } from '../common/request-context';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface Actor {
  readonly id: string | null;
  readonly label: string;
}

export const SYSTEM_ACTOR: Actor = { id: null, label: 'System' };
export const PUBLIC_ACTOR: Actor = { id: null, label: 'Website visitor' };

export interface AuditEntry {
  readonly actor: Actor;
  /** Past tense, dotted: `inquiry.status_changed`, `staff.signed_in`. */
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string | null;
  /** One sentence a person can read in the activity log. */
  readonly summary: string;
  readonly metadata?: Prisma.InputJsonValue;
}

type Db = Pick<PrismaService, 'auditEvent'> | Prisma.TransactionClient;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an entry. Pass the transaction client when the change being
   * audited happens in a transaction, so both are committed or neither is.
   */
  async record(entry: AuditEntry, db: Db = this.prisma): Promise<void> {
    await db.auditEvent.create({
      data: {
        actorId: entry.actor.id,
        actorLabel: entry.actor.label,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        metadata: entry.metadata,
        ipAddress: currentRequestContext()?.ip,
      },
    });
  }
}
