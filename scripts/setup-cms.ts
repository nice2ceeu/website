import { readFileSync } from 'node:fs';
import { db } from '../lib/db';
import { defaultLanding } from '../lib/landing-content';
async function setup() {
  await db().query(readFileSync('scripts/cms-schema.sql', 'utf8'));
  await db().execute(
    'INSERT INTO site_content (page_key,content) VALUES (?,?) ON DUPLICATE KEY UPDATE page_key=page_key',
    ['landing', JSON.stringify(defaultLanding)],
  );
  const [rows] = await db().execute<any[]>('SELECT content FROM site_content WHERE page_key=?', [
    'landing',
  ]);
  const current =
    typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content;
  if (!Array.isArray(current.carouselSlides) || current.carouselSlides.length !== 4) {
    await db().execute('UPDATE site_content SET content=?,revision=revision+1 WHERE page_key=?', [
      JSON.stringify({ ...current, carouselSlides: defaultLanding.carouselSlides }),
      'landing',
    ]);
  }
  console.log('Landing page CMS ready. Existing content preserved.');
}
setup()
  .catch((error) => {
    console.error('CMS setup failed:', error.code || 'configuration error');
    process.exitCode = 1;
  })
  .finally(() => db().end());
