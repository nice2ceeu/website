import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { uploadToCloudinary } from '../lib/cloudinary';
test('uploads signed image bytes to Cloudinary without exposing the secret', async (t) => {
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'https://api.cloudinary.com/v1_1/test-cloud/image/upload');
    const form = options.body as FormData;
    assert.equal(form.get('api_key'), 'test-key');
    assert.equal(form.get('api_secret'), null);
    assert.equal(
      form.get('signature'),
      createHash('sha256')
        .update(
          `overwrite=false&public_id=lightmare/products/test&timestamp=${form.get('timestamp')}test-secret`,
        )
        .digest('hex'),
    );
    assert.ok(form.get('file') instanceof Blob);
    return Response.json({
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/test.webp',
      public_id: 'lightmare/products/test',
    });
  });
  assert.ok(
    (await uploadToCloudinary(Buffer.from('test'), 'lightmare/products/test')).url.startsWith(
      'https://res.cloudinary.com/',
    ),
  );
});
test('missing credentials fail before sending any image', async () => {
  const secret = process.env.CLOUDINARY_API_SECRET;
  delete process.env.CLOUDINARY_API_SECRET;
  try {
    await assert.rejects(uploadToCloudinary(Buffer.from('test')), /Configure/);
  } finally {
    if (secret) process.env.CLOUDINARY_API_SECRET = secret;
  }
});
