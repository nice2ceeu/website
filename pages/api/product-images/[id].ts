import type { NextApiRequest, NextApiResponse } from 'next';
import type { RowDataPacket } from 'mysql2';
import { db } from '@/lib/db';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const id = req.query.id;
  if (
    typeof id !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)
  )
    return res.status(404).end();
  try {
    const [rows] = await db().execute<RowDataPacket[]>(
      'SELECT data FROM product_images WHERE id=?',
      [id],
    );
    if (!rows[0]) return res.status(404).end();
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Length', rows[0].data.length);
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(rows[0].data);
  } catch {
    return res.status(503).end();
  }
}
