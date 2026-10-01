import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../pages/api/admin/products';
import { makeSession, cookieName } from '../lib/auth';
import { db } from '../lib/db';
import { sizes } from '../lib/catalog';
import { products } from '../scripts/fixtures/products';

test('product API protects mutations and performs create, edit, list and soft delete', async (t) => {
  process.env.MYSQL_HOST = 'test';
  process.env.MYSQL_PASSWORD = 'test';
  process.env.MYSQL_CA = 'test';
  process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
  process.env.APP_URL = 'http://localhost:3000';
  const token = await makeSession(1, 1);
  const statements: string[] = [];
  t.mock.method(db(), 'execute', async (sql: string) => {
    if (sql.includes('FROM admins')) return [[{ session_version: 1 }], []];
    statements.push(sql);
    return [{ affectedRows: 1, insertId: 5 }, []];
  });
  t.mock.method(db(), 'query', async (sql: string) => [
    sql.includes('COUNT(*)') ? [{ total: 0, published: 0 }] : [],
    [],
  ]);
  async function call(
    method: string,
    authenticated = true,
    origin = 'http://localhost:3000',
    body: unknown = {},
  ) {
    let status = 200;
    let data: unknown;
    const res = {
      setHeader() {
        return this;
      },
      status(code: number) {
        status = code;
        return this;
      },
      json(value: unknown) {
        data = value;
        return this;
      },
      end() {
        return this;
      },
    } as unknown as NextApiResponse;
    const req = {
      method,
      query: { id: '5' },
      body,
      headers: { origin, cookie: authenticated ? `${cookieName}=${token}` : '' },
    } as unknown as NextApiRequest;
    await handler(req, res);
    return { status, data };
  }
  assert.equal((await call('POST', false)).status, 401);
  assert.equal((await call('DELETE', true, 'https://other.example')).status, 403);
  assert.equal(statements.length, 0);
  const product = { ...products[0], imageUrl: '', availableSizes: [...sizes], active: true };
  assert.equal((await call('POST', true, undefined, product)).status, 201);
  assert.equal((await call('PUT', true, undefined, { ...product, price: 80000 })).status, 200);
  assert.equal((await call('DELETE')).status, 200);
  assert.deepEqual((await call('GET')).data, {
    products: [],
    published: 0,
    paging: { page: 1, pages: 1, total: 0, pageSize: 10, offset: 0 },
  });
  assert.ok(statements[0].startsWith('INSERT INTO products'));
  assert.ok(statements[1].includes('UPDATE products SET slug=?'));
  assert.ok(statements[2].includes('deleted_at=CURRENT_TIMESTAMP'));
  assert.equal((await call('POST', true, undefined, { ...product, price: -1 })).status, 400);
});
