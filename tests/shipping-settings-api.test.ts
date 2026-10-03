import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../pages/api/admin/shipping';
import { db } from '../lib/db';
import { makeSession, cookieName } from '../lib/auth';
import { defaultShippingSettings } from '../lib/shipping-pricing';
test('shipping settings require admin, same origin, valid fees, and the current revision', async (t) => {
  Object.assign(process.env, {
    MYSQL_HOST: 'test',
    MYSQL_PASSWORD: 'test',
    MYSQL_CA: 'test',
    APP_URL: 'http://localhost:3000',
    SESSION_SECRET: 'test-session-secret-with-at-least-32-characters',
  });
  const token = await makeSession(1, 1);
  let revision = 1;
  const writes: unknown[][] = [];
  t.mock.method(db(), 'execute', async (sql: string, values: unknown[]) => {
    if (sql.includes('FROM admins')) return [[{ session_version: 1 }], []];
    writes.push(values);
    if (values.at(-1) !== revision) return [{ affectedRows: 0 }, []];
    revision++;
    return [{ affectedRows: 1 }, []];
  });
  async function call(body: unknown, authenticated = true, origin = process.env.APP_URL) {
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
        method: 'PUT',
        body,
        headers: { origin, cookie: authenticated ? `${cookieName}=${token}` : '' },
      } as unknown as NextApiRequest,
      res,
    );
    return status;
  }
  const body = {
    settings: { ...defaultShippingSettings, luzon: 18000, freeShippingThreshold: 200000 },
    revision: 1,
  };
  assert.equal(await call(body, false), 401);
  assert.equal(await call(body, true, 'https://other.example'), 403);
  assert.equal(await call({ ...body, settings: { ...body.settings, luzon: -1 } }), 400);
  assert.equal(writes.length, 0);
  assert.equal(await call(body), 200);
  assert.deepEqual(writes[0], [12000, 18000, 12000, 12000, 200000, 1]);
  assert.equal(await call(body), 409);
  assert.equal(
    await call({ settings: { ...body.settings, freeShippingThreshold: null }, revision: 2 }),
    200,
  );
});
