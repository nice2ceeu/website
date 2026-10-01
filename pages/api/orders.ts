import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { priceOrder } from '@/lib/validation';
import { db, configured } from '@/lib/db';
import { sameOrigin, rateLimit, clientKey } from '@/lib/api';
import { sendOrderEmail } from '@/lib/email';
import { getProducts } from '@/lib/products';
import { resolveAddress } from '@/lib/locations';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  if (!rateLimit(`order:${clientKey(req)}`, 10, 600000))
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  let order;
  let catalog;
  try {
    catalog = await getProducts();
  } catch {
    return res
      .status(503)
      .json({ error: 'The product catalog is temporarily unavailable. Please try again later.' });
  }
  try {
    const address = await resolveAddress(req.body);
    order = priceOrder({ ...req.body, ...address }, catalog);
  } catch {
    return res
      .status(400)
      .json({ error: 'Please check your product selection and contact details.' });
  }
  if (!configured())
    return res.status(503).json({
      error: 'Orders are not open yet. Your request has not been saved. Please contact the store.',
    });
  const reference = `LM-${randomUUID().slice(0, 8).toUpperCase()}`;
  try {
    const [existing] = await db().execute<RowDataPacket[]>(
      'SELECT reference,email_status FROM orders WHERE idempotency_key=?',
      [order.idempotencyKey],
    );
    if (existing.length)
      return res
        .status(200)
        .json({ reference: existing[0].reference, emailStatus: existing[0].email_status });
    await db().execute(
      'INSERT INTO orders (reference,idempotency_key,product_slug,product_name,size,color,quantity,unit_price,shipping,total,customer_name,email,phone,address,city,postal_code,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        reference,
        order.idempotencyKey,
        order.productSlug,
        order.productName,
        order.size,
        order.color,
        order.quantity,
        order.unitPrice,
        order.shipping,
        order.total,
        order.name,
        order.email,
        order.phone,
        order.address,
        order.city,
        order.postalCode,
        order.notes,
      ],
    );
  } catch (e) {
    if ((e as { code?: string }).code === 'ER_DUP_ENTRY')
      return res.status(409).json({
        error: 'This request is already being processed. Please try again with the same form.',
      });
    return res.status(503).json({ error: 'We could not save your order. Please try again later.' });
  }
  let emailStatus = 'sent';
  try {
    await sendOrderEmail({ ...order, reference });
  } catch {
    emailStatus = 'failed';
  }
  try {
    await db().execute('UPDATE orders SET email_status=? WHERE reference=?', [
      emailStatus,
      reference,
    ]);
  } catch {
    emailStatus = 'unknown';
  }
  return res.status(201).json({ reference, emailStatus });
}
