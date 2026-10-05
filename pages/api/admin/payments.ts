import type { NextApiRequest, NextApiResponse } from 'next';
import type { ResultSetHeader } from 'mysql2';
import { isAdmin } from '@/lib/auth';
import { sameOrigin } from '@/lib/api';
import { db } from '@/lib/db';
import { paymentSettingsSchema } from '@/lib/payment-settings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isAdmin(req))) return res.status(401).json({ error: 'Sign in required.' });
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  const parsed = paymentSettingsSchema.safeParse(req.body?.settings);
  const revision = Number(req.body?.revision);
  if (!parsed.success || !Number.isSafeInteger(revision) || revision < 1)
    return res.status(400).json({
      error: parsed.success ? 'Invalid settings revision.' : parsed.error.issues[0]?.message,
    });
  const value = parsed.data;
  try {
    const [result] = await db().execute<ResultSetHeader>(
      'UPDATE payment_settings SET gcash_enabled=?,gcash_details=?,bank_enabled=?,bank_details=?,cod_enabled=?,qr_enabled=?,qr_details=?,qr_image_url=?,revision=revision+1 WHERE id=1 AND revision=?',
      [
        value.gcashEnabled,
        value.gcashDetails,
        value.bankEnabled,
        value.bankDetails,
        value.codEnabled,
        value.qrEnabled,
        value.qrDetails,
        value.qrImageUrl,
        revision,
      ],
    );
    if (result.affectedRows !== 1)
      return res
        .status(409)
        .json({ error: 'Settings changed in another session. Reload and retry.' });
    return res.json({ revision: revision + 1 });
  } catch {
    return res.status(503).json({ error: 'Unable to save payment settings.' });
  }
}
