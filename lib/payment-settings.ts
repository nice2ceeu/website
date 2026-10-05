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
    qrEnabled: z.boolean().default(false),
    qrDetails: z.string().trim().max(1000).default(''),
    qrImageUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((value) => !value || (/^https:\/\//i.test(value) && URL.canParse(value)), {
        message: 'Enter a valid HTTPS QR image URL.',
      })
      .default(''),
  })
  .refine((value) => !value.gcashEnabled || value.gcashDetails.length > 0, {
    message: 'Enter GCash payment details before enabling GCash.',
  })
  .refine((value) => !value.bankEnabled || value.bankDetails.length > 0, {
    message: 'Enter bank payment details before enabling bank transfer.',
  })
  .refine((value) => !value.qrEnabled || value.qrImageUrl.length > 0, {
    message: 'Upload a QR image before enabling QR payment.',
  })
  .refine(
    (value) => value.gcashEnabled || value.bankEnabled || value.codEnabled || value.qrEnabled,
    {
      message: 'Enable at least one payment method.',
    },
  );

export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
export const defaultPaymentSettings: PaymentSettings = {
  gcashEnabled: false,
  gcashDetails: '',
  bankEnabled: false,
  bankDetails: '',
  codEnabled: true,
  qrEnabled: false,
  qrDetails: '',
  qrImageUrl: '',
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
    qrEnabled: Boolean(rows[0].qr_enabled),
    qrDetails: String(rows[0].qr_details || ''),
    qrImageUrl: String(rows[0].qr_image_url || ''),
    revision: Number(rows[0].revision),
  };
}

export function paymentForOrder(
  method: 'gcash' | 'bank' | 'cod' | 'qr',
  settings: PaymentSettings,
) {
  if (method === 'gcash' && settings.gcashEnabled)
    return { paymentMethod: method, paymentDetails: settings.gcashDetails };
  if (method === 'bank' && settings.bankEnabled)
    return { paymentMethod: method, paymentDetails: settings.bankDetails };
  if (method === 'qr' && settings.qrEnabled && settings.qrImageUrl)
    return {
      paymentMethod: method,
      paymentDetails: [settings.qrDetails, 'QR payment image: ' + settings.qrImageUrl]
        .filter(Boolean)
        .join('\n'),
    };
  if (method === 'cod' && settings.codEnabled) return { paymentMethod: method, paymentDetails: '' };
  throw new Error('Payment method unavailable');
}
