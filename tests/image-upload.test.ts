import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { compressProductImage, MAX_IMAGE_BYTES } from '../lib/image-upload';
test('uploads are resized and encoded as WebP', async () => {
  const input = await sharp({
    create: { width: 2200, height: 1100, channels: 3, background: '#702c3c' },
  })
    .png()
    .toBuffer();
  const result = await compressProductImage(input);
  assert.equal(result.width, 1600);
  assert.equal(result.height, 800);
  assert.equal((await sharp(result.data).metadata()).format, 'webp');
  assert.ok(result.data.length < input.length);
});
test('reject empty, oversized, corrupt, and SVG uploads', async () => {
  for (const input of [
    Buffer.alloc(0),
    Buffer.alloc(MAX_IMAGE_BYTES + 1),
    Buffer.from('not an image'),
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
    ),
  ])
    await assert.rejects(compressProductImage(input));
});
