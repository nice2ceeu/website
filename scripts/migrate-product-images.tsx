import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { RowDataPacket } from 'mysql2';
import { db } from '../lib/db';
import Tee from './fixtures/Tee';
import type { Product } from '../lib/catalog';
import { compressProductImage } from '../lib/image-upload';

async function migrate() {
  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE deleted_at IS NULL FOR UPDATE',
    );
    let migrated = 0;
    for (const row of rows) {
      if (String(row.image_url).startsWith('/api/product-images/')) continue;
      let input: Buffer;
      if (/^\/images\/[a-zA-Z0-9_-]+\.png$/.test(row.image_url))
        input = readFileSync(`public${row.image_url}`);
      else if (!row.image_url) {
        const product = { ...row, sub: row.subtitle } as Product;
        const svg = renderToStaticMarkup(<Tee product={product} />).replace(
          '<svg',
          '<svg xmlns="http://www.w3.org/2000/svg" width="880" height="920"',
        );
        input = await sharp(Buffer.from(svg)).png().toBuffer();
      } else continue;
      const image = await compressProductImage(input);
      const id = randomUUID();
      await connection.execute(
        'INSERT INTO product_images (id,data,width,height) VALUES (?,?,?,?)',
        [id, image.data, image.width, image.height],
      );
      await connection.execute('UPDATE products SET image_url=? WHERE id=?', [
        `/api/product-images/${id}`,
        row.id,
      ]);
      migrated++;
    }
    await connection.commit();
    const [result] = await connection.query<RowDataPacket[]>(
      'SELECT name,image_url FROM products WHERE deleted_at IS NULL',
    );
    console.log(JSON.stringify({ migrated, products: result }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
migrate()
  .catch((error) => {
    console.error('Migration failed:', error.code || error.message);
    process.exitCode = 1;
  })
  .finally(() => db().end());
