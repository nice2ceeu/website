import type { NextApiRequest, NextApiResponse } from 'next';
import { getShippingSettings } from '@/lib/shipping-settings';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    return res.json(await getShippingSettings());
  } catch {
    return res.status(503).json({ error: 'Shipping options are unavailable. Please try again.' });
  }
}
