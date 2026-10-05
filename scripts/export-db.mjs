import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ca = process.env.MYSQL_CA?.replace(/\\n/g, '\n') ||
  fs.readFileSync(process.env.MYSQL_CA_PATH, 'utf8');
const database = process.env.MYSQL_DATABASE || 'defaultdb';
const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD,
  database, ssl: { ca, rejectUnauthorized: true },
  supportBigNumbers: true, bigNumberStrings: true, dateStrings: true,
  decimalNumbers: false, jsonStrings: true,
});
const quote = name => '`' + name.replace(/`/g, '``') + '`';
const literal = value => value === null ? 'NULL' : Buffer.isBuffer(value)
  ? "X'" + value.toString('hex') + "'" : connection.escape(value);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync('exports', { recursive: true });
const output = path.resolve('exports', `${database}-${timestamp}.sql`);
const partial = output + '.partial';
const fd = fs.openSync(partial, 'wx');
const write = text => fs.writeSync(fd, text + '\n', null, 'utf8');
const counts = {};
try {
  await connection.query("SET SESSION time_zone = '+00:00'");
  await connection.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  const [objects] = await connection.query('SHOW FULL TABLES');
  const tables = objects.filter(row => row.Table_type === 'BASE TABLE').map(row => Object.values(row)[0]);
  const views = objects.filter(row => row.Table_type === 'VIEW').map(row => Object.values(row)[0]);
  const [engines] = await connection.query('SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = ?', [database, 'BASE TABLE']);
  if (engines.some(row => row.ENGINE !== 'InnoDB')) throw new Error('Consistent export requires all tables to use InnoDB');
  write(`-- Database export: ${database}\n-- Created: ${new Date().toISOString()}\n-- Select the destination database before importing.\nSET NAMES utf8mb4;\nSET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;\nSET FOREIGN_KEY_CHECKS=0;\nSET @OLD_SQL_MODE=@@SQL_MODE;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO,ANSI_QUOTES';\nSET @OLD_TIME_ZONE=@@TIME_ZONE;\nSET time_zone='+00:00';`);
  for (const view of views) write(`DROP VIEW IF EXISTS ${quote(view)};`);
  for (const table of tables) {
    const [ddl] = await connection.query(`SHOW CREATE TABLE ${quote(table)}`);
    write(`\nDROP TABLE IF EXISTS ${quote(table)};\n${ddl[0]['Create Table']};`);
    const [columns] = await connection.query(`SHOW FULL COLUMNS FROM ${quote(table)}`);
    const names = columns.filter(col => !/VIRTUAL GENERATED|STORED GENERATED/.test(col.Extra)).map(col => col.Field);
    const [rows] = await connection.query({ sql: `SELECT ${names.map(quote).join(',')} FROM ${quote(table)}`, rowsAsArray: true });
    counts[table] = rows.length;
    for (const row of rows) write(`INSERT INTO ${quote(table)} (${names.map(quote).join(',')}) VALUES (${row.map(literal).join(',')});`);
  }
  for (const view of views) {
    const [ddl] = await connection.query(`SHOW CREATE VIEW ${quote(view)}`);
    write(`\n${ddl[0]['Create View']};`);
  }
  const [routines] = await connection.query('SELECT ROUTINE_NAME, ROUTINE_TYPE FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ?', [database]);
  const [triggers] = await connection.query('SHOW TRIGGERS');
  const [events] = await connection.query('SHOW EVENTS');
  for (const item of [
    ...routines.map(r => ({ type: r.ROUTINE_TYPE, name: r.ROUTINE_NAME, key: `Create ${r.ROUTINE_TYPE.toLowerCase()}` })),
    ...triggers.map(r => ({ type: 'TRIGGER', name: r.Trigger, key: 'SQL Original Statement' })),
    ...events.map(r => ({ type: 'EVENT', name: r.Name, key: 'Create Event' })),
  ]) {
    const [ddl] = await connection.query(`SHOW CREATE ${item.type} ${quote(item.name)}`);
    if (!ddl[0][item.key]) throw new Error(`Cannot read definition for ${item.type} ${item.name}`);
    write(`\nDROP ${item.type} IF EXISTS ${quote(item.name)};\nDELIMITER ;;\n${ddl[0][item.key]};;\nDELIMITER ;`);
  }
  write('\nSET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;\nSET SQL_MODE=@OLD_SQL_MODE;\nSET time_zone=@OLD_TIME_ZONE;');
  await connection.commit();
  fs.closeSync(fd);
  fs.renameSync(partial, output);
  const bytes = fs.readFileSync(output);
  const manifest = { database, createdAt: new Date().toISOString(), file: path.basename(output), bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), tables: counts, views: views.length, routines: routines.length, triggers: triggers.length, events: events.length };
  fs.writeFileSync(output + '.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ output, ...manifest }, null, 2));
} catch (error) {
  try { fs.closeSync(fd); } catch {}
  await connection.rollback().catch(() => {});
  console.error(`Export failed: ${error.code || error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
