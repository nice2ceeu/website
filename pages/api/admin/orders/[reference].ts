import type { NextApiRequest, NextApiResponse } from 'next';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { isAdmin } from '@/lib/auth';
import { sameOrigin } from '@/lib/api';
import { db } from '@/lib/db';
import { statuses } from '@/lib/validation';
import { sendOrderEmail } from '@/lib/email';
import { emailOrderFromRow } from '@/lib/order-email';
import { adjustOrderShipping, ShippingAdjustmentError } from '@/lib/adjust-order-shipping';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isAdmin(req))) return res.status(401).json({ error: 'Sign in required' });
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    res.setHeader('Allow', 'PATCH, POST');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  const reference = req.query.reference;
  if (typeof reference !== 'string' || !/^LM-[A-F0-9]{8}(?:-[1-9][0-9]?)?$/.test(reference))
    return res.status(400).json({ error: 'Invalid reference' });
  try {
    if (req.method === 'POST') {
      const [rows] = await db().execute<RowDataPacket[]>('SELECT * FROM orders WHERE reference=?', [
        reference,
      ]);
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      const o = rows[0];
      await sendOrderEmail(emailOrderFromRow(o));
      await db().execute('UPDATE orders SET email_status=? WHERE reference=?', ['sent', reference]);
      return res.json({ ok: true });
    }
    if (req.body && Object.hasOwn(req.body, 'shipping'))
      return res.json(await adjustOrderShipping(reference, req.body));
    if (!statuses.includes(req.body?.status))
      return res.status(400).json({ error: 'Invalid status' });
    const [result] = await db().execute<ResultSetHeader>(
      'UPDATE orders SET status=? WHERE reference=?',
      [req.body.status, reference],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof ShippingAdjustmentError)
      return res.status(error.status).json({ error: error.message });
    return res
      .status(503)
      .json({ error: 'Unable to complete this action. Check database and email configuration.' });
  }
}
