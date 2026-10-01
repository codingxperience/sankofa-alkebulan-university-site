import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { signatureMatches, stepIssues } from '../../src/admissions/application.schema';
import { upcomingIntakes } from '../../src/admissions/intakes';
import { hashPassword, needsRehash, verifyPassword } from '../../src/common/crypto/password';
import { randomCode, reference } from '../../src/common/crypto/references';
import { hashToken, hmac, safeEqual } from '../../src/common/crypto/tokens';
import { toCsv } from '../../src/common/http/csv';
import { describeFailure } from '../../src/common/failure';
import { cleanEnvValue, loadConfig } from '../../src/config/env';
import { registrationState } from '../../src/events/event-options';
import { cleanArticleHtml, normaliseAssetPath, plainText, readingMinutes } from '../../src/journal/article-html';
import { permissionsFor } from '../../src/staff/permissions';
import { assertStrongPassword } from '../../src/staff/password-policy';

describe('passwords', () => {
  it('verifies the right password and rejects others', async () => {
    const stored = await hashPassword('a long and memorable phrase');
    assert.match(stored, /^scrypt\$ln=15,r=8,p=3\$/);
    assert.equal(await verifyPassword('a long and memorable phrase', stored), true);
    assert.equal(await verifyPassword('a long and memorable phrasE', stored), false);
    assert.equal(await verifyPassword('anything', 'not-a-hash'), false);
  });

  it('salts every hash differently and flags weaker parameters for upgrade', async () => {
    const [a, b] = await Promise.all([hashPassword('same input here'), hashPassword('same input here')]);
    assert.notEqual(a, b);
    assert.equal(needsRehash(a), false);
    assert.equal(needsRehash('scrypt$ln=14,r=8,p=1$AAAA$BBBB'), true);
  });

  it('applies the password policy', () => {
    assert.throws(() => assertStrongPassword('short'), /at least 12/);
    assert.throws(() => assertStrongPassword('Sankofa2026!!'), /university name/);
    assert.throws(() => assertStrongPassword('password1234'.slice(0, 8) + '1234'), /too common|at least/);
    assert.throws(() => assertStrongPassword('amina.ssebunya.99', { email: 'amina.ssebunya@example.org' }), /email/);
    assert.doesNotThrow(() => assertStrongPassword('rivers carry the memory of mountains'));
    assert.doesNotThrow(() => assertStrongPassword('Sankofa-8$#2k9!@Q1z'));
  });
});

describe('tokens and references', () => {
  it('hashes tokens deterministically and compares in constant time', () => {
    assert.equal(hashToken('abc'), hashToken('abc'));
    assert.notEqual(hashToken('abc'), hashToken('abd'));
    assert.equal(safeEqual('x', 'x'), true);
    assert.equal(safeEqual('x', 'xy'), false);
    assert.notEqual(hmac('secret', 'a', 'bc'), hmac('secret', 'ab', 'c'));
  });

  it('builds references from an alphabet without ambiguous letters', () => {
    const ref = reference('SAU-Q');
    assert.match(ref, /^SAU-Q-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    assert.doesNotMatch(randomCode(2000), /[ILOU]/);
  });
});

describe('CSV export', () => {
  it('neutralises spreadsheet formulas and quotes awkward cells', () => {
    const csv = toCsv(['a', 'b'], [['=HYPERLINK("http://evil")', 'plain'], ['he said "hi", twice', null]]);
    const lines = csv.slice(1).trim().split('\r\n');
    assert.equal(lines[1], `"'=HYPERLINK(""http://evil"")",plain`);
    assert.equal(lines[2], '"he said ""hi"", twice",');
    assert.equal(csv.charCodeAt(0), 0xfeff);
  });
});

describe('admissions rules', () => {
  it('offers the next three January, May and September intakes', () => {
    assert.deepEqual(upcomingIntakes(new Date('2026-10-01T00:00:00Z')), ['January 2027', 'May 2027', 'September 2027']);
    assert.deepEqual(upcomingIntakes(new Date('2027-01-01T00:00:00Z')), ['May 2027', 'September 2027', 'January 2028']);
    assert.deepEqual(upcomingIntakes(new Date('2026-12-31T23:59:59Z')), ['January 2027', 'May 2027', 'September 2027']);
  });

  it('explains what is missing from a step in plain words', () => {
    const issues = stepIssues('personal', { givenName: 'Amina' });
    assert.equal(issues.familyName, 'Family name is required.');
    assert.equal(issues.email, 'Email is required.');
    assert.deepEqual(stepIssues('funding', { source: 'Scholarship', scholarshipInterest: false }), {});
  });

  it('enforces the 150–500 word statement', () => {
    const referees = [
      { name: 'Dr One', email: 'one@example.org', relationship: 'Supervisor' },
      { name: 'Dr Two', email: 'two@example.org', relationship: 'Lecturer' },
    ];
    assert.ok(stepIssues('statement', { statement: 'too short', referees }).statement);
    assert.ok(stepIssues('statement', { statement: 'word '.repeat(501), referees }).statement);
    assert.deepEqual(stepIssues('statement', { statement: 'word '.repeat(200), referees }), {});
  });

  it('accepts signatures that carry the applicant’s own names, accents aside', () => {
    assert.equal(signatureMatches('Ngũgĩ wa Thiong’o', 'Ngugi', 'Thiongo'), true);
    assert.equal(signatureMatches('Someone Else', 'Amina', 'Ssebunya'), false);
  });
});

describe('events', () => {
  const base = { status: 'PUBLISHED', startsAt: new Date('2030-01-10'), endsAt: null, registrationClosesAt: null, capacity: 2 };
  const now = new Date('2030-01-01');

  it('opens, waitlists and closes registration at the right moments', () => {
    assert.deepEqual(registrationState(base, 0, now), { open: true, waitlist: false });
    assert.deepEqual(registrationState(base, 2, now), { open: true, waitlist: true });
    assert.deepEqual(registrationState({ ...base, status: 'DRAFT' }, 0, now), { open: false, reason: 'not_published' });
    assert.deepEqual(registrationState(base, 0, new Date('2030-02-01')), { open: false, reason: 'ended' });
    assert.deepEqual(
      registrationState({ ...base, endsAt: new Date('2030-01-12'), registrationClosesAt: new Date('2029-12-31') }, 0, now),
      { open: false, reason: 'closed' },
    );
  });
});

describe('article HTML', () => {
  it('keeps editorial markup and removes everything dangerous', () => {
    const html = cleanArticleHtml(
      '<h1>Title</h1><p onclick="x()">Text <a href="javascript:alert(1)">bad</a> <a href="https://example.org">good</a></p><script>alert(1)</script><img src="wp-content/a.jpg" onerror="x">',
    );
    assert.doesNotMatch(html, /script|onclick|onerror|javascript:/);
    assert.match(html, /<h2>Title<\/h2>/);
    assert.match(html, /<a href="https:\/\/example.org" target="_blank" rel="noopener noreferrer">good<\/a>/);
    assert.equal(normaliseAssetPath('wp-content/a.jpg'), '/wp-content/a.jpg');
  });
});

describe('roles', () => {
  it('grants each role only what it needs', () => {
    const admissions = permissionsFor(['ADMISSIONS']);
    assert.ok(admissions.has('applications.manage'));
    assert.ok(!admissions.has('store.read'));
    const viewer = permissionsFor(['VIEWER']);
    assert.ok(viewer.has('store.read'));
    assert.ok(!viewer.has('store.manage'));
    assert.ok(!viewer.has('audience.export'));
    assert.ok(permissionsFor(['EVENTS', 'COMMERCE']).has('store.manage'));
  });
});

describe('article text', () => {
  it('keeps words apart where paragraphs, headings and line breaks meet', () => {
    assert.equal(plainText('<h2>Memory</h2><p>Ends here.</p><p>Begins<br>again</p>'), 'Memory Ends here. Begins again');
    assert.equal(plainText('<p>An <em>emphasised</em> word</p>'), 'An emphasised word');
  });

  it('estimates reading time at about 220 words a minute, never less than one', () => {
    assert.equal(readingMinutes('<p>Short.</p>'), 1);
    assert.equal(readingMinutes(`<p>${'word '.repeat(660)}</p>`), 3);
  });
});

describe('settings pasted into a hosting dashboard', () => {
  it('drops surrounding quotes and spaces, and nothing else', () => {
    assert.equal(cleanEnvValue('"postgresql://u:p@h:6543/db?pgbouncer=true"'), 'postgresql://u:p@h:6543/db?pgbouncer=true');
    assert.equal(cleanEnvValue("  'value'  "), 'value');
    assert.equal(cleanEnvValue('  plain '), 'plain');
    assert.equal(cleanEnvValue('"unbalanced'), '"unbalanced');
    assert.equal(cleanEnvValue('a"b"c'), 'a"b"c');
  });

  it('accepts a quoted database address and secret', () => {
    const config = loadConfig({
      DATABASE_URL: '"postgresql://u:p@db.example.org:6543/postgres?pgbouncer=true"',
      APP_SECRET: ' "0123456789abcdef0123456789abcdef" ',
      NODE_ENV: 'test',
    });
    assert.equal(config.database.url, 'postgresql://u:p@db.example.org:6543/postgres?pgbouncer=true');
    assert.equal(config.secret, '0123456789abcdef0123456789abcdef');
  });
});

describe('failure summaries shown when the API cannot start', () => {
  it('keeps what went wrong and hides addresses that carry credentials', () => {
    const summary = describeFailure(new Error('connect failed for postgresql://postgres.abc:s3cret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'));
    assert.equal(summary.name, 'Error');
    assert.equal(summary.message, 'connect failed for [address hidden]');
    assert.ok(!JSON.stringify(summary).includes('s3cret'));
  });

  it('keeps the missing module and drops the chain of files that required it', () => {
    const error = Object.assign(new Error("Cannot find module 'left-pad'\nRequire stack:\n- /var/task/server/dist/a.js"), { code: 'MODULE_NOT_FOUND' });
    assert.deepEqual(describeFailure(error), { name: 'Error', message: "Cannot find module 'left-pad'", code: 'MODULE_NOT_FOUND' });
  });

  it('describes things thrown that are not errors', () => {
    assert.equal(describeFailure('plain text').message, 'plain text');
    assert.equal(describeFailure(undefined).message, 'Unknown failure');
  });
});
