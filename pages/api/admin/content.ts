import type { NextApiRequest, NextApiResponse } from 'next';
import type { ResultSetHeader } from 'mysql2';
import { isAdmin } from '@/lib/auth';
import { sameOrigin } from '@/lib/api';
import { db } from '@/lib/db';
import { getLanding } from '@/lib/cms';
import { landingSchema } from '@/lib/landing-content';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await isAdmin(req))) return res.status(401).json({ error: 'Sign in required.' });
  if (!['GET', 'PUT'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).end();
  }
  if (req.method === 'PUT' && !sameOrigin(req, res)) return;
  try {
    if (req.method === 'GET') return res.json(await getLanding());
    const parsed = landingSchema.safeParse(req.body?.content);
    if (!parsed.success)
      return res.status(400).json({
        error: `${parsed.error.issues[0]?.path.join('.')}: ${parsed.error.issues[0]?.message}`,
      });
    const revision = req.body?.revision;
    if (!Number.isSafeInteger(revision) || revision < 1)
      return res.status(400).json({ error: 'Invalid content revision. Reload the editor.' });
    const [result] = await db().execute<ResultSetHeader>(
      'UPDATE site_content SET content=?,revision=revision+1 WHERE page_key=? AND revision=?',
      [JSON.stringify(parsed.data), 'landing', revision],
    );
    if (!result.affectedRows)
      return res.status(409).json({
        error:
          'Content changed in another session. Reload this page before publishing; your changes have not been saved.',
      });
    return res.json({ revision: revision + 1 });
  } catch {
    return res
      .status(503)
      .json({ error: 'Unable to load or save content. Check CMS database setup.' });
  }
}
