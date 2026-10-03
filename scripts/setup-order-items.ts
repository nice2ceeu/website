import { db } from '../lib/db';
async function main() {
  const pool = db();
  try {
    try {
      await pool.query('ALTER TABLE orders ADD COLUMN items JSON NULL AFTER total');
      console.log('Order item lists are ready. Existing orders were preserved.');
    } catch (error) {
      if ((error as { code?: string }).code !== 'ER_DUP_FIELDNAME') throw error;
      console.log('Order item lists are already configured.');
    }
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error(
    'Order item migration failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
});
