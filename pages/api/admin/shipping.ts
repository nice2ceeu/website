import type { NextApiRequest, NextApiResponse } from 'next';
import type { ResultSetHeader } from 'mysql2';
import { isAdmin } from '@/lib/auth';
import { sameOrigin } from '@/lib/api';
import { db } from '@/lib/db';
import { shippingSettingsSchema } from '@/lib/shipping-pricing';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isAdmin(req))) return res.status(401).json({ error: 'Sign in required.' });
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  const parsed = shippingSettingsSchema.safeParse(req.body?.settings);
  const revision = req.body?.revision;
  if (!parsed.success || !Number.isSafeInteger(revision) || revision < 1)
    return res
      .status(400)
      .json({ error: 'Check your shipping fees, threshold and settings revision.' });
  const value = parsed.data;
  try {
    const [result] = await db().execute<ResultSetHeader>(
      'UPDATE shipping_settings SET metro_manila=?,luzon=?,visayas=?,mindanao=?,free_shipping_threshold=?,revision=revision+1 WHERE id=1 AND revision=?',
      [
        value.metroManila,
        value.luzon,
        value.visayas,
        value.mindanao,
        value.freeShippingThreshold,
        revision,
      ],
    );
    if (result.affectedRows !== 1)
      return res
        .status(409)
        .json({ error: 'Settings changed in another session. Reload and retry.' });
    return res.json({ revision: revision + 1 });
  } catch {
    return res.status(503).json({ error: 'Unable to save shipping settings.' });
  }
}
