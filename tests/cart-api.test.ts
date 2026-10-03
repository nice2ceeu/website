import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../pages/api/cart-orders';
import { db } from '../lib/db';
import { products } from '../scripts/fixtures/products';
import { store } from '../lib/catalog';

test('cart checkout saves one order with all items, rolls back failures, and reuses the saved receipt on retry', async (t) => {
  process.env.MYSQL_HOST = 'test';
  process.env.MYSQL_PASSWORD = 'test';
  process.env.MYSQL_CA = 'test';
  process.env.APP_URL = 'http://localhost:3000';
  process.env.BREVO_API_KEY = 'test';
  process.env.BREVO_SENDER_EMAIL = 'store@example.com';
  delete process.env.ORDER_NOTIFICATION_EMAIL;
  let emails = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    emails++;
    return new Response('{}', { status: 201 });
  });
  t.mock.method(db(), 'query', async () => [
    products.map((product) => ({
      ...product,
      active: true,
      sizes: ['S', 'M', 'L', 'XL'],
      image_url: product.imageUrl,
    })),
    [],
  ]);
  t.mock.method(db(), 'execute', async (sql: string) => [
    sql.includes('payment_settings') ? [{ cod_enabled: true }] : { affectedRows: 1 },
    [],
  ]);
  const calls: string[] = [];
  let inserts: unknown[][] = [];
  let existing: { reference: string; email_status: string; total: number }[] = [];
  let failInsert = false;
  const connection = {
    async beginTransaction() {
      calls.push('begin');
    },
    async commit() {
      calls.push('commit');
    },
    async rollback() {
      calls.push('rollback');
    },
    release() {
      calls.push('release');
    },
    async execute(sql: string, values: unknown[]) {
      if (sql.startsWith('SELECT')) return [existing, []];
      inserts.push(values);
      if (failInsert) throw new Error('Connection lost');
      return [{ affectedRows: 1 }, []];
    },
  };
  t.mock.method(db(), 'getConnection', async () => connection);
  const body = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '09123456789',
    provinceCode: '042100000',
    cityCode: '042103000',
    barangayCode: '042103001',
    address: '12 Sample Street',
    postalCode: '4102',
    notes: '',
    paymentMethod: 'cod',
    consent: true,
    idempotencyKey: 'c74bf539-9671-4e20-b413-ca7cd8356073',
    items: [
      { productSlug: products[0].slug, color: products[0].color, size: 'M', quantity: 2 },
      { productSlug: products[1].slug, color: products[1].color, size: 'L', quantity: 1 },
    ],
  };
  async function call(method = 'POST', payload: unknown = body, origin = process.env.APP_URL) {
    let status = 200;
    let data: { reference?: string; total?: number; emailStatus?: string } = {};
    const res = {
      setHeader() {
        return this;
      },
      status(code: number) {
        status = code;
        return this;
      },
      json(value: typeof data) {
        data = value;
        return this;
      },
      end() {
        return this;
      },
    } as unknown as NextApiResponse;
    await handler(
      {
        method,
        body: payload,
        headers: { origin },
        socket: { remoteAddress: 'cart-api-test' },
      } as unknown as NextApiRequest,
      res,
    );
    return { status, data };
  }
  assert.equal((await call('GET')).status, 405);
  assert.equal((await call('POST', body, 'https://other.example')).status, 403);
  assert.equal((await call('POST', { ...body, items: [] })).status, 400);
  assert.equal(calls.length, 0);
  const success = await call();
  assert.equal(success.status, 201);
  assert.match(success.data.reference!, /^LM-[A-F0-9]{8}$/);
  assert.equal(inserts.length, 1);
  assert.equal(JSON.parse(String(inserts[0][19])).length, 2);
  assert.equal(inserts[0][1], body.idempotencyKey);
  assert.equal(success.data.total, products[0].price * 2 + products[1].price + store.shipping);
  assert.equal(success.data.emailStatus, 'sent');
  assert.equal(emails, 1);
  assert.deepEqual(calls, ['begin', 'commit', 'release']);
  assert.equal(inserts[0][8], store.shipping);
  assert.equal(inserts[0][9], success.data.total);
  existing = inserts.map((values) => ({
    reference: String(values[0]),
    total: Number(values[9]),
    email_status: 'sent',
  }));
  calls.length = 0;
  inserts = [];
  assert.deepEqual((await call()).data, success.data);
  assert.equal(emails, 1);
  assert.equal(inserts.length, 0);
  assert.deepEqual(calls, ['begin', 'rollback', 'release']);
  existing = [];
  calls.length = 0;
  failInsert = true;
  assert.equal((await call()).status, 503);
  assert.deepEqual(calls, ['begin', 'rollback', 'release']);
  assert.equal(emails, 1);
});
