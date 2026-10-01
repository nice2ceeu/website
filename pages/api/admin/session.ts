import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  return res.json({ authenticated: await isAdmin(req) });
}
