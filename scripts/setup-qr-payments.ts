import { db } from '../lib/db';
async function main() {
  const pool = db();
  try {
    for (const statement of [
      'ALTER TABLE payment_settings ADD COLUMN qr_enabled BOOLEAN NOT NULL DEFAULT FALSE',
      'ALTER TABLE payment_settings ADD COLUMN qr_details TEXT NULL',
      "ALTER TABLE payment_settings ADD COLUMN qr_image_url VARCHAR(2000) NOT NULL DEFAULT ''",
    ]) {
      try {
        await pool.query(statement);
      } catch (error) {
        if ((error as { code?: string }).code !== 'ER_DUP_FIELDNAME') throw error;
      }
    }
    await pool.query(
      "ALTER TABLE orders MODIFY COLUMN payment_method ENUM('gcash','bank','cod','qr') NOT NULL DEFAULT 'cod'",
    );
    console.log('QR payment schema is ready.');
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  console.error('Unable to migrate QR payments. Check database connectivity and permissions.');
  process.exitCode = 1;
});
