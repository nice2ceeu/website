import { readFileSync } from 'node:fs';
import { db } from '../lib/db';
import { defaultLanding } from '../lib/landing-content';
async function setup() {
  await db().query(readFileSync('scripts/cms-schema.sql', 'utf8'));
  await db().execute(
    'INSERT INTO site_content (page_key,content) VALUES (?,?) ON DUPLICATE KEY UPDATE page_key=page_key',
    ['landing', JSON.stringify(defaultLanding)],
  );
  console.log('Landing page CMS ready. Existing content preserved.');
}
setup()
  .catch((error) => {
    console.error('CMS setup failed:', error.code || 'configuration error');
    process.exitCode = 1;
  })
  .finally(() => db().end());
