import type { RowDataPacket } from 'mysql2';
import { db, configured } from './db';
import { defaultLanding, landingSchema } from './landing-content';
export async function getLanding() {
  if (!configured()) return { content: defaultLanding, revision: 0 };
  const [rows] = await db().execute<RowDataPacket[]>(
    'SELECT content,revision FROM site_content WHERE page_key=?',
    ['landing'],
  );
  if (!rows.length) throw new Error('Landing page CMS is not initialized.');
  const raw = typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content;
  return { content: landingSchema.parse(raw), revision: Number(rows[0].revision) };
}
