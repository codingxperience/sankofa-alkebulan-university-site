import { unprocessable } from '../common/http/errors';

/**
 * Follows NIST SP 800-63B: length is what matters, composition rules are not
 * imposed, and passwords that attackers try first are refused.
 */
const MIN_LENGTH = 12;
const MAX_LENGTH = 128;

const COMMON = new Set([
  'password',
  'password1',
  'password123',
  'passw0rd',
  '123456789012',
  '1234567890123',
  'qwertyuiopas',
  'qwerty123456',
  'iloveyou1234',
  'administrator',
  'welcome12345',
  'letmein12345',
  'changeme1234',
  'adminadmin12',
  'adminpass123',
  'abcdefghijkl',
  'abcd12345678',
  'trustno1trustno1',
  'football1234',
  'monkey123456',
]);

/** Words that, with digits or symbols bolted on, make the most-guessed passwords. */
const COMMON_BASES = new Set([
  'password', 'passw0rd', 'qwerty', 'qwertyuiop', 'letmein', 'welcome', 'iloveyou', 'monkey', 'football', 'baseball',
  'sunshine', 'princess', 'dragon', 'master', 'superman', 'trustno', 'shadow', 'freedom', 'abc', 'abcdef', 'admin',
  'administrator', 'changeme', 'secret', 'login', 'hello', 'africa', 'uganda', 'kampala',
]);

const INSTITUTION_WORD = /sankofa|alkebulan|university|admin/;
const INSTITUTION_WORDS = /sankofa|alkebulan|university|admin/g;

export function assertStrongPassword(password: string, context: { email?: string; name?: string } = {}): void {
  const fail = (message: string) => {
    throw unprocessable(message, { password: message }, 'weak_password');
  };

  if (password.length < MIN_LENGTH) {
    fail(`Use at least ${MIN_LENGTH} characters. A short phrase of four or five words works well.`);
  }
  if (password.length > MAX_LENGTH) {
    fail(`Use at most ${MAX_LENGTH} characters.`);
  }

  const lowered = password.toLowerCase();
  const base = lowered.replace(/[\d\W_]+$/, '').replace(/^[\d\W_]+/, '');
  if (
    COMMON.has(lowered) ||
    COMMON_BASES.has(base) ||
    /^(.)\1+$/.test(password) ||
    /^(0123456789|1234567890|9876543210)+/.test(password)
  ) {
    fail('That password is too common. Choose something less predictable.');
  }

  // "Sankofa2026!" is weak however many symbols it carries: once the
  // institution's own name is removed, what remains must stand on its own.
  if (INSTITUTION_WORD.test(lowered)) {
    const remainder = lowered.replace(INSTITUTION_WORDS, '');
    const onlyDigitsAndSymbols = /^\d*$/.test(remainder.replace(/[\W_]/g, ''));
    if (remainder.length < 8 || onlyDigitsAndSymbols) {
      fail('Avoid passwords built around the university name. Add something only you would think of.');
    }
  }

  const local = context.email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && lowered.includes(local)) {
    fail('Your password should not contain your email address.');
  }
  const firstName = context.name?.split(/\s+/)[0]?.toLowerCase();
  if (firstName && firstName.length >= 4 && lowered.replace(/[^a-z]/g, '') === firstName) {
    fail('Your password should not be your name.');
  }
}
