import mysql, { Pool } from 'mysql2/promise';
import fs from 'node:fs';
const globalDb = globalThis as typeof globalThis & { mysqlPool?: Pool };
export function configured() {
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_PASSWORD);
}
export function db() {
  if (!configured()) throw new Error('Database is not configured');
  if (!globalDb.mysqlPool) {
    const ca =
      process.env.MYSQL_CA?.replace(/\\n/g, '\n') ||
      (process.env.MYSQL_CA_PATH ? fs.readFileSync(process.env.MYSQL_CA_PATH, 'utf8') : undefined);
    if (!ca) throw new Error('Aiven CA certificate is required');
    globalDb.mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'defaultdb',
      ssl: { ca, rejectUnauthorized: true },
      connectionLimit: 5,
      waitForConnections: true,
      connectTimeout: 10000,
    });
  }
  return globalDb.mysqlPool;
}
