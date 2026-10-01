import { db } from '../lib/db';
import { sizes } from '../lib/catalog';
import { products } from './fixtures/products';
import { readFileSync } from 'node:fs';
async function setup() {
  await db().query(readFileSync('scripts/product-schema.sql', 'utf8'));
  for (const p of products)
    await db().execute(
      'INSERT INTO products (slug,name,caption,price,color,image_url,sizes,design,ink,bg,subtitle,tag) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
      [
        p.slug,
        p.name,
        p.caption,
        p.price,
        p.color,
        p.slug === 'off-duty' ? '/images/off-duty.png' : '',
        JSON.stringify(sizes),
        p.design,
        p.ink,
        p.bg,
        p.sub,
        p.tag,
      ],
    );
  console.log('Products table ready. Existing products were preserved.');
}
setup()
  .catch((error) => {
    console.error('Product setup failed:', error.code || 'configuration error');
    process.exitCode = 1;
  })
  .finally(() => db().end());
