import type { RowDataPacket } from 'mysql2';
import type { EmailOrder } from './email-templates';
import { readOrderItems } from './order-items';
export function emailOrderFromRow(row: RowDataPacket): EmailOrder {
  return {
    reference: row.reference,
    items: readOrderItems(row as Parameters<typeof readOrderItems>[0]),
    email: row.email,
    name: row.customer_name,
    productName: row.product_name,
    size: row.size,
    color: row.color,
    quantity: row.quantity,
    total: row.total,
    unitPrice: row.unit_price,
    shipping: row.shipping,
    phone: row.phone,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentDetails: row.payment_details,
  };
}
