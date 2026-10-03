import test from 'node:test';
import assert from 'node:assert/strict';
import { readOrderItems } from '../lib/order-items';
const old = {
  product_slug: 'old',
  product_name: 'Original Tee',
  size: 'M',
  color: 'White',
  quantity: 2,
  unit_price: 69000,
};
const items = [
  {
    productSlug: 'first',
    productName: 'First Tee',
    size: 'S',
    color: 'Butter',
    quantity: 1,
    unitPrice: 50000,
  },
  {
    productSlug: 'second',
    productName: 'Second Tee',
    size: 'L',
    color: 'White',
    quantity: 2,
    unitPrice: 69000,
  },
];
test('existing orders remain readable with their saved product and price', () => {
  assert.deepEqual(readOrderItems(old), [
    {
      productSlug: 'old',
      productName: 'Original Tee',
      size: 'M',
      color: 'White',
      quantity: 2,
      unitPrice: 69000,
    },
  ]);
  assert.deepEqual(readOrderItems({ ...old, items: null }), readOrderItems(old));
});
test('order item lists read JSON strings and parsed database JSON without consulting live products', () => {
  assert.deepEqual(readOrderItems({ ...old, items }), items);
  assert.deepEqual(readOrderItems({ ...old, items: JSON.stringify(items) }), items);
  assert.throws(() => readOrderItems({ ...old, items: 'invalid' }));
  assert.throws(() => readOrderItems({ ...old, items: [] }));
});
