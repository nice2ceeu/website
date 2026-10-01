import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../lib/db';
import { cloudinaryConfig, uploadToCloudinary } from '../lib/cloudinary';
import { compressProductImage } from '../lib/image-upload';

async function migrate() {
  cloudinaryConfig();
  const [rows] = await db().query<RowDataPacket[]>(
    'SELECT id,image_url FROM products WHERE image_url <> ?',
    [''],
  );
  let migrated = 0;
  for (const row of rows) {
    if (row.image_url.startsWith('https://res.cloudinary.com/')) continue;
    let data: Buffer;
    const match = row.image_url.match(/^\/api\/product-images\/([a-f0-9-]{36})$/);
    if (match) {
      const [images] = await db().execute<RowDataPacket[]>(
        'SELECT data FROM product_images WHERE id=?',
        [match[1]],
      );
      if (!images[0]) throw new Error(`Missing image for product ${row.id}.`);
      data = images[0].data;
    } else if (row.image_url.startsWith('/images/')) {
      const root = path.resolve('public/images');
      const file = path.resolve('public', row.image_url.slice(1));
      if (!file.startsWith(root + path.sep)) throw new Error('Invalid image path.');
      data = (await compressProductImage(readFileSync(file))).data;
    } else {
      console.log(
        `Skipped external image for product ${row.id}; upload its file through Products.`,
      );
      continue;
    }
    const uploaded = await uploadToCloudinary(
      data,
      `lightmare/products/migrated-${row.id}-${match?.[1] || 'local'}`,
    );
    const [result] = await db().execute<ResultSetHeader>(
      'UPDATE products SET image_url=? WHERE id=? AND image_url=?',
      [uploaded.url, row.id, row.image_url],
    );
    if (result.affectedRows) migrated++;
  }
  console.log(
    `Migrated ${migrated} product images to Cloudinary. Original images retained for rollback.`,
  );
}
migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.MYSQL_HOST && process.env.MYSQL_PASSWORD) await db().end();
  });
