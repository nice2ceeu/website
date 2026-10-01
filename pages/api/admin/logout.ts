import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionCookie } from '@/lib/auth';
import { sameOrigin } from '@/lib/api';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  res.status(200).json({ ok: true });
}
