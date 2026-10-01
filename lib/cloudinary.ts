import { createHash, randomUUID } from 'node:crypto';

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret || !/^[a-zA-Z0-9_-]+$/.test(cloudName))
    throw new Error(
      'Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    );
  return { cloudName, apiKey, apiSecret };
}

export async function uploadToCloudinary(
  data: Buffer,
  publicId = `lightmare/products/${randomUUID()}`,
) {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash('sha256')
    .update(`overwrite=false&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');
  const form = new FormData();
  form.set('file', new Blob([new Uint8Array(data)], { type: 'image/webp' }), 'product.webp');
  form.set('public_id', publicId);
  form.set('overwrite', 'false');
  form.set('timestamp', timestamp);
  form.set('api_key', apiKey);
  form.set('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.error?.message === 'string' ? body.error.message : '';
    // Classify rather than logging raw provider messages, which can echo credentials/signatures.
    const reason = /unknown api_key|invalid api_key|api key/i.test(message)
      ? 'API key rejected. Check CLOUDINARY_API_KEY belongs to CLOUDINARY_CLOUD_NAME.'
      : /signature/i.test(message)
        ? 'Signature rejected. Check CLOUDINARY_API_SECRET matches the configured API key.'
        : /timestamp|stale/i.test(message)
          ? 'Request timestamp rejected. Check the computer clock.'
          : /cloud name|cloud_name/i.test(message)
            ? 'Cloud name rejected. Check CLOUDINARY_CLOUD_NAME.'
            : response.status === 401
              ? 'Authentication rejected. Check the cloud name, API key and API secret belong to the same product environment.'
              : 'The provider rejected the request. Check your Cloudinary account configuration.';
    throw new Error(`Cloudinary upload failed (${response.status}). ${reason}`);
  }
  const result = await response.json();
  if (
    typeof result.secure_url !== 'string' ||
    !result.secure_url.startsWith('https://res.cloudinary.com/') ||
    result.public_id !== publicId
  )
    throw new Error('Cloudinary returned an invalid image response.');
  return { url: result.secure_url as string, publicId: result.public_id as string };
}
