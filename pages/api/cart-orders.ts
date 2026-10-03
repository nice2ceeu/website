import type { NextApiRequest, NextApiResponse } from 'next';
import type { RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { priceCart } from '@/lib/cart-validation';
import { configured, db } from '@/lib/db';
import { sameOrigin, rateLimit, clientKey } from '@/lib/api';
import { getProducts } from '@/lib/products';
import { resolveAddress } from '@/lib/locations';
import { getPaymentSettings, paymentForOrder } from '@/lib/payment-settings';
import { sendOrderEmail } from '@/lib/email';
import { getShippingSettings } from '@/lib/shipping-settings';
import { shippingFee } from '@/lib/shipping-pricing';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  if (!rateLimit(`order:${clientKey(req)}`, 10, 600000))
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  let catalog;
  try {
    catalog = await getProducts();
  } catch {
    return res.status(503).json({ error: 'The product catalog is temporarily unavailable.' });
  }
  let shippingSettings;
  try {
    shippingSettings = await getShippingSettings();
  } catch {
    return res.status(503).json({ error: 'Shipping settings are unavailable. Please try again.' });
  }
  let orders;
  try {
    const [address, settings] = await Promise.all([resolveAddress(req.body), getPaymentSettings()]);
    orders = priceCart({ ...req.body, ...address }, catalog).map((order) => ({
      ...order,
      ...paymentForOrder(order.paymentMethod, settings),
    }));
  } catch {
    return res.status(400).json({
      error:
        'Please check your sizes, quantities, payment method and contact details. Each size can have up to 10 tees.',
    });
  }
  if (!configured())
    return res
      .status(503)
      .json({ error: 'Orders are not open yet. Your request has not been saved.' });
  const reference = `LM-${randomUUID().slice(0, 8).toUpperCase()}`;
  const items = orders.map(({ productSlug, productName, size, color, quantity, unitPrice }) => ({
    productSlug,
    productName,
    size,
    color,
    quantity,
    unitPrice,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = shippingFee(shippingSettings, String(req.body.provinceCode), subtotal);
  const saved = {
    ...orders[0],
    reference,
    items,
    shipping,
    total: subtotal + shipping,
  };
  let connection: PoolConnection | undefined;
  try {
    connection = await db().getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute<RowDataPacket[]>(
      'SELECT reference,email_status,total FROM orders WHERE idempotency_key=?',
      [saved.idempotencyKey],
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(200).json({
        reference: existing[0].reference,
        emailStatus: existing[0].email_status,
        total: Number(existing[0].total),
      });
    }
    if (req.body.shippingQuote !== saved.shipping) {
      await connection.rollback();
      return res
        .status(409)
        .json({
          error: 'Shipping has changed. Review the updated total and submit again.',
          shippingSettings,
        });
    }
    const order = saved;
    await connection.execute(
      'INSERT INTO orders (reference,idempotency_key,product_slug,product_name,size,color,quantity,unit_price,shipping,total,customer_name,email,phone,address,city,postal_code,notes,payment_method,payment_details,items) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        order.reference,
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
        order.paymentMethod,
        order.paymentDetails,
        JSON.stringify(order.items),
      ],
    );
    await connection.commit();
  } catch (error) {
    try {
      await connection?.rollback();
    } catch {}
    return res
      .status((error as { code?: string }).code === 'ER_DUP_ENTRY' ? 409 : 503)
      .json({ error: 'We could not save your cart. Please retry with the same form.' });
  } finally {
    connection?.release();
  }
  let emailStatus = 'sent';
  try {
    await sendOrderEmail(saved);
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
  return res.status(201).json({ reference, emailStatus, total: saved.total });
}
