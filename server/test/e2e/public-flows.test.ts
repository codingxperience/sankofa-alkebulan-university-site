import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, beforeEach, describe, it } from 'node:test';
import { publishedEvent, registration, signedInStaff } from '../support/fixtures';
import { Client, type Harness, resetDatabase, startApi } from '../support/harness';

describe('public flows', () => {
  let api: Harness;

  before(async () => {
    api = await startApi();
  });
  beforeEach(() => resetDatabase(api.prisma));
  after(() => api.close());

  describe('inquiries', () => {
    const message = {
      office: 'RESEARCH',
      name: 'Visiting Scholar',
      email: 'Scholar@Example.org',
      message: 'We would like to propose a joint seminar series on indigenous knowledge systems.',
    };

    it('routes a message, acknowledges it, and alerts the office', async () => {
      const result = await new Client(api.url).post('/inquiries', message);
      assert.equal(result.status, 201);
      assert.match(result.data.reference, /^SAU-Q-/);
      assert.equal(result.data.office.label, 'Research & Partnerships');
      const stored = await api.prisma.inquiry.findUniqueOrThrow({ where: { reference: result.data.reference } });
      assert.equal(stored.email, 'scholar@example.org');
      const templates = (await api.prisma.outboundEmail.findMany()).map((e) => e.template).sort();
      assert.deepEqual(templates, ['inquiry.received', 'inquiry.staff_alert']);
    });

    it('treats a retried or double-clicked submission as the same message', async () => {
      const client = new Client(api.url);
      const clientRequestId = randomUUID();
      const first = await client.post('/inquiries', { ...message, clientRequestId });
      const retry = await client.post('/inquiries', { ...message, clientRequestId });
      const doubleClick = await client.post('/inquiries', message);
      assert.equal(retry.data.reference, first.data.reference);
      assert.equal(doubleClick.data.reference, first.data.reference);
      assert.equal(await api.prisma.inquiry.count(), 1);
    });

    it('quietly drops submissions that fill the hidden bot field', async () => {
      const result = await new Client(api.url).post('/inquiries', { ...message, website: 'http://spam.example' });
      assert.equal(result.status, 201);
      assert.equal(await api.prisma.inquiry.count(), 0);
    });
  });

  describe('event registration', () => {
    it('confirms seats up to capacity, then waitlists — even under a rush', async () => {
      await publishedEvent(api.prisma, { capacity: 3 });
      const results = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          new Client(api.url).post('/events/test-symposium/registrations', registration(`person${i}@example.org`)),
        ),
      );
      assert.ok(results.every((r) => r.status === 201), JSON.stringify(results.map((r) => r.data)));
      const statuses = results.map((r) => r.data.status).sort();
      assert.deepEqual(statuses, ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'WAITLISTED', 'WAITLISTED', 'WAITLISTED']);
    });

    it('accepts only the choices the event offers', async () => {
      await publishedEvent(api.prisma);
      const result = await new Client(api.url).post('/events/test-symposium/registrations', {
        ...registration('someone@example.org'),
        attendanceMode: 'By carrier pigeon',
      });
      assert.equal(result.status, 422);
      assert.ok(result.data.error.fields.attendanceMode);
    });

    it('does not reveal a registration code to someone re-entering an address', async () => {
      await publishedEvent(api.prisma);
      const client = new Client(api.url);
      const first = await client.post('/events/test-symposium/registrations', registration('member@example.org'));
      const second = await client.post('/events/test-symposium/registrations', registration('member@example.org'));
      assert.ok(first.data.code);
      assert.equal(second.data.alreadyRegistered, true);
      assert.equal(second.data.code, undefined);
    });

    it('records consent to updates with the exact wording agreed to', async () => {
      await publishedEvent(api.prisma);
      await new Client(api.url).post('/events/test-symposium/registrations', { ...registration('keen@example.org'), wantsUpdates: true });
      const subscriber = await api.prisma.subscriber.findUniqueOrThrow({ where: { email: 'keen@example.org' } });
      assert.match(subscriber.consentText, /Keep me informed/);
    });
  });

  describe('store', () => {
    async function product(sku: string, stock: number | null, priceCents = 1000) {
      return api.prisma.product.create({
        data: { sku, name: `Product ${sku}`, kind: 'ARTIFACT', status: 'AVAILABLE', priceCents, stockRemaining: stock },
      });
    }
    const order = (sku: string, quantity: number) => ({
      items: [{ sku, quantity }],
      customer: { name: 'Store Customer', email: `buyer-${randomUUID()}@example.org`, phone: '+256 700 000 000' },
      fulfilment: 'PICKUP',
      rail: 'MOBILE_MONEY',
    });

    it('prices orders on the server, whatever the browser claims', async () => {
      await product('mask', null, 34000);
      const result = await new Client(api.url).post('/store/orders', { ...order('mask', 2), priceCents: 1 });
      assert.equal(result.status, 201);
      assert.equal(result.data.order.totalCents, 68000);
    });

    it('never sells more of a limited edition than exists, even when buyers race', async () => {
      await product('edition', 3);
      const results = await Promise.all(Array.from({ length: 8 }, () => new Client(api.url).post('/store/orders', order('edition', 1))));
      const placed = results.filter((r) => r.status === 201).length;
      assert.equal(placed, 3);
      assert.ok(results.filter((r) => r.status !== 201).every((r) => r.status === 409 || r.status === 429));
      const after = await api.prisma.product.findUniqueOrThrow({ where: { sku: 'edition' } });
      assert.equal(after.stockRemaining, 0);
      assert.equal(after.status, 'SOLD_OUT');
    });

    it('returns stock when an unpaid order is cancelled', async () => {
      await product('vase', 2);
      const staff = await signedInStaff(api.prisma, api.url, 'store@example.org', ['COMMERCE']);
      const placed = await new Client(api.url).post('/store/orders', order('vase', 2));
      const id = (await api.prisma.order.findUniqueOrThrow({ where: { number: placed.data.order.number } })).id;
      assert.equal((await api.prisma.product.findUniqueOrThrow({ where: { sku: 'vase' } })).stockRemaining, 0);
      assert.equal((await staff.patch(`/admin/store/orders/${id}`, { status: 'CANCELLED' })).status, 200);
      const restocked = await api.prisma.product.findUniqueOrThrow({ where: { sku: 'vase' } });
      assert.equal(restocked.stockRemaining, 2);
      assert.equal(restocked.status, 'AVAILABLE');
    });

    it('shows an order only to someone holding its private key', async () => {
      await product('book', null);
      const placed = await new Client(api.url).post('/store/orders', order('book', 1));
      const { number } = placed.data.order;
      const client = new Client(api.url);
      assert.equal((await client.get(`/store/orders/${number}`, { 'X-Order-Key': placed.data.accessKey })).status, 200);
      assert.equal((await client.get(`/store/orders/${number}`, { 'X-Order-Key': 'guess' })).status, 404);
    });
  });

  describe('journal', () => {
    it('publishes only what is published and due, and finds it by search', async () => {
      const body = '<p>' + 'The baobab keeps the memory of the village and its rivers. '.repeat(10) + '</p>';
      const base = { authorName: 'Journal Desk', bodyHtml: body, excerpt: 'An essay.', categories: [], tags: ['heritage'] };
      await api.prisma.article.createMany({
        data: [
          { ...base, slug: 'live', title: 'The Baobab Remembers', status: 'PUBLISHED', publishedAt: new Date(Date.now() - 1000) },
          { ...base, slug: 'draft', title: 'A Draft', status: 'DRAFT' },
          { ...base, slug: 'later', title: 'Scheduled Essay', status: 'PUBLISHED', publishedAt: new Date(Date.now() + 86_400_000) },
        ],
      });
      const client = new Client(api.url);
      const list = await client.get('/journal/articles');
      assert.deepEqual(list.data.items.map((a: { slug: string }) => a.slug), ['live']);
      assert.equal((await client.get('/journal/articles/draft')).status, 404);
      assert.equal((await client.get('/journal/articles/later')).status, 404);
      const found = await client.get('/journal/articles?q=baobab');
      assert.deepEqual(found.data.items.map((a: { slug: string }) => a.slug), ['live']);
      assert.match(list.headers.get('cache-control') ?? '', /s-maxage/);
    });
  });

  describe('admissions', () => {
    it('saves drafts as they are typed and refuses a stale tab', async () => {
      const client = new Client(api.url);
      const started = await client.post('/admissions/applications', { pathway: 'UNDERGRADUATE' });
      assert.equal(started.status, 201);
      assert.match(started.data.reference, /^SAU-\d{2}-[0-9A-Z]{6}$/);

      const saved = await client.put('/admissions/applications/current', {
        version: started.data.version,
        step: 'personal',
        data: { givenName: 'Kwame', familyName: 'Mensah' },
      });
      assert.equal(saved.status, 200);
      assert.equal(saved.data.answers.personal.givenName, 'Kwame');
      assert.equal(saved.data.issues.personal.email, 'Email is required.');

      const stale = await client.put('/admissions/applications/current', { version: started.data.version, step: 'personal', data: {} });
      assert.equal(stale.status, 409);
      assert.equal(stale.data.error.details.answers.personal.givenName, 'Kwame');

      assert.equal((await new Client(api.url).get('/admissions/applications/current')).status, 204, 'another browser cannot see it');
      const forged = await new Client(api.url).get('/admissions/applications/current', { Cookie: 'sau_applicant=not-a-real-token-0123456789abcdef' });
      assert.equal(forged.status, 401, 'an unknown link is refused');
    });
  });
});
