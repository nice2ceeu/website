import { existsSync } from 'node:fs';
import type { RowDataPacket } from 'mysql2';
import { db } from '../lib/db';
import { productSchema } from '../lib/product-validation';
import { sizes } from '../lib/catalog';

const samples = [
  {
    slug: 'after-hours',
    name: 'After Hours',
    caption:
      'For late-night playlists and plans that run past midnight. A washed-charcoal tee with a moon-and-stars graphic. Sample product with an AI-generated design mockup.',
    price: 79000,
    color: 'Washed charcoal',
    imageUrl: '/images/after-hours-sample.png',
    ink: '#e5cf8d',
    bg: '#e8dfd0',
  },
  {
    slug: 'slow-mornings',
    name: 'Slow Mornings',
    caption:
      'Take your time. A sage tee with a delicate daisy graphic for coffee runs and easy weekends. Sample product with an AI-generated design mockup.',
    price: 75000,
    color: 'Sage',
    imageUrl: '/images/slow-mornings-sample.png',
    ink: '#f4ebce',
    bg: '#eeebe2',
  },
].map((product) =>
  productSchema.parse({
    ...product,
    availableSizes: [...sizes],
    active: true,
    design: 'off duty',
    sub: 'LIGHTMARE PH',
    tag: 'SAMPLE COLLECTION',
  }),
);

async function seed() {
  for (const product of samples)
    if (!existsSync(`public${product.imageUrl}`)) throw new Error('Missing product image');
  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    for (const p of samples) {
      const [existing] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM products WHERE slug=?',
        [p.slug],
      );
      if (existing.length)
        throw new Error('Sample slug already exists; existing products were preserved');
      await connection.execute(
        'INSERT INTO products (slug,name,caption,price,color,image_url,sizes,active,design,ink,bg,subtitle,tag) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          p.slug,
          p.name,
          p.caption,
          p.price,
          p.color,
          p.imageUrl,
          JSON.stringify(p.availableSizes),
          p.active,
          p.design,
          p.ink,
          p.bg,
          p.sub,
          p.tag,
        ],
      );
    }
    await connection.commit();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT slug,name,price,color,image_url,active FROM products WHERE slug IN (?,?)',
      samples.map((p) => p.slug),
    );
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
seed()
  .catch((error) => {
    console.error('Sample product insert failed:', error.code || error.message);
    process.exitCode = 1;
  })
  .finally(() => db().end());
