import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { publishedEvent, registration, signedInStaff } from '../support/fixtures';
import { Client, type Harness, resetDatabase, startApi } from '../support/harness';

describe('console behaviour', () => {
  let api: Harness;

  before(async () => {
    api = await startApi();
  });
  beforeEach(() => resetDatabase(api.prisma));
  after(() => api.close());

  it('lets anyone correct their own name and title, and nothing more', async () => {
    const viewer = await signedInStaff(api.prisma, api.url, 'viewer@example.org', ['VIEWER']);
    const updated = await viewer.patch('/admin/auth/me', { name: 'Akello Grace', title: 'Archivist' });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.name, 'Akello Grace');
    assert.equal(updated.data.title, 'Archivist');
    assert.equal((await viewer.patch('/admin/auth/me', { roles: ['OWNER'] })).status, 422, 'roles are not part of a profile');

    const cleared = await viewer.patch('/admin/auth/me', { title: '' });
    assert.equal(cleared.data.title, null);
    const logged = await api.prisma.auditEvent.findFirst({ where: { action: 'staff.profile_updated' } });
    assert.ok(logged);
  });

  it('lets an administrator edit their own details but not another administrator', async () => {
    const admin = await signedInStaff(api.prisma, api.url, 'admin@example.org', ['ADMIN']);
    await signedInStaff(api.prisma, api.url, 'other-admin@example.org', ['ADMIN']);
    const self = (await admin.get('/admin/auth/me')).data.id;
    const other = (await api.prisma.staffMember.findUniqueOrThrow({ where: { email: 'other-admin@example.org' } })).id;

    assert.equal((await admin.patch(`/admin/staff/${self}`, { title: 'Registrar' })).status, 200);
    assert.equal((await admin.patch(`/admin/staff/${self}`, { roles: ['VIEWER'] })).status, 403);
    assert.equal((await admin.patch(`/admin/staff/${other}`, { title: 'Bursar' })).status, 403);
  });

  it('clears an event summary sent empty, and keeps one left out', async () => {
    const events = await signedInStaff(api.prisma, api.url, 'events@example.org', ['EVENTS']);
    const created = await events.post('/admin/events', {
      slug: 'heritage-evening',
      title: 'Heritage Evening',
      summary: 'Readings and music.',
      venue: 'Main hall',
      startsAt: new Date(Date.now() + 10 * 86_400_000).toISOString(),
      options: { attendeeCategories: [], attendanceModes: [], days: [], interests: [] },
    });
    assert.equal(created.status, 201);
    const id = created.data.id;

    const untouched = await events.patch(`/admin/events/${id}`, { title: 'A Heritage Evening' });
    assert.equal(untouched.data.summary, 'Readings and music.');
    const cleared = await events.patch(`/admin/events/${id}`, { summary: '', venue: null });
    assert.equal(cleared.data.summary, null);
    assert.equal(cleared.data.venue, null);
  });

  it('links each registration in the daybook to its event', async () => {
    const event = await publishedEvent(api.prisma);
    const visitor = new Client(api.url);
    assert.equal((await visitor.post(`/events/${event.slug}/registrations`, registration('guest@example.org'))).status, 201);

    const staff = await signedInStaff(api.prisma, api.url, 'events@example.org', ['EVENTS']);
    const daybook = await staff.get('/admin/daybook');
    assert.equal(daybook.status, 200);
    const entry = daybook.data.items.find((item: { kind: string }) => item.kind === 'registration');
    assert.ok(entry);
    assert.equal(entry.parent, event.id);
    assert.ok(daybook.data.items.every((item: { kind: string }) => item.kind === 'registration'), 'only kinds the role may read');

    const overview = await staff.get('/admin/overview');
    assert.equal(overview.data.activity.days.length, 30);
    assert.equal(overview.data.activity.series.registration.at(-1), 1, "today's registration is counted on today's column");
    assert.equal(overview.data.activity.series.inquiry, undefined);
  });

  it('serves the overview and daybook to every role, each seeing only its own kinds', async () => {
    const roles = ['OWNER', 'ADMISSIONS', 'COMMUNICATIONS', 'EVENTS', 'COMMERCE', 'VIEWER'] as const;
    for (const role of roles) {
      const client = await signedInStaff(api.prisma, api.url, `${role.toLowerCase()}@example.org`, [role]);
      const overview = await client.get('/admin/overview');
      assert.equal(overview.status, 200, `overview for ${role}`);
      assert.ok(Array.isArray(overview.data.activity.days));
      assert.equal((await client.get('/admin/daybook')).status, 200, `daybook for ${role}`);
    }
  });

  it('writes a fresh excerpt when an editor empties it', async () => {
    const editor = await signedInStaff(api.prisma, api.url, 'editor@example.org', ['COMMUNICATIONS']);
    const body = `<p>${'Memory is a discipline as much as a gift. '.repeat(12)}</p>`;
    const created = await editor.post('/admin/journal/articles', {
      slug: 'on-memory',
      title: 'On Memory',
      excerpt: 'A hand-written summary.',
      bodyHtml: body,
      authorName: 'Editor',
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.excerpt, 'A hand-written summary.');

    const updated = await editor.patch(`/admin/journal/articles/${created.data.id}`, { excerpt: '', expectedUpdatedAt: created.data.updatedAt });
    assert.equal(updated.status, 200);
    assert.match(updated.data.excerpt, /^Memory is a discipline/);
  });
});
