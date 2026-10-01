import test from 'node:test';
import assert from 'node:assert/strict';
import { productSlug } from '../lib/product-slug';
test('product slugs normalize names and leave room for duplicate suffixes', () => {
  assert.equal(productSlug('  Café & Cream! '), 'cafe-cream');
  assert.equal(productSlug('✨'), 'product');
  assert.equal(productSlug('Off Duty Club', 2), 'off-duty-club-2');
  const long = productSlug('a'.repeat(100), 1000);
  assert.equal(long.length, 100);
  assert.ok(long.endsWith('-1000'));
});
