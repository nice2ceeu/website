import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentForOrder, paymentSettingsSchema } from '../lib/payment-settings';

const settings = {
  gcashEnabled: true,
  gcashDetails: 'GCash 09123456789',
  bankEnabled: true,
  bankDetails: 'Example Bank 1234',
  codEnabled: true,
  qrEnabled: false,
  qrDetails: '',
  qrImageUrl: '',
};

test('payment settings require instructions and orders use trusted configured details', () => {
  assert.ok(paymentSettingsSchema.safeParse(settings).success);
  assert.equal(paymentForOrder('gcash', settings).paymentDetails, 'GCash 09123456789');
  assert.equal(paymentForOrder('cod', settings).paymentDetails, '');
  assert.throws(() => paymentForOrder('bank', { ...settings, bankEnabled: false }));
  assert.equal(paymentSettingsSchema.safeParse({ ...settings, gcashDetails: '' }).success, false);
  assert.equal(
    paymentSettingsSchema.safeParse({
      ...settings,
      gcashEnabled: false,
      bankEnabled: false,
      codEnabled: false,
    }).success,
    false,
  );
});

test('QR payment requires an image and saves trusted instructions', () => {
  const qr = {
    ...settings,
    gcashEnabled: false,
    bankEnabled: false,
    codEnabled: false,
    qrEnabled: true,
    qrDetails: 'Scan and enter the order total.',
    qrImageUrl: 'https://example.com/pay.png',
  };
  assert.ok(paymentSettingsSchema.safeParse(qr).success);
  assert.equal(paymentSettingsSchema.safeParse({ ...qr, qrImageUrl: '' }).success, false);
  assert.equal(
    paymentSettingsSchema.safeParse({ ...qr, qrImageUrl: 'javascript:alert(1)' }).success,
    false,
  );
  assert.equal(
    paymentForOrder('qr', qr).paymentDetails,
    'Scan and enter the order total.\nQR payment image: https://example.com/pay.png',
  );
  assert.throws(() => paymentForOrder('qr', { ...qr, qrEnabled: false }));
});
