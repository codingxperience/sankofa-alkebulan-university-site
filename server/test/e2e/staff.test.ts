import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { signedInStaff } from '../support/fixtures';
import { Client, type Harness, STRONG_PASSWORD, resetDatabase, startApi } from '../support/harness';

describe('staff accounts', () => {
  let api: Harness;

  before(async () => {
    process.env.ADMIN_SETUP_KEY = 'test-setup-key-0123456789abcdef';
    api = await startApi();
  });
  beforeEach(() => resetDatabase(api.prisma));
  after(async () => {
    delete process.env.ADMIN_SETUP_KEY;
    await api.close();
  });

  it('lets the first owner set up the console exactly once', async () => {
    const client = new Client(api.url);
    assert.deepEqual((await client.get('/admin/auth/state')).data, { setupAvailable: true, awaitingSetupKey: false });

    const wrongKey = await client.post('/admin/auth/setup', { setupKey: 'nope', name: 'First Owner', email: 'owner@example.org', password: STRONG_PASSWORD });
    assert.equal(wrongKey.status, 401);

    const ok = await client.post('/admin/auth/setup', {
      setupKey: 'test-setup-key-0123456789abcdef',
      name: 'First Owner',
      email: 'Owner@Example.org',
      password: STRONG_PASSWORD,
    });
    assert.equal(ok.status, 201);
    const me = await client.get('/admin/auth/me');
    assert.equal(me.data.email, 'owner@example.org');
    assert.deepEqual(me.data.roles, ['OWNER']);

    const again = await new Client(api.url).post('/admin/auth/setup', {
      setupKey: 'test-setup-key-0123456789abcdef',
      name: 'Second Owner',
      email: 'second@example.org',
      password: STRONG_PASSWORD,
    });
    assert.equal(again.status, 410);
    assert.deepEqual((await client.get('/admin/auth/state')).data, { setupAvailable: false, awaitingSetupKey: false });
  });

  it('says when the first account is only waiting for a setup key', async () => {
    const key = process.env.ADMIN_SETUP_KEY;
    delete process.env.ADMIN_SETUP_KEY;
    const keyless = await startApi();
    try {
      await resetDatabase(keyless.prisma);
      const client = new Client(keyless.url);
      assert.deepEqual((await client.get('/admin/auth/state')).data, { setupAvailable: false, awaitingSetupKey: true });
      await signedInStaff(keyless.prisma, keyless.url, 'owner@example.org', ['OWNER']);
      assert.deepEqual((await client.get('/admin/auth/state')).data, { setupAvailable: false, awaitingSetupKey: false }, 'silent once anyone has an account');
    } finally {
      process.env.ADMIN_SETUP_KEY = key;
      await keyless.close();
    }
  });

  it('locks an account after repeated wrong passwords', async () => {
    await signedInStaff(api.prisma, api.url, 'locked@example.org', ['VIEWER']);
    await api.prisma.rateLimitBucket.deleteMany();
    const client = new Client(api.url);
    for (let i = 0; i < 5; i += 1) {
      assert.equal((await client.post('/admin/auth/sign-in', { email: 'locked@example.org', password: 'not the password' })).status, 401);
    }
    const locked = await client.post('/admin/auth/sign-in', { email: 'locked@example.org', password: STRONG_PASSWORD });
    assert.equal(locked.status, 429);
    assert.equal(locked.data.error.code, 'account_locked');
    const audit = await api.prisma.auditEvent.findFirst({ where: { action: 'staff.locked_out' } });
    assert.ok(audit);
  });

  it('enforces roles on every admin route', async () => {
    const viewer = await signedInStaff(api.prisma, api.url, 'viewer@example.org', ['VIEWER']);
    const admissions = await signedInStaff(api.prisma, api.url, 'admissions@example.org', ['ADMISSIONS']);

    assert.equal((await viewer.get('/admin/store/orders')).status, 200);
    assert.equal((await viewer.patch('/admin/store/products/00000000-0000-0000-0000-000000000000', { priceCents: 1 })).status, 403);
    assert.equal((await viewer.get('/admin/audience/export')).status, 403);
    assert.equal((await admissions.get('/admin/store/orders')).status, 403);
    assert.equal((await admissions.get('/admin/applications')).status, 200);
    assert.equal((await new Client(api.url).get('/admin/overview')).status, 401);
  });

  it('invites a colleague who chooses their own password', async () => {
    const owner = await signedInStaff(api.prisma, api.url, 'owner@example.org', ['OWNER']);
    const invited = await owner.post('/admin/staff', { email: 'new@example.org', name: 'New Colleague', roles: ['EVENTS'] });
    assert.equal(invited.status, 201);
    const token = new URL(invited.data.link.url).hash.replace('#token=', '');

    const guest = new Client(api.url);
    assert.equal((await guest.post('/admin/auth/invitation/inspect', { token })).data.name, 'New Colleague');
    assert.equal((await guest.post('/admin/auth/invitation/accept', { token, password: 'short' })).status, 422);
    assert.equal((await guest.post('/admin/auth/invitation/accept', { token, password: STRONG_PASSWORD })).status, 200);
    assert.deepEqual((await guest.get('/admin/auth/me')).data.roles, ['EVENTS']);
    assert.equal((await new Client(api.url).post('/admin/auth/invitation/accept', { token, password: STRONG_PASSWORD })).status, 410);
  });

  it('protects against lockouts: no self-demotion, never zero owners, only owners grant admin', async () => {
    const owner = await signedInStaff(api.prisma, api.url, 'owner@example.org', ['OWNER']);
    const admin = await signedInStaff(api.prisma, api.url, 'admin@example.org', ['ADMIN']);
    const ownerId = (await owner.get('/admin/auth/me')).data.id;
    const adminId = (await admin.get('/admin/auth/me')).data.id;

    assert.equal((await owner.patch(`/admin/staff/${ownerId}`, { roles: ['VIEWER'] })).status, 403);
    assert.equal((await admin.patch(`/admin/staff/${ownerId}`, { status: 'SUSPENDED' })).status, 403);
    assert.equal((await admin.post('/admin/staff', { email: 'x@example.org', name: 'Some One', roles: ['ADMIN'] })).status, 403);

    const suspended = await owner.patch(`/admin/staff/${adminId}`, { status: 'SUSPENDED' });
    assert.equal(suspended.status, 200);
    assert.equal((await admin.get('/admin/auth/me')).status, 401, 'suspension ends existing sessions');
  });

  it('signs out other devices when the password changes', async () => {
    const laptop = await signedInStaff(api.prisma, api.url, 'person@example.org', ['VIEWER']);
    const phone = new Client(api.url);
    await phone.post('/admin/auth/sign-in', { email: 'person@example.org', password: STRONG_PASSWORD });
    assert.equal((await phone.get('/admin/auth/me')).status, 200);

    const changed = await laptop.post('/admin/auth/password', { currentPassword: STRONG_PASSWORD, newPassword: 'quiet lakes remember every storm' });
    assert.equal(changed.status, 200);
    assert.equal((await laptop.get('/admin/auth/me')).status, 200, 'this device stays signed in');
    assert.equal((await phone.get('/admin/auth/me')).status, 401, 'the other device is signed out');
  });

  it('never reveals whether an email has an account when resetting passwords', async () => {
    await signedInStaff(api.prisma, api.url, 'real@example.org', ['VIEWER']);
    const client = new Client(api.url);
    const known = await client.post('/admin/auth/password-reset/request', { email: 'real@example.org' });
    const unknown = await client.post('/admin/auth/password-reset/request', { email: 'ghost@example.org' });
    assert.equal(known.status, 202);
    assert.deepEqual(known.data, unknown.data);
    assert.equal(await api.prisma.outboundEmail.count({ where: { template: 'staff.password_reset' } }), 1);
  });
});
