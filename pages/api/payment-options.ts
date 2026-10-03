import type { NextApiRequest, NextApiResponse } from 'next';
import { getPaymentSettings } from '@/lib/payment-settings';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    const { revision: _revision, ...settings } = await getPaymentSettings();
    return res.status(200).json(settings);
  } catch {
    return res.status(503).json({ error: 'Payment options are unavailable.' });
  }
}
