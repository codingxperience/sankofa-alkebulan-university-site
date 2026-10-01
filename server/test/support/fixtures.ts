import { hashPassword } from '../../src/common/crypto/password';
import type { StaffRole } from '../../src/generated/prisma/client';
import type { PrismaService } from '../../src/database/prisma.service';
import { Client, STRONG_PASSWORD } from './harness';

let passwordHash: Promise<string> | undefined;

/** Creates an active staff member and returns a client already signed in as them. */
export async function signedInStaff(prisma: PrismaService, url: string, email: string, roles: StaffRole[]): Promise<Client> {
  passwordHash ??= hashPassword(STRONG_PASSWORD);
  await prisma.staffMember.create({
    data: { email, name: email.split('@')[0], roles, offices: [], status: 'ACTIVE', passwordHash: await passwordHash },
  });
  const client = new Client(url);
  const result = await client.post('/admin/auth/sign-in', { email, password: STRONG_PASSWORD });
  if (result.status !== 200) {
    throw new Error(`Sign-in failed for ${email}: ${JSON.stringify(result.data)}`);
  }
  return client;
}

export async function publishedEvent(prisma: PrismaService, overrides: { slug?: string; capacity?: number | null } = {}) {
  return prisma.event.create({
    data: {
      slug: overrides.slug ?? 'test-symposium',
      title: 'Test Symposium on Knowledge',
      timezone: 'Africa/Kampala',
      startsAt: new Date(Date.now() + 30 * 86_400_000),
      endsAt: new Date(Date.now() + 31 * 86_400_000),
      capacity: overrides.capacity === undefined ? null : overrides.capacity,
      status: 'PUBLISHED',
      options: {
        attendeeCategories: ['Scholar', 'Student'],
        attendanceModes: ['In person', 'Online'],
        days: ['Day one', 'Both days'],
        interests: ['Heritage', 'Language'],
      },
    },
  });
}

export function registration(email: string) {
  return {
    name: 'Test Registrant',
    email,
    attendeeCategory: 'Scholar',
    attendanceMode: 'Online',
    days: 'Both days',
    interests: ['Heritage'],
    wantsUpdates: false,
  };
}
