import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes, scryptSync } from 'node:crypto';
import handler from '../pages/api/admin/password';
import { cookieName, makeSession } from '../lib/auth';
import { db } from '../lib/db';

const passwordHash = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

test('admin changes password with current-password verification and session rotation', async (t) => {
  process.env.MYSQL_HOST = 'test';
  process.env.MYSQL_PASSWORD = 'test';
  process.env.MYSQL_CA = 'test';
  process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
  process.env.APP_URL = 'http://localhost:3000';
  const currentHash = passwordHash('current-password');
  let updateValues: unknown[] = [];
  t.mock.method(db(), 'execute', async (sql: string, values: unknown[]) => {
    if (sql.includes('SELECT session_version')) return [[{ session_version: 1 }], []];
    if (sql.includes('SELECT password_hash'))
      return [[{ password_hash: currentHash, session_version: 1 }], []];
    updateValues = values;
    return [{ affectedRows: 1 }, []];
  });
  async function call(body: object) {
    let status = 200;
    let data: any;
    const headers: Record<string, string> = {};
    const res = {
      setHeader(name: string, value: string) {
        headers[name] = value;
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
    const token = await makeSession(1, 1);
    const req = {
      method: 'PUT',
      body,
      query: {},
      headers: { origin: 'http://localhost:3000', cookie: `${cookieName}=${token}` },
      socket: { remoteAddress: '127.0.0.20' },
    } as unknown as NextApiRequest;
    await handler(req, res);
    return { status, data, headers };
  }
  assert.equal(
    (
      await call({
        currentPassword: 'wrong-password',
        newPassword: 'new-password-123',
        confirmPassword: 'new-password-123',
      })
    ).status,
    401,
  );
  const changed = await call({
    currentPassword: 'current-password',
    newPassword: 'new-password-123',
    confirmPassword: 'new-password-123',
  });
  assert.equal(changed.status, 200);
  assert.match(changed.headers['Set-Cookie'], /^lightmare_admin=/);
  assert.equal(updateValues[1], 2);
  assert.equal(updateValues[2], 1);
  assert.notEqual(updateValues[0], currentHash);
  assert.equal(
    (
      await call({
        currentPassword: 'current-password',
        newPassword: 'short',
        confirmPassword: 'short',
      })
    ).status,
    400,
  );
});
