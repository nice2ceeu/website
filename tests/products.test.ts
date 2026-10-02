import test from 'node:test';
import assert from 'node:assert/strict';
import { productSchema } from '../lib/product-validation';
import { priceOrder } from '../lib/validation';
import { sizes, type Product } from '../lib/catalog';
import { products } from '../scripts/fixtures/products';
import { fromRow } from '../lib/products';
import type { RowDataPacket } from 'mysql2';
const product: Product = {
  ...products[0],
  price: 82550,
  imageUrl: '/images/off-duty.png',
  availableSizes: ['S', 'M'],
  active: true,
};
test('existing product records omit retired XS sizes', () => {
  for (const storedSizes of [['XS', 'S', 'M'], JSON.stringify(['XS', 'S', 'M'])]) {
    assert.deepEqual(fromRow({ sizes: storedSizes } as RowDataPacket).availableSizes, ['S', 'M']);
  }
});
test('product input validates prices, sizes and image URLs', () => {
  assert.ok(productSchema.safeParse(product).success);
  for (const patch of [
    { price: -1 },
    { price: 1.5 },
    { availableSizes: [] },
    { availableSizes: ['XS'] },
    { availableSizes: ['M', 'M'] },
    { slug: '../test' },
    { imageUrl: 'javascript:alert(1)' },
    { imageUrl: '//evil.test/x' },
    { bg: 'red' },
  ])
    assert.equal(productSchema.safeParse({ ...product, ...patch }).success, false);
  assert.ok(
    productSchema.safeParse({
      ...product,
      imageUrl: 'https://example.com/tee.jpg',
      availableSizes: [...sizes],
    }).success,
  );
});
test('orders use database catalog prices and reject hidden, deleted or unavailable variants', () => {
  const input = {
    productSlug: product.slug,
    size: 'M',
    color: product.color,
    quantity: 2,
    name: 'Sample Customer',
    email: 'sample@example.com',
    phone: '09123456789',
    address: '123 Example Street',
    city: 'Manila',
    postalCode: '1000',
    notes: '',
    paymentMethod: 'cod' as const,
    consent: true,
    idempotencyKey: 'c74bf539-9671-4e20-b413-ca7cd8356073',
  };
  const priced = priceOrder(input, [product]);
  assert.equal(priced.unitPrice, 82550);
  assert.equal(priced.total, 177100);
  assert.throws(() => priceOrder(input, []));
  assert.throws(() => priceOrder(input, [{ ...product, active: false }]));
  assert.throws(() => priceOrder({ ...input, size: 'XL' }, [product]));
  assert.throws(() =>
    priceOrder({ ...input, size: 'XS' }, [{ ...product, availableSizes: ['XS', 'M'] }]),
  );
});
