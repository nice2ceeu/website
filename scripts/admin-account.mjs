import mysql from 'mysql2/promise';
import fs from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { z } from 'zod';

if (!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal.');
const mode = process.argv[2];
if (!['create', 'reset'].includes(mode)) throw new Error('Use admin:create or admin:reset.');
const rl = createInterface({ input: process.stdin, output: process.stdout });
const email = z
  .email()
  .max(200)
  .parse((await rl.question('Admin email: ')).trim().toLowerCase());
rl.close();
function readPassword(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let value = '';
    function finish(error) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    }
    function onData(chunk) {
      for (const char of chunk) {
        if (char === '\u0003') return finish(new Error('Cancelled'));
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    }
    process.stdin.on('data', onData);
  });
}
const password = await readPassword('Password (12–256 characters; hidden): ');
if (password.length < 12 || password.length > 256) throw new Error('Use 12–256 characters.');
if (password !== (await readPassword('Confirm password (hidden): ')))
  throw new Error('Passwords do not match.');
const ca =
  process.env.MYSQL_CA?.replace(/\\n/g, '\n') ||
  (process.env.MYSQL_CA_PATH ? fs.readFileSync(process.env.MYSQL_CA_PATH, 'utf8') : undefined);
if (!process.env.MYSQL_HOST || !process.env.MYSQL_PASSWORD || !ca)
  throw new Error('Configure Aiven in .env.local first.');
const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'defaultdb',
  ssl: { ca, rejectUnauthorized: true },
  connectTimeout: 10000,
});
try {
  const salt = randomBytes(16).toString('hex');
  const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  if (mode === 'create') {
    await connection.execute('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [
      email,
      hash,
    ]);
    console.log('Admin account created.');
  } else {
    const [result] = await connection.execute(
      'UPDATE admins SET password_hash = ?, session_version = session_version + 1 WHERE email = ?',
      [hash, email],
    );
    if (!result.affectedRows) throw new Error('No admin exists with that email.');
    console.log('Password updated. Existing sessions have been invalidated.');
  }
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY')
    throw new Error('Account already exists. Use npm run admin:reset to change its password.');
  throw new Error('Unable to save admin account. Check database setup and account email.');
} finally {
  await connection.end();
}
