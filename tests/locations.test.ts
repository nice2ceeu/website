import test from 'node:test';
import assert from 'node:assert/strict';
import { locations, resolveAddress } from '../lib/locations';

test('address selection resolves trusted names and rejects unrelated locations', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('External requests must not occur');
  });
  const input = {
    provinceCode: '042100000',
    cityCode: '042103000',
    barangayCode: '042103001',
    address: '12 Sample Street',
  };
  assert.deepEqual(await resolveAddress(input), {
    address: '12 Sample Street, Alima',
    city: 'City of Bacoor, Cavite',
  });
  await assert.rejects(resolveAddress({ ...input, cityCode: '133900000' }), /Invalid city/);
  await assert.rejects(resolveAddress({ ...input, barangayCode: '000000001' }), /Invalid barangay/);
  await assert.rejects(resolveAddress({ ...input, provinceCode: '../invalid' }), /Choose/);
  assert.ok((await locations('provinces')).some((item) => item.code === '130000000'));
  assert.ok(
    (await locations('cities', '130000000')).some((item) => item.name === 'City of Manila'),
  );
  assert.equal((await locations('barangays', '133900000')).length, 897);
  assert.equal((await locations('cities', '099701000'))[0].name, 'City of Isabela');
});
