import { mkdirSync, writeFileSync } from 'node:fs';
import { orderEmail, type EmailOrder } from '../lib/email-templates';
const order: EmailOrder = {
  reference: 'LM-DEMO0001',
  name: 'Alex Sample',
  email: 'alex@example.com',
  phone: '09000000000',
  address: '123 Sample Street, Barangay Example',
  city: 'Manila',
  postalCode: '1000',
  notes: 'Please call before delivery.',
  productName: 'Off Duty Club',
  size: 'M',
  color: 'Vintage white',
  quantity: 2,
  unitPrice: 69000,
  shipping: 12000,
  total: 150000,
  createdAt: '2026-10-01T08:00:00Z',
};
mkdirSync('docs/email-previews', { recursive: true });
for (const audience of ['customer', 'admin'] as const)
  writeFileSync(`docs/email-previews/${audience}.html`, orderEmail(order, audience).htmlContent);
console.log('Dummy-data email previews saved to docs/email-previews. No emails sent.');
