import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import { defaultLanding, landingSchema, contentFields } from '../lib/landing-content';
import handler from '../pages/api/admin/content';
import { db } from '../lib/db';
import { makeSession, cookieName } from '../lib/auth';
test('CMS validates editable content and excludes executable links and invalid measurements', () => {
  assert.ok(landingSchema.safeParse(defaultLanding).success);
  for (const patch of [
    { instagram: 'javascript:alert(1)' },
    { tiktok: 'http://example.com' },
    { contactEmail: 'invalid' },
    { faqs: [] },
    { measurements: defaultLanding.measurements.map((row) => ({ ...row, size: 'M' })) },
    { steps: [] },
  ])
    assert.equal(landingSchema.safeParse({ ...defaultLanding, ...patch }).success, false);
  assert.equal(landingSchema.safeParse({ ...defaultLanding, copy: {} }).success, false);
  assert.equal(Object.keys(defaultLanding.copy).length, contentFields.length);
});
test('CMS publishing requires admin, same origin, valid input, and current revision', async (t) => {
  process.env.MYSQL_HOST = 'test';
  process.env.MYSQL_PASSWORD = 'test';
  process.env.MYSQL_CA = 'test';
  process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
  process.env.APP_URL = 'http://localhost:3000';
  let updates = 0;
  let affectedRows = 1;
  t.mock.method(db(), 'execute', async (sql: string) => {
    if (sql.includes('FROM admins')) return [[{ session_version: 1 }], []];
    updates++;
    return [{ affectedRows }, []];
  });
  const token = await makeSession(1, 1);
  async function call(
    auth = true,
    origin = 'http://localhost:3000',
    content: unknown = defaultLanding,
  ) {
    let status = 200;
    let body: unknown;
    const res = {
      setHeader() {
        return this;
      },
      status(value: number) {
        status = value;
        return this;
      },
      json(value: unknown) {
        body = value;
        return this;
      },
      end() {
        return this;
      },
    } as unknown as NextApiResponse;
    const req = {
      method: 'PUT',
      headers: { origin, cookie: auth ? `${cookieName}=${token}` : '' },
      body: { content, revision: 1 },
    } as unknown as NextApiRequest;
    await handler(req, res);
    return { status, body };
  }
  assert.equal((await call(false)).status, 401);
  assert.equal((await call(true, 'https://other.example')).status, 403);
  assert.equal((await call(true, undefined, {})).status, 400);
  assert.equal(updates, 0);
  assert.deepEqual(await call(), { status: 200, body: { revision: 2 } });
  affectedRows = 0;
  assert.equal((await call()).status, 409);
});
