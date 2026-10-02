import { orderEmail, type EmailOrder } from './email-templates';
export async function sendOrderEmail(order: EmailOrder) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !process.env.BREVO_SENDER_EMAIL) throw new Error('Brevo is not configured');
  const recipients = [
    { email: order.email, name: order.name, audience: 'customer' as const },
    ...(process.env.ORDER_NOTIFICATION_EMAIL
      ? [
          {
            email: process.env.ORDER_NOTIFICATION_EMAIL,
            name: 'Lightmare PH Admin',
            audience: 'admin' as const,
          },
        ]
      : []),
  ];
  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          sender: { name: 'Lightmare PH', email: process.env.BREVO_SENDER_EMAIL },
          to: [{ email: recipient.email, name: recipient.name }],
          ...orderEmail(order, recipient.audience),
        }),
      });
      if (!response.ok) throw new Error(`Brevo returned ${response.status}`);
    }),
  );
  if (results.some((result) => result.status === 'rejected'))
    throw new Error('One or more order emails could not be sent');
}
