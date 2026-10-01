import type { Office } from '../generated/prisma/client';

/**
 * The seven offices of the contact page, with the names and reply times the
 * site already promises. These are the defaults; the admin console can change
 * where each office's mail goes and what it promises.
 */
export const OFFICE_DEFAULTS: Record<Office, { label: string; responseTarget: string }> = {
  ADMISSIONS: { label: 'Admissions Office', responseTarget: '2–3 days' },
  PROGRAMMES: { label: 'Academic Pathways', responseTarget: '3–5 days' },
  RESEARCH: { label: 'Research & Partnerships', responseTarget: '3–5 days' },
  STUDENT_LIFE: { label: 'Student Systems', responseTarget: '2–4 days' },
  GOVERNANCE: { label: 'Governance & Administration', responseTarget: '5–7 days' },
  MEDIA: { label: 'Media & Public Scholarship', responseTarget: '3–5 days' },
  CENTRAL: { label: 'Central Desk', responseTarget: '2–4 days' },
};

export const OFFICE_ORDER: readonly Office[] = [
  'ADMISSIONS',
  'PROGRAMMES',
  'RESEARCH',
  'STUDENT_LIFE',
  'GOVERNANCE',
  'MEDIA',
  'CENTRAL',
];
