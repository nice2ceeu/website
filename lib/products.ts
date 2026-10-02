import type { RowDataPacket } from 'mysql2';
import { db, configured } from './db';
import { sizes, type Product } from './catalog';

export function fromRow(row: RowDataPacket): Product {
  const storedSizes: string[] = typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    caption: row.caption,
    price: row.price,
    color: row.color,
    imageUrl: row.image_url,
    availableSizes: storedSizes.filter((size) => sizes.some((supported) => supported === size)),
    active: Boolean(row.active),
    design: row.design,
    ink: row.ink,
    bg: row.bg,
    sub: row.subtitle,
    tag: row.tag,
  };
}
export async function getProducts(includeInactive = false): Promise<Product[]> {
  if (!configured()) throw new Error('Product database is not configured.');
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT * FROM products WHERE deleted_at IS NULL${includeInactive ? '' : ' AND active = TRUE'} ORDER BY id`,
  );
  return rows.map(fromRow);
}
export async function getProduct(slug: string): Promise<Product | null> {
  if (!configured()) throw new Error('Product database is not configured.');
  const [rows] = await db().execute<RowDataPacket[]>(
    'SELECT * FROM products WHERE slug=? AND active=TRUE AND deleted_at IS NULL',
    [slug],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}
