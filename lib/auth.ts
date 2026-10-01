import { SignJWT, jwtVerify } from 'jose';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { RowDataPacket } from 'mysql2';
import { db } from './db';
export const cookieName = 'lightmare_admin';
function secret() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
    throw new Error('Set SESSION_SECRET to at least 32 characters');
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}
export async function makeSession(adminId: number, sessionVersion: number) {
  return new SignJWT({ role: 'admin', sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(adminId))
    .setIssuer('lightmare')
    .setAudience('lightmare-admin')
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret());
}
export async function isAdmin(req: IncomingMessage) {
  try {
    const token = req.headers.cookie
      ?.split('; ')
      .find((c) => c.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    if (!token) return false;
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ['HS256'],
      issuer: 'lightmare',
      audience: 'lightmare-admin',
    });
    if (payload.role !== 'admin' || !payload.sub || !/^\d+$/.test(payload.sub)) return false;
    const [rows] = await db().execute<RowDataPacket[]>(
      'SELECT session_version FROM admins WHERE id = ? AND active = TRUE',
      [payload.sub],
    );
    return rows.length === 1 && rows[0].session_version === payload.sessionVersion;
  } catch {
    return false;
  }
}
export function checkPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function sessionCookie(value: string, maxAge = 28800) {
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
