import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { priceOrder } from '../lib/validation';
import { products } from '../scripts/fixtures/products';
import { checkPassword, isAdmin, makeSession, cookieName } from '../lib/auth';
import type { IncomingMessage } from 'node:http';
const valid = {
  productSlug: 'off-duty',
  size: 'M',
  color: 'Vintage white',
  quantity: 2,
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '09123456789',
  address: '123 Test Street',
  city: 'Manila',
  postalCode: '1000',
  notes: '',
  consent: true,
  idempotencyKey: 'c74bf539-9671-4e20-b413-ca7cd8356073',
};
test('prices use trusted catalog and shipping, ignoring client totals', () => {
  const order = priceOrder({ ...valid, total: 1, unitPrice: 1 }, products);
  assert.equal(order.total, 150000);
  assert.equal(order.unitPrice, 69000);
});
test('reject invalid product, color, quantity, consent, and contact data', () => {
  for (const patch of [
    { productSlug: 'missing' },
    { color: 'Black' },
    { size: 'XXXL' },
    { quantity: 0 },
    { quantity: 11 },
    { quantity: 1.5 },
    { email: 'invalid' },
    { consent: false },
    { postalCode: 'ABC' },
  ])
    assert.throws(() => priceOrder({ ...valid, ...patch }, products));
});
test('password hashes and signed admin sessions reject tampering', async () => {
  const salt = randomBytes(16).toString('hex');
  const storedHash = `${salt}:${scryptSync('test-password-123', salt, 64).toString('hex')}`;
  process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
  assert.equal(checkPassword('wrong', storedHash), false);
  assert.equal(checkPassword('test-password-123', storedHash), true);
  assert.equal(checkPassword('test-password-123', 'invalid'), false);
  const token = await makeSession(1, 1);
  const req = (value: string) =>
    ({ headers: { cookie: `${cookieName}=${value}` } }) as IncomingMessage;
  const { db } = await import('../lib/db');
  const { mock } = await import('node:test');
  // Mock only the database boundary; exercise actual password and JWT verification.
  process.env.MYSQL_HOST = 'test';
  process.env.MYSQL_PASSWORD = 'test';
  process.env.MYSQL_CA = 'test';
  const execute = mock.method(db(), 'execute', async () => [[{ session_version: 1 }], []]);
  assert.equal(await isAdmin(req(token)), true);
  execute.mock.mockImplementation(async () => [[{ session_version: 2 }], []]);
  assert.equal(await isAdmin(req(token)), false);
  execute.mock.mockImplementation(async () => [[], []]);
  assert.equal(await isAdmin(req(token)), false);
  assert.equal(await isAdmin(req(token + 'tampered')), false);
  assert.equal(await isAdmin({ headers: {} } as IncomingMessage), false);
  execute.mock.restore();
});
