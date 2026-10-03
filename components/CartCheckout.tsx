import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle } from 'lucide-react';
import AddressFields from './AddressFields';
import PaymentSelection from './PaymentSelection';
import { money } from '@/lib/catalog';
import type { PaymentSettings } from '@/lib/payment-settings';
import { useCart } from './CartProvider';
import {
  loadCheckoutDetails,
  saveCheckoutDetails,
  type CheckoutDetails,
} from '@/lib/checkout-details';
import {
  shippingAreas,
  shippingArea,
  shippingFee,
  shippingSettingsSchema,
  type ShippingSettings,
} from '@/lib/shipping-pricing';
export default function CartCheckout({
  settings,
  onBusyChange,
  onSuccess,
}: {
  settings: PaymentSettings;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => void;
}) {
  const { items, clear, openCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [savedDetails, setSavedDetails] = useState<CheckoutDetails | null | undefined>(undefined);
  useEffect(() => {
    setSavedDetails(loadCheckoutDetails());
  }, []);
  const [error, setError] = useState('');
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [shippingError, setShippingError] = useState('');
  const [shippingRetry, setShippingRetry] = useState(0);
  const [province, setProvince] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setShippingError('');
    fetch('/api/shipping-options', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Shipping options are unavailable. Please retry.');
        return shippingSettingsSchema.parse(await response.json());
      })
      .then(setShippingSettings)
      .catch((error) => {
        if (!controller.signal.aborted) setShippingError(error.message);
      });
    return () => controller.abort();
  }, [shippingRetry]);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  let quotedShipping: number | null = null;
  let areaLabel = '';
  if (province && shippingSettings) {
    try {
      quotedShipping = shippingFee(shippingSettings, province, subtotal);
      areaLabel = shippingAreas[shippingArea(province)];
    } catch {}
  }
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'bank' | 'cod' | ''>('');
  const [result, setResult] = useState<{ reference: string; emailStatus: string } | null>(null);
  const key = useRef('');
  const snapshot = useRef('');
  const submittedTotal = useRef(0);
  const selectedPaymentDetails =
    paymentMethod === 'gcash'
      ? settings.gcashDetails
      : paymentMethod === 'bank'
        ? settings.bankDetails
        : '';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !items.length || quotedShipping === null) return;
    setBusy(true);
    onBusyChange(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      ...Object.fromEntries(form),
      items: items.map(({ product, size, quantity }) => ({
        productSlug: product.slug,
        color: product.color,
        size,
        quantity,
      })),
      consent: form.get('consent') === 'on',
      shippingQuote: quotedShipping,
    };
    const serialized = JSON.stringify(payload);
    try {
      if (serialized !== snapshot.current) {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
        const hash = Array.from(new Uint8Array(digest), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join('');
        let pending: { hash?: string; key?: string } = {};
        try {
          pending = JSON.parse(sessionStorage.getItem('lightmare-checkout') || '{}');
        } catch {}
        key.current = pending.hash === hash && pending.key ? pending.key : crypto.randomUUID();
        snapshot.current = serialized;
        try {
          sessionStorage.setItem('lightmare-checkout', JSON.stringify({ hash, key: key.current }));
        } catch {}
      }
      const response = await fetch('/api/cart-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, idempotencyKey: key.current }),
      });
      const data = await response.json();
      if (!response.ok && data.shippingSettings) {
        const parsed = shippingSettingsSchema.safeParse(data.shippingSettings);
        if (parsed.success) setShippingSettings(parsed.data);
      }
      if (!response.ok) throw new Error(data.error || 'Could not place your order.');
      saveCheckoutDetails(payload);
      submittedTotal.current = data.total;
      setResult(data);
      onSuccess();
      clear();
      try {
        sessionStorage.removeItem('lightmare-checkout');
      } catch {}
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection error. Please try again.');
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }
  if (!items.length && !result) return null;
  if (savedDetails === undefined) return <p role="status">Loading your details…</p>;
  return (
    <div className="order-form" id="order">
      <h2>
        Make it <em>yours.</em>
      </h2>
      {result ? (
        <div className="success" role="status">
          <CheckCircle />
          <h3>Your order request is in.</h3>
          <p>
            Reference: <strong>{result.reference}</strong>
          </p>
          <p>
            Total: <strong>{money(submittedTotal.current)}</strong>
          </p>
          {selectedPaymentDetails && (
            <div className="payment-instructions">
              <strong>Send your payment here</strong>
              <p>{selectedPaymentDetails}</p>
              <small>Lightmare PH confirms payment manually.</small>
            </div>
          )}
          <p>
            {result.emailStatus === 'sent'
              ? 'Check your inbox for your order receipt.'
              : 'Your order is saved, but we could not confirm email delivery. Keep this reference and contact the store.'}{' '}
            {paymentMethod === 'cod'
              ? ' Pay the courier when your order is delivered.'
              : ' Follow the payment instructions shown above and in your receipt. Confirmation is handled manually.'}
          </p>
          <Link className="text-link" href="/shop" onClick={() => openCart(false)}>
            Back to the tees →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit}>
          <fieldset disabled={busy} className="cart-checkout-fields">
            <p className="form-note">
              Enter your details below. We’ll confirm your order and share payment instructions. No
              payment is collected here.
            </p>
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  name="name"
                  defaultValue={savedDetails?.name || ''}
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label>
                Email address
                <input
                  required
                  type="email"
                  name="email"
                  defaultValue={savedDetails?.email || ''}
                  autoComplete="email"
                  maxLength={200}
                />
              </label>
              <label className="full">
                Phone number
                <input
                  required
                  type="tel"
                  name="phone"
                  defaultValue={savedDetails?.phone || ''}
                  autoComplete="tel"
                  pattern="[+0-9 ()\-]{7,25}"
                />
              </label>
              <AddressFields initialDetails={savedDetails} onProvinceChange={setProvince} />
              <div className="full totals" aria-live="polite">
                <div>
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div>
                  <span>Shipping{areaLabel ? ` — ${areaLabel}` : ''}</span>
                  <span>
                    {quotedShipping === null
                      ? shippingError
                        ? 'Unavailable'
                        : !shippingSettings
                          ? 'Loading shipping…'
                          : 'Select a delivery area'
                      : quotedShipping === 0
                        ? 'Free'
                        : money(quotedShipping)}
                  </span>
                </div>
                <div className="grand-total">
                  <strong>Total</strong>
                  <strong>
                    {quotedShipping === null
                      ? 'Calculated after area selection'
                      : money(subtotal + quotedShipping)}
                  </strong>
                </div>
              </div>
              {shippingSettings?.freeShippingThreshold !== null && shippingSettings && (
                <p className="full form-note">
                  Free shipping on product orders of {money(shippingSettings.freeShippingThreshold)}{' '}
                  or more.
                </p>
              )}
              {shippingError && (
                <p className="full error" role="alert">
                  {shippingError}{' '}
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setShippingRetry((value) => value + 1)}
                  >
                    Retry
                  </button>
                </p>
              )}
              <PaymentSelection
                settings={settings}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
              <label className="full">
                Order notes (optional)
                <textarea name="notes" rows={2} maxLength={1000} style={{ resize: 'none' }} />
              </label>
            </div>
            <p className="form-note">Shipping to the Philippines only.</p>
            <label className="checkbox">
              <input required type="checkbox" name="consent" />{' '}
              <span>
                I agree to share my contact and delivery details so Lightmare PH can process this
                order.
              </span>
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button wide"
              disabled={busy || quotedShipping === null}
              type="submit"
            >
              {busy ? 'Placing your request…' : 'Place order request'}
              <ArrowUpRight size={18} />
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
