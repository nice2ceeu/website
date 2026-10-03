import type { OrderItem } from './order-items';
export type EmailOrder = {
  items?: OrderItem[];
  reference: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  shipping: number;
  total: number;
  createdAt?: string;
  status?: string;
  paymentMethod?: 'gcash' | 'bank' | 'cod';
  paymentDetails?: string;
};

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}
const currency = (cents: number) =>
  `PHP ${(cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const cell = 'padding:14px 8px;border-bottom:1px solid #bfd3e2;text-align:left;';

export function orderEmail(order: EmailOrder, audience: 'customer' | 'admin') {
  const admin = audience === 'admin';
  const e = escapeHtml;
  const status = order.status || 'pending';
  const paid = ['paid', 'processing', 'shipped'].includes(status);
  const cancelled = status === 'cancelled';
  const method = order.paymentMethod || 'cod';
  const methodLabel =
    method === 'gcash' ? 'GCash' : method === 'bank' ? 'Bank transfer' : 'Cash on delivery';
  const payment = cancelled
    ? 'Order cancelled'
    : paid
      ? 'Payment confirmed'
      : method === 'cod'
        ? 'Payment due on delivery'
        : 'Payment pending';
  const date = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeZone: 'Asia/Manila',
  }).format(new Date(order.createdAt || Date.now()));
  const title = admin ? 'Order summary' : 'Your order invoice';
  const next = cancelled
    ? 'This order has been cancelled. Contact the store with any questions.'
    : paid
      ? 'Your payment has been recorded by our team. Keep this invoice for your reference.'
      : admin
        ? 'Verify payment separately before marking this order as paid. Review the delivery details before dispatch.'
        : method === 'cod'
          ? 'Your order request is saved. Pay the courier when your order is delivered.'
          : 'Your order request is saved. Follow the payment instructions below. Payment confirmation is handled manually.';
  const items = order.items || [
    {
      productSlug: '',
      productName: order.productName,
      size: order.size,
      color: order.color,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
    },
  ];
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemText = items
    .map(
      (item) =>
        `${item.productName}\nSize: ${item.size} / Color: ${item.color}\nUnit price: ${currency(item.unitPrice)}\nQuantity: ${item.quantity}\nLine total: ${currency(item.unitPrice * item.quantity)}`,
    )
    .join('\n\n');
  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="${cell}line-height:1.8;"><strong>${e(item.productName)}</strong><br><span style="color:#566b7c;">${e(item.size)} / ${e(item.color)}<br>${currency(item.unitPrice)} each</span></td><td style="${cell}text-align:center;">${item.quantity}</td><td style="${cell}text-align:right;white-space:nowrap;">${currency(item.unitPrice * item.quantity)}</td></tr>`,
    )
    .join('');
  const address = `${order.address}\n${order.city}, ${order.postalCode}\nPhilippines`;
  const paymentHtml = `<tr><td style="padding:0 28px 24px;"><h2 style="font-size:11px;letter-spacing:1px;">PAYMENT METHOD</h2><p style="font-size:13px;line-height:1.8;"><strong>${e(methodLabel)}</strong>${order.paymentDetails ? `<br>${e(order.paymentDetails).replace(/\n/g, '<br>')}` : '<br>Pay when your order is delivered.'}</p></td></tr>`;
  const textContent = `LIGHTMARE PH\n${title}\n${order.reference} · ${date}\n${payment}\nOrder status: ${status}\n\nCustomer: ${order.name}\nEmail: ${order.email}\nPhone: ${order.phone}\nShip to:\n${address}\n\n${itemText}\n\nSubtotal: ${currency(subtotal)}\nShipping: ${currency(order.shipping)}\nOrder total: ${currency(order.total)}\n${!paid && !cancelled ? `Amount due: ${currency(order.total)}\n` : ''}\nNotes: ${order.notes || 'None'}\n\n${next}\n\nOrder invoice for reference; not an official tax invoice or proof of payment.`;
  const htmlContent = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — ${e(order.reference)}</title></head>
<body style="margin:0;padding:0;background:#e4eff7;color:#354f65;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${e(order.reference)} · ${e(payment)} · ${currency(order.total)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e4eff7;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #bfd3e2;">
<tr><td style="padding:30px 28px;background:#f2bfdc;color:#354f65;"><span style="font-family:Georgia,serif;font-size:36px;font-weight:bold;letter-spacing:-2px;">lightmare ph</span><p style="margin:8px 0 0;font-size:10px;letter-spacing:2px;">${admin ? 'THE BACK OFFICE / ORDER NOTIFICATION' : 'A LITTLE PERSONALITY. A LOT OF EVERYDAY.'}</p></td></tr>
<tr><td style="padding:30px 28px 16px;"><span style="display:inline-block;padding:7px 12px;background:${paid ? '#d8eaf7' : '#f7d7e8'};color:#354f65;font-size:11px;font-weight:bold;">${payment.toUpperCase()}</span><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:30px;margin:18px 0 10px;">${title}</h1><p style="font-size:13px;line-height:1.7;margin:0;color:#566b7c;">${admin ? 'An order to review, all in one place.' : `Hi ${e(order.name)}, thanks for choosing Lightmare PH.`}</p></td></tr>
<tr><td style="padding:8px 28px 24px;"><table role="presentation" width="100%"><tr><td style="font-size:12px;line-height:1.8;"><strong>ORDER REFERENCE</strong><br>${e(order.reference)}</td><td align="right" style="font-size:12px;line-height:1.8;"><strong>ORDER DATE</strong><br>${e(date)}</td></tr></table></td></tr>
<tr><td style="padding:0 28px 24px;"><div style="border-top:1px solid #bfd3e2;padding-top:20px;"><h2 style="font-size:11px;letter-spacing:1px;margin:0 0 12px;">${admin ? 'CUSTOMER & DELIVERY' : 'DELIVER TO'}</h2><p style="font-size:13px;line-height:1.8;margin:0;overflow-wrap:anywhere;"><strong>${e(order.name)}</strong><br>${e(address).replace(/\n/g, '<br>')}<br>${e(order.email)}<br>${e(order.phone)}</p></div></td></tr>
<tr><td style="padding:0 20px;"><table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:12px;"><thead><tr style="background:#e4eff7;"><th scope="col" style="${cell}">ITEM</th><th scope="col" style="${cell}text-align:center;">QTY</th><th scope="col" style="${cell}text-align:right;">AMOUNT</th></tr></thead><tbody>${itemRows}</tbody></table></td></tr>
<tr><td style="padding:16px 28px 24px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;"><tr><td style="padding:7px 0;">Subtotal</td><td align="right">${currency(subtotal)}</td></tr><tr><td style="padding:7px 0 18px;">Shipping</td><td align="right" style="padding-bottom:11px;">${currency(order.shipping)}</td></tr><tr><td style="border-top:2px solid #4c7391;padding-top:17px;font-weight:bold;">${paid || cancelled ? 'Order total' : 'Total amount due'}</td><td align="right" style="border-top:2px solid #4c7391;padding-top:17px;font-size:22px;font-weight:bold;color:#4c7391;">${currency(order.total)}</td></tr></table></td></tr>
${order.notes ? `<tr><td style="padding:0 28px 24px;"><h2 style="font-size:11px;letter-spacing:1px;">ORDER NOTES</h2><p style="font-size:13px;line-height:1.7;overflow-wrap:anywhere;">${e(order.notes).replace(/\n/g, '<br>')}</p></td></tr>` : ''}
${paymentHtml}
<tr><td style="padding:0 28px 28px;"><div style="background:#fceaf3;padding:18px;font-size:12px;line-height:1.8;"><strong>${admin ? `Order status: ${e(status)}` : 'What happens next?'}</strong><br>${next}</div></td></tr>
<tr><td style="border-top:1px solid #bfd3e2;padding:23px 28px;text-align:center;color:#566b7c;font-size:10px;line-height:1.8;">Keep your order reference for any questions.<br>Order invoice for reference; not an official tax invoice or proof of payment.<br><span style="color:#4c7391;">LIGHTMARE PH · Wear what feels like you.</span></td></tr>
</table></td></tr></table></body></html>`;
  const textWithPayment = textContent.replace(
    'Notes:',
    `Payment method: ${methodLabel}\n${order.paymentDetails ? `Payment instructions:\n${order.paymentDetails}\n` : ''}Notes:`,
  );
  return {
    subject: `${admin ? 'Order summary' : 'Your Lightmare PH invoice'} — ${order.reference}`,
    htmlContent,
    textContent: textWithPayment,
  };
}
