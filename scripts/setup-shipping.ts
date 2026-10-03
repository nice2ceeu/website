import fs from 'node:fs';
import { db } from '../lib/db';
async function main() {
  const pool = db();
  try {
    for (const file of ['shipping-settings-schema.sql', 'shipping-adjustments-schema.sql']) {
      await pool.query(fs.readFileSync(`scripts/${file}`, 'utf8'));
    }
    await pool.execute('INSERT IGNORE INTO shipping_settings (id) VALUES (1)');
    console.log(
      'Shipping settings and adjustment history are ready. Existing order fees are unchanged.',
    );
  } finally {
    await pool.end();
  }
}
main().catch((error) => {
  console.error('Shipping setup failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
