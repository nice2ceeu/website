import type { RowDataPacket } from 'mysql2';
import { db } from './db';
import { shippingAdjustmentSchema } from './shipping-pricing';
import { emailOrderFromRow } from './order-email';
import { sendOrderEmail } from './email';
export class ShippingAdjustmentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function adjustOrderShipping(reference: string, input: unknown) {
  const parsed = shippingAdjustmentSchema.safeParse(input);
  if (!parsed.success)
    throw new ShippingAdjustmentError(
      400,
      'Enter a valid shipping fee and a reason (3–500 characters).',
    );
  const value = parsed.data;
  const connection = await db().getConnection();
  let updated: RowDataPacket;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE reference=? FOR UPDATE',
      [reference],
    );
    const row = rows[0];
    if (!row) throw new ShippingAdjustmentError(404, 'Order not found.');
    if (row.status !== 'pending')
      throw new ShippingAdjustmentError(409, 'Shipping can only be adjusted on a pending order.');
    if (
      Number(row.shipping) !== value.expectedShipping ||
      Number(row.total) !== value.expectedTotal
    )
      throw new ShippingAdjustmentError(409, 'This order changed. Reload its details and retry.');
    if (value.shipping === Number(row.shipping))
      throw new ShippingAdjustmentError(400, 'Enter a different shipping fee.');
    const total = Number(row.total) - Number(row.shipping) + value.shipping;
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid saved order total.');
    await connection.execute(
      'INSERT INTO order_shipping_adjustments (order_id,old_shipping,new_shipping,reason) VALUES (?,?,?,?)',
      [row.id, row.shipping, value.shipping, value.reason],
    );
    await connection.execute(
      "UPDATE orders SET shipping=?,total=?,email_status='pending' WHERE id=?",
      [value.shipping, total, row.id],
    );
    updated = { ...row, shipping: value.shipping, total };
    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    throw error;
  } finally {
    connection.release();
  }
  let emailStatus = 'sent';
  try {
    await sendOrderEmail(emailOrderFromRow(updated));
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
  return { shipping: updated.shipping, total: updated.total, emailStatus };
}
