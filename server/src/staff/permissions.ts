import type { StaffRole } from '../generated/prisma/client';

/**
 * What a staff member may do is decided here and nowhere else. Roles are
 * bundles of permissions; a person can hold several roles, and gets the union.
 */
export const PERMISSIONS = [
  'overview.read',
  'inquiries.read',
  'inquiries.manage',
  'applications.read',
  'applications.manage',
  'events.read',
  'events.manage',
  'store.read',
  'store.manage',
  'journal.read',
  'journal.manage',
  'audience.read',
  'audience.export',
  'staff.read',
  'staff.manage',
  'audit.read',
  'settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const READ_ALL: Permission[] = PERMISSIONS.filter((p) => p.endsWith('.read'));

const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: PERMISSIONS,
  ADMISSIONS: ['overview.read', 'inquiries.read', 'inquiries.manage', 'applications.read', 'applications.manage'],
  COMMUNICATIONS: [
    'overview.read',
    'inquiries.read',
    'inquiries.manage',
    'journal.read',
    'journal.manage',
    'audience.read',
    'audience.export',
  ],
  EVENTS: ['overview.read', 'events.read', 'events.manage', 'audience.read'],
  COMMERCE: ['overview.read', 'store.read', 'store.manage'],
  VIEWER: READ_ALL,
};

export function permissionsFor(roles: readonly StaffRole[]): Set<Permission> {
  const granted = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      granted.add(permission);
    }
  }
  return granted;
}

/** Roles only an owner may grant or take away. */
export const PRIVILEGED_ROLES: readonly StaffRole[] = ['OWNER', 'ADMIN'];

export const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Administrator',
  ADMISSIONS: 'Admissions',
  COMMUNICATIONS: 'Communications',
  EVENTS: 'Events',
  COMMERCE: 'Store',
  VIEWER: 'Viewer',
};
