import test from 'node:test';
import assert from 'node:assert/strict';
import { getEmailUsage } from '../lib/email-usage';

test('daily credits include both recipients and do not select SMS credits', async (t) => {
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_SENDER_EMAIL = 'sender@example.com';
  process.env.ORDER_NOTIFICATION_EMAIL = 'admin@example.com';
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({
      plan: [
        { type: 'sms', creditsType: 'sendLimit', credits: 15 },
        { type: 'free', creditsType: 'sendLimit', credits: 240 },
      ],
    }),
  );
  assert.deepEqual(await getEmailUsage(), {
    limit: 300,
    remaining: 240,
    emailsPerOrder: 2,
    status: 'available',
  });
});

test('missing configuration and provider failures never report zero usage', async (t) => {
  process.env.BREVO_API_KEY = '';
  assert.equal((await getEmailUsage()).status, 'not-configured');
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_SENDER_EMAIL = 'sender@example.com';
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 503 }));
  assert.equal((await getEmailUsage()).remaining, null);
  mock.mock.mockImplementation(async () => Response.json({ plan: [] }));
  assert.equal((await getEmailUsage()).status, 'unavailable');
  mock.mock.mockImplementation(async () =>
    Response.json({
      plan: [{ type: 'free', creditsType: 'sendLimit', credits: 0 }],
    }),
  );
  assert.equal((await getEmailUsage()).remaining, 0);
});
