import { z } from 'zod';

const orderItemSchema = z.object({
  productSlug: z.string(),
  productName: z.string(),
  size: z.string(),
  color: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;
export type StoredOrderItems = {
  items?: unknown;
  product_slug?: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
};

// Older single-product orders have no item list; use their saved product snapshot.
export function readOrderItems(order: StoredOrderItems): OrderItem[] {
  if (order.items != null) {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    return z.array(orderItemSchema).min(1).max(20).parse(items);
  }
  return [
    {
      productSlug: order.product_slug || '',
      productName: order.product_name,
      size: order.size,
      color: order.color,
      quantity: Number(order.quantity),
      unitPrice: Number(order.unit_price),
    },
  ];
}
