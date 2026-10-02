import type { NextApiRequest, NextApiResponse } from 'next';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { adminSession, checkPassword, hashPassword, makeSession, sessionCookie } from '@/lib/auth';
import { clientKey, rateLimit, sameOrigin } from '@/lib/api';
import { db } from '@/lib/db';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(256),
    newPassword: z.string().min(12, 'Use at least 12 characters.').max(256),
    confirmPassword: z.string().min(1).max(256),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New passwords do not match.',
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'Choose a password different from your current password.',
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  const session = await adminSession(req);
  if (!session) return res.status(401).json({ error: 'Sign in required.' });
  if (!rateLimit(`password:${session.id}:${clientKey(req)}`, 5, 900000))
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid password.' });
  try {
    const [rows] = await db().execute<RowDataPacket[]>(
      'SELECT password_hash,session_version FROM admins WHERE id=? AND active=TRUE',
      [session.id],
    );
    const admin = rows[0];
    if (!admin || !checkPassword(parsed.data.currentPassword, admin.password_hash))
      return res.status(401).json({ error: 'Current password is incorrect.' });
    const nextVersion = Number(admin.session_version) + 1;
    const [result] = await db().execute<ResultSetHeader>(
      'UPDATE admins SET password_hash=?,session_version=? WHERE id=? AND session_version=? AND active=TRUE',
      [hashPassword(parsed.data.newPassword), nextVersion, session.id, admin.session_version],
    );
    if (result.affectedRows !== 1)
      return res
        .status(409)
        .json({ error: 'Your account changed in another session. Please retry.' });
    res.setHeader('Set-Cookie', sessionCookie(await makeSession(session.id, nextVersion)));
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ error: 'Unable to change the password. Please try again.' });
  }
}
