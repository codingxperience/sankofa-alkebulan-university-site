import { z } from 'zod';
import { email as emailField } from '../common/validation/fields';

/**
 * The application form, step by step. Each step has two shapes:
 *
 *   draft    — what may be saved while someone is still typing: every field
 *              optional, every length bounded. Autosave never rejects work
 *              in progress.
 *   complete — what the step must contain to count as done. Submission
 *              requires every step to be complete.
 */

export const STEPS = ['pathway', 'personal', 'academic', 'statement', 'funding', 'declaration'] as const;
export type Step = (typeof STEPS)[number];

export const PATHWAYS = ['UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORAL'] as const;
export const PATHWAY_LABELS: Record<(typeof PATHWAYS)[number], string> = {
  UNDERGRADUATE: 'Undergraduate',
  POSTGRADUATE: 'Postgraduate',
  DOCTORAL: 'Doctoral',
};
export const STUDY_MODES = ['Full-time', 'Part-time', 'Online'] as const;
export const GENDERS = ['Prefer not to say', 'Female', 'Male', 'Non-binary', 'Self-describe'] as const;
export const FUNDING_SOURCES = ['Self-funded', 'Family', 'Employer or sponsor', 'Scholarship', 'Government'] as const;

const STATEMENT_MAX_WORDS = 500;

const text = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim());

const blankToUndefined = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), schema.optional());

const required = (label: string, max: number, min = 1) =>
  z
    .string({ error: `${label} is required.` })
    .max(max, `${label} is too long.`)
    .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim())
    .pipe(z.string().min(min, `${label} is required.`));

const year = z.coerce
  .number({ error: 'Use a four-digit year.' })
  .int('Use a four-digit year.')
  .min(1950, 'Use a four-digit year.')
  .max(new Date().getUTCFullYear() + 8, 'That year is too far ahead.');

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

// ─── Draft shapes (autosave) ──────────────────────────────────────────────

const draftQualification = z.object({
  institution: blankToUndefined(text(160)),
  qualification: blankToUndefined(text(160)),
  country: blankToUndefined(text(80)),
  startYear: blankToUndefined(z.coerce.number().int().min(1900).max(2100)),
  endYear: blankToUndefined(z.coerce.number().int().min(1900).max(2100)),
  result: blankToUndefined(text(120)),
});

const draftReferee = z.object({
  name: blankToUndefined(text(120)),
  email: blankToUndefined(text(254)),
  relationship: blankToUndefined(text(120)),
  institution: blankToUndefined(text(160)),
});

export const DRAFT: { [K in Step]: z.ZodType } = {
  pathway: z.object({
    pathway: z.enum(PATHWAYS).optional(),
    intake: blankToUndefined(text(60)),
    studyMode: blankToUndefined(z.enum(STUDY_MODES)),
  }),
  personal: z.object({
    givenName: blankToUndefined(text(80)),
    familyName: blankToUndefined(text(80)),
    dateOfBirth: blankToUndefined(text(10)),
    gender: blankToUndefined(z.enum(GENDERS)),
    genderSelfDescribed: blankToUndefined(text(80)),
    citizenship: blankToUndefined(text(80)),
    residence: blankToUndefined(text(80)),
    email: blankToUndefined(text(254)),
    phone: blankToUndefined(text(32)),
    address: blankToUndefined(text(300)),
  }),
  academic: z.object({
    firstChoice: blankToUndefined(text(200)),
    secondChoice: blankToUndefined(text(200)),
    qualifications: z.array(draftQualification).max(6).optional(),
  }),
  statement: z.object({
    statement: blankToUndefined(z.string().max(6000)),
    referees: z.array(draftReferee).max(2).optional(),
  }),
  funding: z.object({
    source: blankToUndefined(z.enum(FUNDING_SOURCES)),
    scholarshipInterest: z.boolean().optional(),
    notes: blankToUndefined(z.string().max(1500)),
  }),
  declaration: z.object({
    accurate: z.boolean().optional(),
    signature: blankToUndefined(text(160)),
  }),
};

// ─── Complete shapes (step done / submission) ─────────────────────────────

const qualification = z
  .object({
    institution: required('School or institution', 160),
    qualification: required('Qualification', 160),
    country: required('Country', 80),
    startYear: year,
    endYear: year.optional(),
    result: blankToUndefined(text(120)),
  })
  .refine((q) => !q.endYear || q.endYear >= q.startYear, { message: 'The end year is before the start year.', path: ['endYear'] });

const referee = z.object({
  name: required('Referee name', 120, 2),
  email: emailField,
  relationship: required('How they know you', 120),
  institution: blankToUndefined(text(160)),
});

function isAdultEnough(iso: string): boolean {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const ageYears = (Date.now() - date.getTime()) / (365.25 * 86_400_000);
  return ageYears >= 14 && ageYears <= 100;
}

export const COMPLETE: { [K in Step]: z.ZodType } = {
  pathway: z.object({
    pathway: z.enum(PATHWAYS, { error: 'Choose a pathway.' }),
    intake: required('Intake', 60),
    studyMode: z.enum(STUDY_MODES, { error: 'Choose how you would like to study.' }),
  }),
  personal: z
    .object({
      givenName: required('Given name', 80),
      familyName: required('Family name', 80),
      dateOfBirth: z
        .string({ error: 'Date of birth is required.' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker or YYYY-MM-DD.')
        .refine(isAdultEnough, 'Please check your date of birth.'),
      gender: blankToUndefined(z.enum(GENDERS)),
      genderSelfDescribed: blankToUndefined(text(80)),
      citizenship: required('Country of citizenship', 80),
      residence: required('Country of residence', 80),
      email: emailField,
      phone: z
        .string({ error: 'Phone number is required.' })
        .regex(/^\+?[0-9 ()./-]{7,32}$/, 'Please enter a valid phone number, including the country code.'),
      address: blankToUndefined(text(300)),
    }),
  academic: z.object({
    firstChoice: required('First-choice programme', 200),
    secondChoice: blankToUndefined(text(200)),
    qualifications: z.array(qualification, { error: 'Add at least one qualification.' }).min(1, 'Add at least one qualification.').max(6),
  }),
  statement: z.object({
    statement: z
      .string({ error: 'Your personal statement is required.' })
      .trim()
      .refine((value) => countWords(value) >= 150, 'Your statement should be at least 150 words.')
      .refine((value) => countWords(value) <= STATEMENT_MAX_WORDS, `Keep your statement to ${STATEMENT_MAX_WORDS} words.`),
    referees: z
      .array(referee, { error: 'Add two referees.' })
      .length(2, 'Add two referees.')
      .refine((list) => list[0]?.email !== list[1]?.email, 'Your two referees need different email addresses.'),
  }),
  funding: z.object({
    source: z.enum(FUNDING_SOURCES, { error: 'Tell us how you plan to fund your studies.' }),
    scholarshipInterest: z.boolean({ error: 'Tell us whether you would like to be considered for a scholarship.' }),
    notes: blankToUndefined(z.string().max(1500)),
  }),
  declaration: z.object({
    accurate: z.literal(true, { error: 'Please confirm the declaration.' }),
    signature: required('Your full name as signature', 160, 3),
  }),
};

export type Answers = Partial<Record<Step, Record<string, unknown>>>;

/** Field-level problems keeping a step from being complete; empty when the step is done. */
export function stepIssues(step: Step, value: unknown): Record<string, string> {
  const result = COMPLETE[step].safeParse(value ?? {});
  if (result.success) {
    return {};
  }
  const issues: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_';
    issues[key] ??= issue.message;
  }
  return issues;
}

/** The signature must recognisably be the applicant's own name. */
export function signatureMatches(signature: string, givenName?: unknown, familyName?: unknown): boolean {
  const normalise = (value: unknown) =>
    String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z]/g, '');
  const signed = normalise(signature);
  return Boolean(signed) && signed.includes(normalise(givenName)) && signed.includes(normalise(familyName));
}
