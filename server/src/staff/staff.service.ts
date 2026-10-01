import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { conflict, forbidden, notFound } from '../common/http/errors';
import type { Office, StaffMember, StaffRole, StaffStatus } from '../generated/prisma/client';
import { PrismaService, isUniqueViolation } from '../database/prisma.service';
import { OutboxService } from '../notifications/outbox.service';
import { staffInvitation, staffPasswordReset } from '../notifications/templates';
import { PRIVILEGED_ROLES, ROLE_LABELS } from './permissions';
import { SessionsService, type StaffPrincipal } from './sessions.service';
import { StaffAuthService, type IssuedLink } from './staff-auth.service';
import { actorOf } from './staff.guard';

const INVITATION_DAYS = 7;
const ADMIN_RESET_HOURS = 24;

export interface InviteInput {
  email: string;
  name: string;
  title?: string;
  roles: StaffRole[];
  offices: Office[];
}

export interface UpdateStaffInput {
  name?: string;
  title?: string | null;
  roles?: StaffRole[];
  offices?: Office[];
  status?: Extract<StaffStatus, 'ACTIVE' | 'SUSPENDED'>;
}

function present(member: StaffMember) {
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    title: member.title,
    roles: member.roles,
    roleLabels: member.roles.map((role) => ROLE_LABELS[role]),
    offices: member.offices,
    status: member.status,
    lastSignInAt: member.lastSignInAt,
    lockedUntil: member.lockedUntil && member.lockedUntil > new Date() ? member.lockedUntil : null,
    createdAt: member.createdAt,
  };
}

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    private readonly sessions: SessionsService,
    private readonly auth: StaffAuthService,
  ) {}

  async list() {
    const members = await this.prisma.staffMember.findMany({ orderBy: [{ status: 'asc' }, { name: 'asc' }] });
    return members.map(present);
  }

  /** Lightweight list for "assign to" menus. */
  async directory() {
    return this.prisma.staffMember.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, offices: true },
    });
  }

  async invite(actor: StaffPrincipal, input: InviteInput): Promise<{ member: ReturnType<typeof present>; link: IssuedLink; emailQueued: boolean }> {
    this.assertMayGrant(actor, input.roles);
    let member: StaffMember;
    try {
      member = await this.prisma.staffMember.create({
        data: {
          email: input.email,
          name: input.name,
          title: input.title ?? null,
          roles: input.roles,
          offices: input.offices,
          status: 'INVITED',
        },
      });
    } catch (error) {
      if (isUniqueViolation(error, 'email')) {
        throw conflict('Someone with that email address is already on the team.', 'email_taken');
      }
      throw error;
    }

    const link = await this.auth.issueLink(member.id, 'INVITATION', INVITATION_DAYS * 24 * 60, actor.id);
    const emailId = await this.outbox.enqueue({
      template: 'staff.invitation',
      to: member.email,
      toName: member.name,
      parts: staffInvitation({
        name: member.name,
        invitedBy: actor.name,
        roles: member.roles.map((r) => ROLE_LABELS[r]).join(', '),
        url: link.url,
        expiresAt: link.expiresAt,
      }),
      related: { type: 'staff', id: member.id },
    });
    await this.audit.record({
      actor: actorOf(actor),
      action: 'staff.invited',
      entityType: 'staff',
      entityId: member.id,
      summary: `${actor.name} invited ${member.name} (${member.email}) as ${member.roles.map((r) => ROLE_LABELS[r]).join(', ')}.`,
    });
    this.outbox.deliverInBackground([emailId]);
    return { member: present(member), link, emailQueued: this.outbox.deliveryConfigured };
  }

  async update(actor: StaffPrincipal, id: string, input: UpdateStaffInput) {
    const member = await this.prisma.staffMember.findUnique({ where: { id } });
    if (!member) {
      throw notFound('That staff member no longer exists.');
    }
    const self = member.id === actor.id;

    if (self && (input.roles || input.status)) {
      throw forbidden('You cannot change your own roles or status. Ask another administrator.', 'self_change');
    }
    if (input.roles) {
      const removed = member.roles.filter((role) => !input.roles!.includes(role));
      const added = input.roles.filter((role) => !member.roles.includes(role));
      this.assertMayGrant(actor, [...added, ...removed]);
    }
    if (member.roles.some((role) => PRIVILEGED_ROLES.includes(role)) && !actor.roles.includes('OWNER')) {
      throw forbidden('Only an owner can change an administrator or owner account.', 'owner_required');
    }

    const losesOwner =
      member.roles.includes('OWNER') &&
      ((input.roles && !input.roles.includes('OWNER')) || input.status === 'SUSPENDED');
    if (losesOwner) {
      const otherOwners = await this.prisma.staffMember.count({
        where: { id: { not: member.id }, status: 'ACTIVE', roles: { has: 'OWNER' } },
      });
      if (otherOwners === 0) {
        throw conflict('The console must always have at least one active owner.', 'last_owner');
      }
    }

    const updated = await this.prisma.staffMember.update({
      where: { id },
      data: {
        name: input.name,
        title: input.title,
        roles: input.roles,
        offices: input.offices,
        status: input.status,
        ...(input.status === 'ACTIVE' ? { lockedUntil: null, failedSignIns: 0 } : {}),
      },
    });
    // Permissions are read fresh on every request, so role changes apply at
    // once; suspension additionally ends every open session.
    if (input.status === 'SUSPENDED') {
      await this.sessions.revokeAll(id);
    }

    const changes: string[] = [];
    if (input.roles) changes.push(`roles → ${input.roles.map((r) => ROLE_LABELS[r]).join(', ')}`);
    if (input.offices) changes.push(`offices → ${input.offices.join(', ') || 'none'}`);
    if (input.status) changes.push(`status → ${input.status.toLowerCase()}`);
    if (input.name && input.name !== member.name) changes.push(`name → ${input.name}`);
    if (input.title !== undefined && input.title !== member.title) changes.push(`title → ${input.title ?? 'none'}`);
    await this.audit.record({
      actor: actorOf(actor),
      action: input.status === 'SUSPENDED' ? 'staff.suspended' : 'staff.updated',
      entityType: 'staff',
      entityId: id,
      summary: `${actor.name} updated ${member.name}: ${changes.join('; ') || 'no changes'}.`,
    });
    return present(updated);
  }

  /** A fresh invitation (for people who never joined) or a reset link (for everyone else). */
  async issueAccessLink(actor: StaffPrincipal, id: string): Promise<{ link: IssuedLink; kind: 'invitation' | 'reset'; emailQueued: boolean }> {
    const member = await this.prisma.staffMember.findUnique({ where: { id } });
    if (!member) {
      throw notFound('That staff member no longer exists.');
    }
    if (member.status === 'SUSPENDED') {
      throw conflict('Reactivate this account before sending it a sign-in link.', 'account_suspended');
    }
    if (member.roles.some((role) => PRIVILEGED_ROLES.includes(role)) && !actor.roles.includes('OWNER') && member.id !== actor.id) {
      throw forbidden('Only an owner can issue links for administrator accounts.', 'owner_required');
    }

    const invitation = member.status === 'INVITED';
    const link = invitation
      ? await this.auth.issueLink(member.id, 'INVITATION', INVITATION_DAYS * 24 * 60, actor.id)
      : await this.auth.issueLink(member.id, 'PASSWORD_RESET', ADMIN_RESET_HOURS * 60, actor.id);
    const parts = invitation
      ? staffInvitation({
          name: member.name,
          invitedBy: actor.name,
          roles: member.roles.map((r) => ROLE_LABELS[r]).join(', '),
          url: link.url,
          expiresAt: link.expiresAt,
        })
      : staffPasswordReset({ name: member.name, url: link.url, expiresAt: link.expiresAt });
    const emailId = await this.outbox.enqueue({
      template: invitation ? 'staff.invitation' : 'staff.password_reset',
      to: member.email,
      toName: member.name,
      parts,
      related: { type: 'staff', id: member.id },
    });
    await this.audit.record({
      actor: actorOf(actor),
      action: invitation ? 'staff.invitation_reissued' : 'staff.reset_link_issued',
      entityType: 'staff',
      entityId: member.id,
      summary: invitation
        ? `${actor.name} sent ${member.name} a new invitation.`
        : `${actor.name} issued ${member.name} a password reset link.`,
    });
    this.outbox.deliverInBackground([emailId]);
    return { link, kind: invitation ? 'invitation' : 'reset', emailQueued: this.outbox.deliveryConfigured };
  }

  private assertMayGrant(actor: StaffPrincipal, roles: readonly StaffRole[]): void {
    if (roles.some((role) => PRIVILEGED_ROLES.includes(role)) && !actor.roles.includes('OWNER')) {
      throw forbidden('Only an owner can grant or remove the Owner and Administrator roles.', 'owner_required');
    }
  }
}
