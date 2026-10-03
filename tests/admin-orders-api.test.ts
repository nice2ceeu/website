import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../pages/api/admin/orders/[reference]';
import { makeSession, cookieName } from '../lib/auth';
import { db } from '../lib/db';

test('admin manages a cart as one order and resends one invoice containing every item', async (t) => {
  Object.assign(process.env, {
    MYSQL_HOST: 'test',
    MYSQL_PASSWORD: 'test',
    MYSQL_CA: 'test',
    APP_URL: 'http://localhost:3000',
    SESSION_SECRET: 'test-session-secret-with-at-least-32-characters',
    BREVO_API_KEY: 'test',
    BREVO_SENDER_EMAIL: 'store@example.com',
    ORDER_NOTIFICATION_EMAIL: 'admin@example.com',
  });
  const token = await makeSession(1, 1);
  const items = [
    {
      productSlug: 'first',
      productName: 'First Tee',
      size: 'M',
      color: 'White',
      quantity: 2,
      unitPrice: 69000,
    },
    {
      productSlug: 'second',
      productName: 'Second Tee',
      size: 'L',
      color: 'Butter',
      quantity: 1,
      unitPrice: 50000,
    },
  ];
  const order = {
    reference: 'LM-ABCDEF12',
    product_name: 'First Tee',
    product_slug: 'first',
    size: 'M',
    color: 'White',
    quantity: 2,
    unit_price: 69000,
    total: 200000,
    shipping: 12000,
    customer_name: 'Test Customer',
    email: 'test@example.com',
    phone: '09123456789',
    address: '123 Test Street',
    city: 'Manila',
    postal_code: '1000',
    notes: '',
    payment_method: 'cod',
    payment_details: '',
    status: 'paid',
    created_at: '2026-10-03T00:00:00Z',
    items: JSON.stringify(items),
  };
  const mutations: { sql: string; values: unknown[] }[] = [];
  t.mock.method(db(), 'execute', async (sql: string, values: unknown[]) => {
    if (sql.includes('FROM admins')) return [[{ session_version: 1 }], []];
    if (sql.startsWith('SELECT')) return [[order], []];
    mutations.push({ sql, values });
    return [{ affectedRows: 1 }, []];
  });
  const sent: { to: { email: string }[]; textContent: string; htmlContent: string }[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)));
    return new Response('{}', { status: 201 });
  });
  async function call(
    method: string,
    body: unknown = {},
    reference = order.reference,
    authenticated = true,
    origin = process.env.APP_URL,
  ) {
    let status = 200;
    const res = {
      setHeader() {
        return this;
      },
      status(code: number) {
        status = code;
        return this;
      },
      json() {
        return this;
      },
      end() {
        return this;
      },
    } as unknown as NextApiResponse;
    await handler(
      {
        method,
        body,
        query: { reference },
        headers: { origin, cookie: authenticated ? `${cookieName}=${token}` : '' },
      } as unknown as NextApiRequest,
      res,
    );
    return status;
  }
  assert.equal(await call('PATCH', { status: 'paid' }, order.reference, false), 401);
  assert.equal(
    await call('PATCH', { status: 'paid' }, order.reference, true, 'https://other.example'),
    403,
  );
  assert.equal(await call('PATCH', { status: 'invalid' }), 400);
  assert.equal(await call('POST', {}, 'invalid'), 400);
  assert.equal(mutations.length, 0);
  assert.equal(await call('PATCH', { status: 'shipped' }), 200);
  assert.deepEqual(mutations[0].values, ['shipped', order.reference]);
  assert.equal(await call('POST'), 200);
  assert.equal(sent.length, 2); // One invoice for the customer and one admin summary.
  for (const email of sent) {
    assert.ok(email.textContent.includes('First Tee'));
    assert.ok(email.textContent.includes('Second Tee'));
    assert.ok(email.textContent.includes('Order total: PHP 2,000.00'));
  }
  assert.deepEqual(mutations[1].values, ['sent', order.reference]);
  // Previously saved per-item cart references remain manageable.
  assert.equal(await call('PATCH', { status: 'processing' }, 'LM-ABCDEF12-2'), 200);
  assert.deepEqual(mutations[2].values, ['processing', 'LM-ABCDEF12-2']);
});
