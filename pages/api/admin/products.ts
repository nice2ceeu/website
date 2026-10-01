import type { NextApiRequest, NextApiResponse } from 'next';
import type { ResultSetHeader } from 'mysql2';
import { isAdmin } from '@/lib/auth';
import { sameOrigin } from '@/lib/api';
import { db } from '@/lib/db';
import { productPage } from '@/lib/list-data';
import { productSchema } from '@/lib/product-validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isAdmin(req))) return res.status(401).json({ error: 'Sign in required.' });
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).end();
  }
  if (req.method !== 'GET' && !sameOrigin(req, res)) return;
  try {
    if (req.method === 'GET') return res.json(await productPage(req.query, true));
    const id = Number(req.query.id);
    if (req.method !== 'POST' && (!Number.isSafeInteger(id) || id < 1))
      return res.status(400).json({ error: 'Invalid product ID.' });
    if (req.method === 'DELETE') {
      const [result] = await db().execute<ResultSetHeader>(
        'UPDATE products SET deleted_at=CURRENT_TIMESTAMP,active=FALSE WHERE id=? AND deleted_at IS NULL',
        [id],
      );
      return result.affectedRows
        ? res.json({ ok: true })
        : res.status(404).json({ error: 'Product not found.' });
    }
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid product details.' });
    const p = parsed.data;
    const values = [
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
    ];
    if (req.method === 'POST') {
      const [result] = await db().execute<ResultSetHeader>(
        'INSERT INTO products (slug,name,caption,price,color,image_url,sizes,active,design,ink,bg,subtitle,tag) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        values,
      );
      return res.status(201).json({ id: result.insertId });
    }
    const [result] = await db().execute<ResultSetHeader>(
      'UPDATE products SET slug=?,name=?,caption=?,price=?,color=?,image_url=?,sizes=?,active=?,design=?,ink=?,bg=?,subtitle=?,tag=? WHERE id=? AND deleted_at IS NULL',
      [...values, id],
    );
    return result.affectedRows
      ? res.json({ ok: true })
      : res.status(404).json({ error: 'Product not found.' });
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY')
      return res.status(409).json({
        error: 'This URL slug is already used, including by a deleted product. Choose another.',
      });
    return res.status(503).json({
      error: 'Unable to update products. Check the database connection and product setup.',
    });
  }
}
