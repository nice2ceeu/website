import mysql from 'mysql2/promise';
import fs from 'node:fs';
for (const key of ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD'])
  if (!process.env[key]) throw new Error(`Missing ${key}`);
const ca =
  process.env.MYSQL_CA?.replace(/\\n/g, '\n') ||
  (process.env.MYSQL_CA_PATH ? fs.readFileSync(process.env.MYSQL_CA_PATH, 'utf8') : undefined);
if (!ca) throw new Error('Set MYSQL_CA_PATH or MYSQL_CA to your Aiven CA certificate');
const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'defaultdb',
  ssl: { ca, rejectUnauthorized: true },
});
try {
  await connection.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  await connection.query(fs.readFileSync(new URL('./admin-schema.sql', import.meta.url), 'utf8'));
  await connection.query(fs.readFileSync(new URL('./product-schema.sql', import.meta.url), 'utf8'));
  await connection.query(fs.readFileSync(new URL('./cms-schema.sql', import.meta.url), 'utf8'));
  await connection.query(fs.readFileSync(new URL('./image-schema.sql', import.meta.url), 'utf8'));
  await connection.query(fs.readFileSync(new URL('./payment-schema.sql', import.meta.url), 'utf8'));
  await connection.query(
    fs.readFileSync(new URL('./shipping-settings-schema.sql', import.meta.url), 'utf8'),
  );
  await connection.query(
    fs.readFileSync(new URL('./shipping-adjustments-schema.sql', import.meta.url), 'utf8'),
  );
  await connection.execute('INSERT IGNORE INTO shipping_settings (id) VALUES (1)');
  for (const statement of [
    'ALTER TABLE orders ADD COLUMN items JSON NULL AFTER total',
    "ALTER TABLE orders ADD COLUMN payment_method ENUM('gcash','bank','cod') NOT NULL DEFAULT 'cod' AFTER notes",
    'ALTER TABLE orders ADD COLUMN payment_details TEXT NOT NULL AFTER payment_method',
  ]) {
    try {
      await connection.query(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') throw error;
    }
  }
  await connection.execute(
    'INSERT IGNORE INTO payment_settings (id,gcash_details,bank_details) VALUES (1,?,?)',
    ['', ''],
  );
  console.log('Lightmare PH orders and admins tables are ready. No dummy data was inserted.');
} finally {
  await connection.end();
}
