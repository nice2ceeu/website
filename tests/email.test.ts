import test from 'node:test';
import assert from 'node:assert/strict';
import { orderEmail, type EmailOrder } from '../lib/email-templates';
import { sendOrderEmail } from '../lib/email';
const order: EmailOrder = {
  reference: 'LM-DEMO0001',
  name: 'Alex <script>alert(1)</script>',
  email: 'alex@example.com',
  phone: '09000000000',
  address: '123 Sample Street',
  city: 'Manila',
  postalCode: '1000',
  notes: 'Leave at reception & call first.',
  productName: 'Off Duty Club',
  size: 'M',
  color: 'Vintage white',
  quantity: 2,
  unitPrice: 69000,
  shipping: 12000,
  total: 150000,
  createdAt: '2026-10-01T08:00:00Z',
  paymentMethod: 'gcash',
  paymentDetails: 'GCash name: Lightmare\nNumber: 09123456789',
};
test('invoice escapes user content and itemizes saved prices', () => {
  const email = orderEmail(order, 'customer');
  assert.ok(!email.htmlContent.includes('<script>'));
  assert.ok(email.htmlContent.includes('&lt;script&gt;'));
  for (const text of [
    'PHP 690.00',
    'PHP 1,380.00',
    'PHP 120.00',
    'PHP 1,500.00',
    'PAYMENT PENDING',
    'DELIVER TO',
    'GCash name: Lightmare',
  ])
    assert.ok(email.htmlContent.includes(text));
  assert.ok(email.textContent.includes('Amount due: PHP 1,500.00'));
  assert.ok(email.textContent.includes('Payment method: GCash'));
  assert.ok(orderEmail(order, 'admin').htmlContent.includes('CUSTOMER & DELIVERY'));
  for (const status of ['paid', 'shipped', 'cancelled'])
    assert.ok(
      !orderEmail({ ...order, status }, 'customer').htmlContent.includes('Total amount due'),
    );
});

test('cart invoice includes every item and one combined subtotal and shipping charge', () => {
  const email = orderEmail(
    {
      ...order,
      total: 200000,
      items: [
        {
          productSlug: 'off-duty',
          productName: 'Off Duty Club',
          size: 'M',
          color: 'Vintage white',
          quantity: 2,
          unitPrice: 69000,
        },
        {
          productSlug: 'second',
          productName: 'Second <tee>',
          size: 'L',
          color: 'Butter',
          quantity: 1,
          unitPrice: 50000,
        },
      ],
    },
    'customer',
  );
  assert.ok(email.htmlContent.includes('Second &lt;tee&gt;'));
  assert.ok(email.textContent.includes('Second <tee>'));
  assert.ok(email.htmlContent.includes('PHP 1,880.00'));
  assert.ok(email.textContent.includes('Subtotal: PHP 1,880.00'));
  assert.equal((email.textContent.match(/Shipping:/g) || []).length, 1);
  assert.ok(email.textContent.includes('Order total: PHP 2,000.00'));
});
test('sends separate HTML emails with text alternatives and reports partial failure', async (t) => {
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_SENDER_EMAIL = 'sender@example.com';
  process.env.ORDER_NOTIFICATION_EMAIL = 'admin@example.com';
  const sent: Array<{
    to: Array<{ email: string }>;
    htmlContent: string;
    textContent: string;
    bcc?: unknown;
  }> = [];
  const fetchMock = t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)));
    return new Response('{}', { status: 201 });
  });
  await sendOrderEmail(order);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to[0].email, order.email);
  assert.equal(sent[1].to[0].email, 'admin@example.com');
  assert.ok(sent[0].htmlContent.includes('Your order invoice'));
  assert.ok(sent[1].htmlContent.includes('Order summary'));
  assert.ok(sent.every((email) => email.textContent && !email.bcc));
  fetchMock.mock.mockImplementation(async () => new Response('{}', { status: 500 }));
  await assert.rejects(sendOrderEmail(order));
});
