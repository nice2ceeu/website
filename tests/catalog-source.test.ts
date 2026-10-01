import test from 'node:test';
import assert from 'node:assert/strict';
import { getProducts, getProduct } from '../lib/products';
test('catalog refuses to render hardcoded samples when database is unconfigured', async () => {
  const host = process.env.MYSQL_HOST,
    password = process.env.MYSQL_PASSWORD;
  delete process.env.MYSQL_HOST;
  delete process.env.MYSQL_PASSWORD;
  try {
    await assert.rejects(getProducts(), /not configured/);
    await assert.rejects(getProduct('off-duty'), /not configured/);
  } finally {
    if (host !== undefined) process.env.MYSQL_HOST = host;
    if (password !== undefined) process.env.MYSQL_PASSWORD = password;
  }
});
