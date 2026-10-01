import type { NextApiRequest, NextApiResponse } from 'next';
export function sameOrigin(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin;
  const expected = process.env.APP_URL || `http://${req.headers.host}`;
  if (!origin || origin !== new URL(expected).origin) {
    res.status(403).json({ error: 'Invalid request origin' });
    return false;
  }
  return true;
}
// Single-process fallback. Configure a shared rate limiter at the edge for multi-instance deployment.
const buckets = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 10000) for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  let b = buckets.get(key);
  if (!b || b.until < now) {
    b = { count: 0, until: now + windowMs };
    buckets.set(key, b);
  }
  return ++b.count <= max;
}
export function clientKey(req: NextApiRequest) {
  return req.socket.remoteAddress || 'unknown';
}
