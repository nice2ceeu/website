import { z } from 'zod';

const detailsSchema = z.object({
  name: z.string().max(100),
  email: z.string().max(200),
  phone: z.string().max(25),
  address: z.string().max(350),
  provinceCode: z.string().regex(/^\d{9}$/),
  cityCode: z.string().regex(/^\d{9}$/),
  barangayCode: z.string().regex(/^\d{9}$/),
  postalCode: z.string().regex(/^\d{4}$/),
});
export type CheckoutDetails = z.infer<typeof detailsSchema>;
const storageKey = 'lightmare-checkout-details';

export function loadCheckoutDetails(): CheckoutDetails | null {
  try {
    const result = detailsSchema.safeParse(JSON.parse(localStorage.getItem(storageKey) || 'null'));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveCheckoutDetails(input: unknown) {
  const result = detailsSchema.safeParse(input);
  if (!result.success) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(result.data));
  } catch {}
}
