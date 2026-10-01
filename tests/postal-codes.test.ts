import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestedPostalCode } from '../lib/postal-codes';
import dataset from '../data/addresses/postal-codes.json';
import addresses from '../data/addresses/philippines.json';
test('postal suggestions use exact city codes and leave unknown areas blank', () => {
  assert.equal(suggestedPostalCode('042103000'), '4102');
  assert.equal(suggestedPostalCode('042100000'), '');
  assert.equal(suggestedPostalCode('133900000'), '');
  assert.equal(suggestedPostalCode(''), '');
  assert.equal(suggestedPostalCode('999999999'), '');
  const cities = new Set(
    Object.values(addresses.cities)
      .flat()
      .map((city) => city.code),
  );
  for (const [city, zip] of Object.entries(dataset.cities)) {
    assert.ok(cities.has(city));
    assert.match(zip, /^\d{4}$/);
  }
});
