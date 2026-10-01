import sharp from 'sharp';
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export async function compressProductImage(input: Buffer) {
  if (!input.length || input.length > MAX_IMAGE_BYTES)
    throw new Error('Image must be between 1 byte and 10 MB.');
  const image = sharp(input, { limitInputPixels: 40_000_000, failOn: 'warning' });
  const metadata = await image.metadata();
  if (!['jpeg', 'png', 'webp'].includes(metadata.format || '') || (metadata.pages || 1) > 1)
    throw new Error('Choose a non-animated JPEG, PNG, or WebP image.');
  const { data, info } = await image
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  if (data.length > 2 * 1024 * 1024)
    throw new Error('Image is too complex to compress. Choose a smaller image.');
  return { data, width: info.width, height: info.height };
}
