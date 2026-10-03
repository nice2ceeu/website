import test from 'node:test';
import assert from 'node:assert/strict';
import { priceCart } from '../lib/cart-validation';
import { orderSchema } from '../lib/validation';
import { store } from '../lib/catalog';
import { products } from '../scripts/fixtures/products';
const customer = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '09123456789',
  address: '123 Test Street',
  city: 'Manila',
  postalCode: '1000',
  notes: '',
  paymentMethod: 'cod',
  consent: true,
  idempotencyKey: 'c74bf539-9671-4e20-b413-ca7cd8356073',
};
const item = { productSlug: products[0].slug, color: products[0].color, size: 'M', quantity: 2 };
test('cart trusts catalog prices and charges shipping once across products and sizes', () => {
  const orders = priceCart(
    {
      ...customer,
      total: 1,
      items: [
        { ...item, unitPrice: 1 },
        { ...item, size: 'L' },
        { ...item, productSlug: products[1].slug, color: products[1].color },
      ],
    },
    products,
  );
  assert.equal(orders.length, 3);
  assert.equal(
    orders.reduce((sum, order) => sum + order.shipping, 0),
    store.shipping,
  );
  assert.equal(
    orders.reduce((sum, order) => sum + order.total, 0),
    products[0].price * 4 + products[1].price * 2 + store.shipping,
  );
  for (const order of orders) assert.ok(orderSchema.safeParse(order).success);
});
test('cart merges duplicate variants and rejects quantities over the per-size limit', () => {
  assert.equal(priceCart({ ...customer, items: [item, item] }, products)[0].quantity, 4);
  assert.throws(() =>
    priceCart(
      {
        ...customer,
        items: [
          { ...item, quantity: 6 },
          { ...item, quantity: 5 },
        ],
      },
      products,
    ),
  );
});
test('cart rejects empty or oversized carts, inactive products, unavailable sizes, and invalid customer data', () => {
  for (const patch of [
    { items: [] },
    { items: Array.from({ length: 21 }, () => item) },
    { items: [{ ...item, productSlug: 'missing' }] },
    { items: [{ ...item, size: 'XXXL' }] },
    { consent: false },
    { paymentMethod: 'crypto' },
  ]) {
    assert.throws(() => priceCart({ ...customer, items: [item], ...patch }, products));
  }
  assert.throws(() =>
    priceCart(
      { ...customer, items: [item] },
      products.map((product) => ({ ...product, active: false })),
    ),
  );
  assert.throws(() =>
    priceCart(
      { ...customer, items: [item] },
      products.map((product) => ({ ...product, availableSizes: ['S'] })),
    ),
  );
});
test('cart pricing preserves one checkout key across its item snapshots', () => {
  const orders = priceCart({ ...customer, items: [item, { ...item, size: 'L' }] }, products);
  assert.ok(orders.every((order) => order.idempotencyKey === customer.idempotencyKey));
});
