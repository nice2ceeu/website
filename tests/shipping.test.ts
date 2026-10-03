import test from 'node:test';
import assert from 'node:assert/strict';
import { shippingArea, shippingFee, shippingSettingsSchema } from '../lib/shipping-pricing';
import dataset from '../data/addresses/philippines.json';
import { adjustOrderShipping, ShippingAdjustmentError } from '../lib/adjust-order-shipping';
import { db } from '../lib/db';
const rates = {
  metroManila: 10000,
  luzon: 15000,
  visayas: 20000,
  mindanao: 25000,
  freeShippingThreshold: null as number | null,
};
test('every supported province has a shipping area, including independent cities', () => {
  for (const province of dataset.provinces) assert.ok(shippingArea(province.code));
  assert.equal(shippingFee(rates, '130000000', 100000), 10000);
  assert.equal(shippingFee(rates, '042100000', 100000), 15000);
  assert.equal(shippingFee(rates, '072200000', 100000), 20000);
  assert.equal(shippingFee(rates, '112300000', 100000), 25000);
  assert.equal(shippingArea('099701000'), 'mindanao');
  assert.equal(shippingArea('129804000'), 'mindanao');
  assert.equal(shippingArea('175300000'), 'luzon');
  for (const code of ['', '000000000', '133900000', '__proto__'])
    assert.throws(() => shippingFee(rates, code, 100000));
});
test('free shipping uses the product subtotal at the threshold and fees validate cents', () => {
  const settings = { ...rates, freeShippingThreshold: 200000 };
  assert.equal(shippingFee(settings, '130000000', 199999), 10000);
  assert.equal(shippingFee(settings, '130000000', 200000), 0);
  assert.equal(shippingFee(settings, '112300000', 200001), 0);
  assert.equal(shippingFee({ ...rates, metroManila: 0 }, '130000000', 1000), 0);
  for (const patch of [{ metroManila: -1 }, { luzon: 1.5 }, { freeShippingThreshold: 0 }])
    assert.equal(shippingSettingsSchema.safeParse({ ...rates, ...patch }).success, false);
  assert.throws(() => shippingFee(rates, '130000000', NaN));
});
test('pending shipping adjustments preserve product prices, record the reason, and send the new total', async (t) => {
  Object.assign(process.env, {
    MYSQL_HOST: 'test',
    MYSQL_PASSWORD: 'test',
    MYSQL_CA: 'test',
    BREVO_API_KEY: 'test',
    BREVO_SENDER_EMAIL: 'store@example.com',
  });
  delete process.env.ORDER_NOTIFICATION_EMAIL;
  const row = {
    id: 7,
    reference: 'LM-ABCDEF12',
    product_slug: 'first',
    product_name: 'First Tee',
    size: 'M',
    color: 'White',
    quantity: 2,
    unit_price: 69000,
    shipping: 12000,
    total: 150000,
    status: 'pending',
    customer_name: 'Test Customer',
    email: 'test@example.com',
    phone: '09123456789',
    address: '123 Test Street',
    city: 'Manila',
    postal_code: '1000',
    notes: '',
    payment_method: 'cod',
    payment_details: '',
    created_at: '2026-10-03T00:00:00Z',
  };
  let missing = false,
    failAudit = false;
  const calls: string[] = [];
  const writes: { sql: string; values: unknown[] }[] = [];
  const connection = {
    async beginTransaction() {
      calls.push('begin');
    },
    async commit() {
      calls.push('commit');
    },
    async rollback() {
      calls.push('rollback');
    },
    release() {
      calls.push('release');
    },
    async execute(sql: string, values: unknown[]) {
      if (sql.startsWith('SELECT')) {
        assert.ok(sql.includes('FOR UPDATE'));
        return [missing ? [] : [{ ...row }], []];
      }
      writes.push({ sql, values });
      if (failAudit && sql.startsWith('INSERT')) throw new Error('Audit failed');
      return [{ affectedRows: 1 }, []];
    },
  };
  t.mock.method(db(), 'getConnection', async () => connection);
  t.mock.method(db(), 'execute', async () => [{ affectedRows: 1 }, []]);
  const emails: string[] = [];
  const fetch = t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    emails.push(JSON.parse(String(init.body)).textContent);
    return new Response('{}', { status: 201 });
  });
  const input = {
    shipping: 18000,
    reason: 'Agreed courier fee',
    expectedShipping: 12000,
    expectedTotal: 150000,
  };
  assert.deepEqual(await adjustOrderShipping(row.reference, input), {
    shipping: 18000,
    total: 156000,
    emailStatus: 'sent',
  });
  assert.deepEqual(calls, ['begin', 'commit', 'release']);
  assert.deepEqual(writes[0].values, [7, 12000, 18000, 'Agreed courier fee']);
  assert.deepEqual(writes[1].values, [18000, 156000, 7]);
  assert.equal(emails.length, 1);
  assert.ok(emails[0].includes('Shipping: PHP 180.00'));
  assert.ok(emails[0].includes('Order total: PHP 1,560.00'));
  for (const status of ['paid', 'processing', 'shipped', 'cancelled']) {
    row.status = status;
    calls.length = 0;
    await assert.rejects(
      adjustOrderShipping(row.reference, input),
      (error) => error instanceof ShippingAdjustmentError && error.status === 409,
    );
    assert.deepEqual(calls, ['begin', 'rollback', 'release']);
  }
  row.status = 'pending';
  await assert.rejects(
    adjustOrderShipping(row.reference, { ...input, expectedTotal: 1 }),
    /changed/,
  );
  await assert.rejects(
    adjustOrderShipping(row.reference, { ...input, shipping: -1 }),
    /valid shipping/,
  );
  await assert.rejects(adjustOrderShipping(row.reference, { ...input, reason: '' }), /reason/);
  missing = true;
  await assert.rejects(adjustOrderShipping(row.reference, input), /not found/);
  missing = false;
  failAudit = true;
  calls.length = 0;
  await assert.rejects(adjustOrderShipping(row.reference, input), /Audit failed/);
  assert.deepEqual(calls, ['begin', 'rollback', 'release']);
  assert.equal(emails.length, 1);
  failAudit = false;
  fetch.mock.mockImplementation(async () => new Response('{}', { status: 500 }));
  assert.equal((await adjustOrderShipping(row.reference, input)).emailStatus, 'failed');
});
