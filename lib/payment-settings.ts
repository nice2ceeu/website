import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { configured, db } from './db';

export const paymentSettingsSchema = z
  .object({
    gcashEnabled: z.boolean(),
    gcashDetails: z.string().trim().max(1000),
    bankEnabled: z.boolean(),
    bankDetails: z.string().trim().max(1000),
    codEnabled: z.boolean(),
  })
  .refine((value) => !value.gcashEnabled || value.gcashDetails.length > 0, {
    message: 'Enter GCash payment details before enabling GCash.',
  })
  .refine((value) => !value.bankEnabled || value.bankDetails.length > 0, {
    message: 'Enter bank payment details before enabling bank transfer.',
  })
  .refine((value) => value.gcashEnabled || value.bankEnabled || value.codEnabled, {
    message: 'Enable at least one payment method.',
  });

export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
export const defaultPaymentSettings: PaymentSettings = {
  gcashEnabled: false,
  gcashDetails: '',
  bankEnabled: false,
  bankDetails: '',
  codEnabled: true,
};

export async function getPaymentSettings(): Promise<PaymentSettings & { revision: number }> {
  if (!configured()) return { ...defaultPaymentSettings, revision: 0 };
  const [rows] = await db().execute<RowDataPacket[]>('SELECT * FROM payment_settings WHERE id=1');
  if (!rows[0]) throw new Error('Payment settings are not initialized.');
  return {
    gcashEnabled: Boolean(rows[0].gcash_enabled),
    gcashDetails: String(rows[0].gcash_details || ''),
    bankEnabled: Boolean(rows[0].bank_enabled),
    bankDetails: String(rows[0].bank_details || ''),
    codEnabled: Boolean(rows[0].cod_enabled),
    revision: Number(rows[0].revision),
  };
}

export function paymentForOrder(method: 'gcash' | 'bank' | 'cod', settings: PaymentSettings) {
  if (method === 'gcash' && settings.gcashEnabled)
    return { paymentMethod: method, paymentDetails: settings.gcashDetails };
  if (method === 'bank' && settings.bankEnabled)
    return { paymentMethod: method, paymentDetails: settings.bankDetails };
  if (method === 'cod' && settings.codEnabled) return { paymentMethod: method, paymentDetails: '' };
  throw new Error('Payment method unavailable');
}
