import { useState, type FormEvent } from 'react';
import type { Order } from '@/lib/admin-data';
import { money } from '@/lib/catalog';
export default function ShippingAdjustment({
  order,
  busy,
  onBusyChange,
  onSaved,
}: {
  order: Order;
  busy: boolean;
  onBusyChange: (value: boolean) => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onBusyChange(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping: Math.round(Number(form.get('shipping')) * 100),
          reason: form.get('reason'),
          expectedShipping: order.shipping,
          expectedTotal: order.total,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to adjust shipping.');
      await onSaved(
        data.emailStatus === 'sent'
          ? 'Shipping updated and the revised receipt sent.'
          : 'Shipping updated. Email delivery was not confirmed; use Resend order emails to retry.',
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to adjust shipping.');
    } finally {
      onBusyChange(false);
    }
  }
  return (
    <section>
      {order.status === 'pending' && (
        <form onSubmit={submit}>
          <h3>Adjust shipping</h3>
          <p>
            Current fee: {money(order.shipping)}. Saving updates the total and sends a revised
            receipt to the customer.
          </p>
          <fieldset disabled={busy} className="cart-checkout-fields">
            <label>
              New shipping fee (₱)
              <input
                type="number"
                name="shipping"
                required
                min="0"
                max="100000"
                step="0.01"
                defaultValue={order.shipping / 100}
              />
            </label>
            <label>
              Reason
              <input
                name="reason"
                required
                minLength={3}
                maxLength={500}
                placeholder="For example, agreed courier fee"
              />
            </label>
            <button type="submit" className="button">
              Save shipping and send receipt
            </button>
          </fieldset>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
      {!!order.shipping_adjustments?.length && (
        <>
          <h3>Shipping adjustment history</h3>
          <ul>
            {order.shipping_adjustments.map((change) => (
              <li key={change.id}>
                {money(change.old_shipping)} → {money(change.new_shipping)} — {change.reason}
                <small className="date">{change.created_at.slice(0, 10)}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
