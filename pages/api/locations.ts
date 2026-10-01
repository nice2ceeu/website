import type { NextApiRequest, NextApiResponse } from 'next';
import { locations } from '@/lib/locations';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const { level, parent } = req.query;
  if (
    typeof level !== 'string' ||
    !['provinces', 'cities', 'barangays'].includes(level) ||
    (level !== 'provinces' && (typeof parent !== 'string' || !/^\d{9}$/.test(parent)))
  )
    return res.status(400).json({ error: 'Invalid location query.' });
  try {
    const items = await locations(level, typeof parent === 'string' ? parent : '');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.json(items);
  } catch {
    return res.status(503).json({ error: 'Address options are unavailable. Please retry.' });
  }
}
