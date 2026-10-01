import test from 'node:test';
import assert from 'node:assert/strict';
import { pagination, pageNumber, pageLinks, canonicalPage } from '../lib/pagination';
import { productPage, orderPage } from '../lib/list-data';
import { db } from '../lib/db';
test('pagination handles exact boundaries, empty results and invalid pages', () => {
  assert.deepEqual(pagination(21, 9), { page: 3, pages: 3, total: 21, pageSize: 10, offset: 20 });
  assert.equal(pagination(20, 3).page, 2);
  assert.equal(pagination(0, 5).page, 1);
  for (const input of ['0', '-1', '1.5', 'abc', '999999999999999999999'])
    assert.equal(pageNumber(input), 1);
  assert.deepEqual(pageLinks(5, 10), [1, 3, 4, 5, 6, 7, 10]);
  assert.equal(
    canonicalPage('/shop', { q: 'moon', color: 'Sage', page: '9' }, 2),
    '/shop?q=moon&color=Sage&page=2',
  );
});
test('database searches use parameters, stable ordering, counts and limit/offset', async (t) => {
  process.env.MYSQL_HOST = 'test';
  process.env.MYSQL_PASSWORD = 'test';
  process.env.MYSQL_CA = 'test';
  const calls: { sql: string; values: unknown[] }[] = [];
  t.mock.method(db(), 'query', async (sql: string, values: unknown[] = []) => {
    calls.push({ sql, values });
    return [sql.includes('COUNT(*)') ? [{ total: 23, published: 20 }] : [], []];
  });
  const result = await productPage({ q: "%' OR 1=1", page: '3' }, true);
  assert.equal(result.paging.page, 3);
  assert.equal(result.paging.total, 23);
  assert.ok(!calls[0].sql.includes('OR 1=1'));
  assert.ok(String(calls[0].values[0]).includes('!%'));
  assert.match(calls[1].sql, /ORDER BY id DESC LIMIT \? OFFSET \?/);
  assert.deepEqual(calls[1].values.slice(-2), [10, 20]);
  calls.length = 0;
  await orderPage({ q: 'Alex', status: 'paid', page: '100' });
  assert.match(calls[0].sql, /status=\?/);
  assert.ok(calls[0].values.includes('paid'));
  assert.match(calls[1].sql, /created_at DESC,id DESC/);
  assert.deepEqual(calls[1].values.slice(-2), [10, 20]);
});
