import type { RowDataPacket } from 'mysql2';
import { db } from '../lib/db';

function rebrand(value: string) {
  if (value.includes('@') || /^https?:\/\//i.test(value)) return value;
  return value.replace(/\bLightmare\b(?!\s+PH)/gi, (name) =>
    name === name.toUpperCase() ? 'LIGHTMARE PH' : 'Lightmare PH',
  );
}

function rebrandContent(value: unknown): unknown {
  if (typeof value === 'string') return rebrand(value);
  if (Array.isArray(value)) return value.map(rebrandContent);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, rebrandContent(entry)]),
    );
  }
  return value;
}

async function run() {
  const connection = db();
  const [contentRows] = await connection.execute<RowDataPacket[]>(
    'SELECT page_key, content FROM site_content',
  );

  for (const row of contentRows) {
    const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    const updated = rebrandContent(content);
    if (JSON.stringify(updated) !== JSON.stringify(content)) {
      await connection.execute(
        'UPDATE site_content SET content=?, revision=revision+1 WHERE page_key=?',
        [JSON.stringify(updated), row.page_key],
      );
    }
  }

  const [paymentRows] = await connection.execute<RowDataPacket[]>(
    'SELECT gcash_details, bank_details FROM payment_settings WHERE id=1',
  );
  if (paymentRows[0]) {
    const gcashDetails = rebrand(String(paymentRows[0].gcash_details || ''));
    const bankDetails = rebrand(String(paymentRows[0].bank_details || ''));
    if (
      gcashDetails !== paymentRows[0].gcash_details ||
      bankDetails !== paymentRows[0].bank_details
    ) {
      await connection.execute(
        `UPDATE payment_settings
         SET gcash_details=?, bank_details=?, revision=revision+1
         WHERE id=1`,
        [gcashDetails, bankDetails],
      );
    }
  }

  console.log('Saved storefront content now uses Lightmare PH.');
}

run()
  .catch((error) => {
    console.error(
      'Rebrand failed:',
      error instanceof Error ? error.message : 'configuration error',
    );
    process.exitCode = 1;
  })
  .finally(() => db().end());
