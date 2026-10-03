import { z } from 'zod';
import { orderSchema, priceOrder } from './validation';
import { store, type Product } from './catalog';
export const cartOrderSchema = orderSchema
  .omit({ productSlug: true, size: true, color: true, quantity: true })
  .extend({
    items: z
      .array(orderSchema.pick({ productSlug: true, size: true, color: true, quantity: true }))
      .min(1)
      .max(20),
  });
export function priceCart(input: unknown, catalog: Product[]) {
  const { items, ...customer } = cartOrderSchema.parse(input);
  const merged: typeof items = [];
  for (const item of items) {
    const existing = merged.find(
      (entry) =>
        entry.productSlug === item.productSlug &&
        entry.size === item.size &&
        entry.color === item.color,
    );
    if (existing) existing.quantity += item.quantity;
    else merged.push({ ...item });
  }
  return merged.map((item, index) => {
    const order = priceOrder(
      { ...customer, ...item, idempotencyKey: customer.idempotencyKey },
      catalog,
    );
    const shipping = index === 0 ? store.shipping : 0;
    return { ...order, shipping, total: order.unitPrice * order.quantity + shipping };
  });
}
