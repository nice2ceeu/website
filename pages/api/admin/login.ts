import type { NextApiRequest, NextApiResponse } from 'next';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { checkPassword, makeSession, sessionCookie } from '@/lib/auth';
import { sameOrigin, rateLimit, clientKey } from '@/lib/api';
import { db, configured } from '@/lib/db';

const loginSchema = z.object({ email: z.email().max(200), password: z.string().min(1).max(256) });
const dummyHash = '0'.repeat(32) + ':' + '0'.repeat(128);
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  if (!rateLimit('login:' + clientKey(req), 5, 900000))
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ error: 'Incorrect email or password.' });
  if (!configured() || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
    return res
      .status(503)
      .json({ error: 'Admin access is not configured. Follow the setup instructions.' });
  try {
    const [rows] = await db().execute<RowDataPacket[]>(
      'SELECT id, password_hash, session_version, active FROM admins WHERE email = ?',
      [parsed.data.email.toLowerCase()],
    );
    const admin = rows[0];
    const valid = checkPassword(parsed.data.password, admin?.password_hash ?? dummyHash);
    if (!valid || !admin?.active)
      return res.status(401).json({ error: 'Incorrect email or password.' });
    res.setHeader('Set-Cookie', sessionCookie(await makeSession(admin.id, admin.session_version)));
    return res.status(200).json({ ok: true });
  } catch {
    return res
      .status(503)
      .json({ error: 'Admin sign-in is temporarily unavailable. Check database setup.' });
  }
}
