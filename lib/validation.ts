import { z } from 'zod';
import { sizes, store, type Product } from './catalog';
export const orderSchema = z.object({
  productSlug: z.string(),
  size: z.enum(sizes),
  color: z.string(),
  quantity: z.number().int().min(1).max(10),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d ()-]{7,25}$/),
  address: z.string().trim().min(10).max(500),
  city: z.string().trim().min(2).max(100),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/),
  notes: z.string().trim().max(1000).default(''),
  consent: z.literal(true),
  idempotencyKey: z.uuid(),
});
export function priceOrder(input: unknown, catalog: Product[]) {
  const data = orderSchema.parse(input);
  const product = catalog.find((p) => p.slug === data.productSlug && p.active !== false);
  if (!product || product.color !== data.color) throw new Error('Invalid product or color');
  if (!(product.availableSizes || sizes).includes(data.size)) throw new Error('Size unavailable');
  return {
    ...data,
    productName: product.name,
    unitPrice: product.price,
    shipping: store.shipping,
    total: product.price * data.quantity + store.shipping,
  };
}
export const statuses = ['pending', 'paid', 'processing', 'shipped', 'cancelled'] as const;
