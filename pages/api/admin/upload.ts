import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin } from '@/lib/auth';
import { sameOrigin, rateLimit, clientKey } from '@/lib/api';
import { cloudinaryConfig, uploadToCloudinary } from '@/lib/cloudinary';
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
  try {
    cloudinaryConfig();
  } catch {
    return res
      .status(503)
      .json({ error: 'Cloudinary is not configured. Set the Cloudinary environment variables.' });
  }
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
  let uploaded;
  try {
    uploaded = await uploadToCloudinary(image.data);
  } catch {
    return res.status(503).json({
      error: 'Unable to upload image to Cloudinary. Check the service configuration and try again.',
    });
  }
  return res.status(201).json({
    url: uploaded.url,
    originalBytes: length,
    compressedBytes: image.data.length,
    width: image.width,
    height: image.height,
  });
}
