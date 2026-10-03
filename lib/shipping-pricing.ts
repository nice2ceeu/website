import { z } from 'zod';
import provinceAreas from '../data/addresses/shipping-areas.json';

export const shippingAreas = {
  metroManila: 'Metro Manila',
  luzon: 'Rest of Luzon',
  visayas: 'Visayas',
  mindanao: 'Mindanao',
} as const;
export type ShippingArea = keyof typeof shippingAreas;
const fee = z.number().int().min(0).max(10000000);
export const shippingSettingsSchema = z.object({
  metroManila: fee,
  luzon: fee,
  visayas: fee,
  mindanao: fee,
  freeShippingThreshold: z.number().int().min(1).max(100000000).nullable(),
});
export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;
export const defaultShippingSettings: ShippingSettings = {
  metroManila: 12000,
  luzon: 12000,
  visayas: 12000,
  mindanao: 12000,
  freeShippingThreshold: null,
};
export function shippingArea(provinceCode: string): ShippingArea {
  const area = (provinceAreas as Record<string, ShippingArea>)[provinceCode];
  if (!area || !Object.hasOwn(shippingAreas, area))
    throw new Error('Select a valid delivery province.');
  return area;
}
export function shippingFee(settings: ShippingSettings, provinceCode: string, subtotal: number) {
  if (!Number.isSafeInteger(subtotal) || subtotal < 0) throw new Error('Invalid subtotal.');
  const area = shippingArea(provinceCode);
  return settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold
    ? 0
    : settings[area];
}
export const shippingAdjustmentSchema = z.object({
  shipping: fee,
  reason: z.string().trim().min(3).max(500),
  expectedShipping: fee,
  expectedTotal: z.number().int().nonnegative(),
});
