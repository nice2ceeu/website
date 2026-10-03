export type EmailUsage = {
  limit: number;
  remaining: number | null;
  emailsPerOrder: number;
  status: 'available' | 'not-configured' | 'unavailable';
};

export async function getEmailUsage(): Promise<EmailUsage> {
  const usage: EmailUsage = {
    limit: 300,
    remaining: null,
    emailsPerOrder: process.env.ORDER_NOTIFICATION_EMAIL ? 2 : 1,
    status: 'not-configured',
  };
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) return usage;
  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': process.env.BREVO_API_KEY, accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Unable to read email credits');
    const account = await response.json();
    const plan = account.plan?.find(
      (entry: { type?: string; creditsType?: string }) =>
        entry.type === 'free' && entry.creditsType === 'sendLimit',
    );
    if (!Number.isInteger(plan?.credits) || plan.credits < 0 || plan.credits > usage.limit)
      throw new Error('Daily email credits unavailable');
    return { ...usage, remaining: plan.credits, status: 'available' };
  } catch {
    return { ...usage, status: 'unavailable' };
  }
}
