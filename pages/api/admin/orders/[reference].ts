import type { NextApiRequest, NextApiResponse } from 'next';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { isAdmin } from '@/lib/auth';
import { sameOrigin } from '@/lib/api';
import { db } from '@/lib/db';
import { statuses } from '@/lib/validation';
import { sendOrderEmail } from '@/lib/email';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isAdmin(req))) return res.status(401).json({ error: 'Sign in required' });
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    res.setHeader('Allow', 'PATCH, POST');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  const reference = req.query.reference;
  if (typeof reference !== 'string' || !/^LM-[A-F0-9]{8}$/.test(reference))
    return res.status(400).json({ error: 'Invalid reference' });
  try {
    if (req.method === 'POST') {
      const [rows] = await db().execute<RowDataPacket[]>('SELECT * FROM orders WHERE reference=?', [
        reference,
      ]);
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      const o = rows[0];
      await sendOrderEmail({
        reference,
        email: o.email,
        name: o.customer_name,
        productName: o.product_name,
        size: o.size,
        color: o.color,
        quantity: o.quantity,
        total: o.total,
        unitPrice: o.unit_price,
        shipping: o.shipping,
        phone: o.phone,
        address: o.address,
        city: o.city,
        postalCode: o.postal_code,
        notes: o.notes,
        createdAt: new Date(o.created_at).toISOString(),
        status: o.status,
      });
      await db().execute('UPDATE orders SET email_status=? WHERE reference=?', ['sent', reference]);
      return res.json({ ok: true });
    }
    if (!statuses.includes(req.body?.status))
      return res.status(400).json({ error: 'Invalid status' });
    const [result] = await db().execute<ResultSetHeader>(
      'UPDATE orders SET status=? WHERE reference=?',
      [req.body.status, reference],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true });
  } catch {
    return res
      .status(503)
      .json({ error: 'Unable to complete this action. Check database and email configuration.' });
  }
}
