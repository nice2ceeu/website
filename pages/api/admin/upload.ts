import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'node:crypto';
import { isAdmin } from '@/lib/auth';
import { sameOrigin, rateLimit, clientKey } from '@/lib/api';
import { db } from '@/lib/db';
import { MAX_IMAGE_BYTES, compressProductImage } from '@/lib/image-upload';
export const config = { api: { bodyParser: false } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isAdmin(req))) return res.status(401).json({ error: 'Sign in required.' });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!sameOrigin(req, res)) return;
  if (!rateLimit(`upload:${clientKey(req)}`, 20, 600000))
    return res.status(429).json({ error: 'Too many uploads. Try again later.' });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.headers['content-type'] || ''))
    return res.status(415).json({ error: 'Choose a JPEG, PNG, or WebP image.' });
  if (Number(req.headers['content-length']) > MAX_IMAGE_BYTES)
    return res.status(413).json({ error: 'Maximum upload size is 10 MB.' });
  let length = 0;
  const chunks: Buffer[] = [];
  try {
    for await (const chunk of req) {
      const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      length += data.length;
      if (length > MAX_IMAGE_BYTES)
        return res.status(413).json({ error: 'Maximum upload size is 10 MB.' });
      chunks.push(data);
    }
  } catch {
    return res.status(400).json({ error: 'Upload interrupted. Please try again.' });
  }
  let image;
  try {
    image = await compressProductImage(Buffer.concat(chunks));
  } catch {
    return res.status(400).json({
      error:
        'Could not process image. Use a valid, non-animated JPEG, PNG, or WebP under 10 MB and 40 megapixels.',
    });
  }
  const id = randomUUID();
  try {
    await db().execute('INSERT INTO product_images (id,data,width,height) VALUES (?,?,?,?)', [
      id,
      image.data,
      image.width,
      image.height,
    ]);
  } catch {
    return res.status(503).json({ error: 'Unable to store image. Check image database setup.' });
  }
  return res.status(201).json({
    url: `/api/product-images/${id}`,
    originalBytes: length,
    compressedBytes: image.data.length,
    width: image.width,
    height: image.height,
  });
}
