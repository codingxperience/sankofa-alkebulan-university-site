import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Client, type Harness, resetDatabase, startApi } from '../support/harness';

describe('security boundaries', () => {
  let api: Harness;

  before(async () => {
    api = await startApi();
    await resetDatabase(api.prisma);
  });
  after(() => api.close());

  it('reports health without revealing configuration', async () => {
    const result = await new Client(api.url).get('/health');
    assert.equal(result.status, 200);
    assert.deepEqual(Object.keys(result.data).sort(), ['database', 'latencyMs', 'status']);
  });

  it('sends defensive headers on every response', async () => {
    const result = await new Client(api.url).get('/health');
    assert.equal(result.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(result.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.match(result.headers.get('content-security-policy') ?? '', /default-src 'none'/);
    assert.equal(result.headers.get('x-powered-by'), null);
    assert.ok(result.headers.get('x-request-id'));
  });

  it('refuses state-changing requests from other sites', async () => {
    const crossSite = new Client(api.url, { 'Sec-Fetch-Site': 'cross-site' });
    const result = await crossSite.post('/admin/auth/sign-in', { email: 'a@example.org', password: 'x' });
    assert.equal(result.status, 403);
    assert.equal(result.data.error.code, 'cross_site_request');

    const foreignOrigin = new Client(api.url, { Origin: 'https://evil.example' });
    assert.equal((await foreignOrigin.post('/inquiries', {})).status, 403);
  });

  it('answers unknown routes and malformed bodies in the standard error shape', async () => {
    const client = new Client(api.url);
    const missing = await client.get('/nothing-here');
    assert.equal(missing.status, 404);
    assert.equal(missing.data.error.code, 'not_found');
    assert.ok(missing.data.error.requestId);

    const malformed = await fetch(`${api.url}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' },
      body: '{not json',
    });
    assert.equal(malformed.status, 400);
    assert.equal(((await malformed.json()) as { error: { message: string } }).error.message, 'The request body is not valid JSON.');

    const huge = await client.post('/inquiries', { message: 'x'.repeat(200_000) });
    assert.equal(huge.status, 413);
  });

  it('keeps every table behind row level security, away from Supabase API roles', async () => {
    const tables = await api.prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
      SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'sankofa'
    `;
    assert.ok(tables.length >= 19);
    assert.deepEqual(tables.filter((t) => !t.rowsecurity), []);
    const [anon] = await api.prisma.$queryRaw<Array<{ usage: boolean | null }>>`
      SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
        THEN has_schema_privilege('anon', 'sankofa', 'USAGE') END AS usage
    `;
    assert.notEqual(anon.usage, true);
  });

  it('rate limits by client and says when to retry', async () => {
    const client = new Client(api.url);
    const body = { email: 'nobody@example.org', password: 'wrong password' };
    const statuses: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      statuses.push((await client.post('/admin/auth/sign-in', body)).status);
    }
    assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
    const limited = await client.post('/admin/auth/sign-in', body);
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
  });
});
