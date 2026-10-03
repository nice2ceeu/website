import type { RowDataPacket } from 'mysql2';
import { configured, db } from './db';
import {
  defaultShippingSettings,
  shippingSettingsSchema,
  type ShippingSettings,
} from './shipping-pricing';
export async function getShippingSettings(): Promise<ShippingSettings & { revision: number }> {
  if (!configured()) return { ...defaultShippingSettings, revision: 0 };
  const [rows] = await db().execute<RowDataPacket[]>('SELECT * FROM shipping_settings WHERE id=1');
  if (!rows[0]) throw new Error('Shipping settings are not initialized.');
  const row = rows[0];
  return {
    ...shippingSettingsSchema.parse({
      metroManila: Number(row.metro_manila),
      luzon: Number(row.luzon),
      visayas: Number(row.visayas),
      mindanao: Number(row.mindanao),
      freeShippingThreshold:
        row.free_shipping_threshold == null ? null : Number(row.free_shipping_threshold),
    }),
    revision: Number(row.revision),
  };
}
