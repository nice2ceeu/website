import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentForOrder, paymentSettingsSchema } from '../lib/payment-settings';

const settings = {
  gcashEnabled: true,
  gcashDetails: 'GCash 09123456789',
  bankEnabled: true,
  bankDetails: 'Example Bank 1234',
  codEnabled: true,
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
