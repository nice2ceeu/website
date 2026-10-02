import { useRef, useState, FormEvent } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle, Minus, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import AddressFields from '@/components/AddressFields';
import SizeGuide from '@/components/SizeGuide';
import PaymentSelection from '@/components/PaymentSelection';
import { Product, money, sizes, store } from '@/lib/catalog';
import type { LandingContent } from '@/lib/landing-content';
import type { PaymentSettings } from '@/lib/payment-settings';
export default function ProductPage({
  product,
  content,
  paymentSettings,
}: {
  product: Product;
  content: LandingContent;
  paymentSettings: PaymentSettings;
}) {
  return (
    <ProductDetail
      key={product.slug}
      product={product}
      content={content}
      paymentSettings={paymentSettings}
    />
  );
}
function ProductDetail({
  product,
  content,
  paymentSettings,
}: {
  product: Product;
  content: LandingContent;
  paymentSettings: PaymentSettings;
}) {
  const [size, setSize] = useState(product.availableSizes?.[0] || 'M'),
    [quantity, setQuantity] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [paymentMethod, setPaymentMethod] = useState<'gcash' | 'bank' | 'cod' | ''>(''),
    [result, setResult] = useState<{ reference: string; emailStatus: string } | null>(null);
  const key = useRef('');
  const selectedPaymentDetails =
    paymentMethod === 'gcash'
      ? paymentSettings.gcashDetails
      : paymentMethod === 'bank'
        ? paymentSettings.bankDetails
        : '';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    key.current ||= crypto.randomUUID();
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          productSlug: product.slug,
          size,
          color: product.color,
          quantity,
          consent: form.get('consent') === 'on',
          idempotencyKey: key.current,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection error. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Layout title={product.name} content={content}>
      <div className="product-page section">
        <Link className="back-link" href="/shop">
          ← Back to the collection
        </Link>
        <div className="product-detail">
          <div>
            <div className="detail-image" style={{ background: product.bg }}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={`${product.name} in ${product.color}`} />
              ) : (
                <div className="empty">Image coming soon</div>
              )}
            </div>
            <p className="sample-note">Sample product · illustrative design mockup</p>
          </div>
          <div>
            <div className="eyebrow">LIGHTMARE ORIGINAL / VOL. 01</div>
            <h1>{product.name}</h1>
            <div className="detail-price">{money(product.price)}</div>
            <p>
              {product.caption} An easy, relaxed silhouette for days that don’t need a dress code.
            </p>
            <div className="choice-label">
              COLOR <strong>{product.color}</strong>
            </div>
            <div className="color-choice">● {product.color}</div>
            <div className="choice-label">
              SIZE <SizeGuide content={content} />
            </div>
            <div className="sizes">
              {(product.availableSizes || sizes).map((s) => (
                <button
                  type="button"
                  key={s}
                  aria-pressed={size === s}
                  className={size === s ? 'selected' : ''}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="quantity-row">
              <span>QUANTITY</span>
              <div>
                <button
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus size={14} />
                </button>
                <span>{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  disabled={quantity >= 10}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
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
                  {selectedPaymentDetails && (
                    <div className="payment-instructions">
                      <strong>Send your payment here</strong>
                      <p>{selectedPaymentDetails}</p>
                      <small>Lightmare confirms payment manually.</small>
                    </div>
                  )}
                  <p>
                    {result.emailStatus === 'sent'
                      ? 'Check your inbox for your receipt.'
                      : 'Your order is saved, but we could not confirm email delivery. Keep this reference and contact the store.'}{' '}
                    {paymentMethod === 'cod'
                      ? ' Pay the courier when your order is delivered.'
                      : ' Follow the payment instructions shown above and in your receipt. Confirmation is handled manually.'}
                  </p>
                  <Link className="text-link" href="/shop">
                    Back to the tees →
                  </Link>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <p className="form-note">
                    Enter your details below. We’ll confirm your order and share payment
                    instructions. No payment is collected here.
                  </p>
                  <div className="form-grid">
                    <label>
                      Full name
                      <input
                        required
                        name="name"
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
                        autoComplete="tel"
                        pattern="[+0-9 ()\-]{7,25}"
                      />
                    </label>
                    <AddressFields />
                    <PaymentSelection
                      settings={paymentSettings}
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                    />
                    <label className="full">
                      Order notes (optional)
                      <textarea name="notes" rows={2} maxLength={1000} style={{ resize: 'none' }} />
                    </label>
                  </div>
                  <p className="form-note">Shipping to the Philippines only.</p>
                  <div className="totals">
                    <div>
                      <span>Subtotal</span>
                      <span>{money(product.price * quantity)}</span>
                    </div>
                    <div>
                      <span>Shipping</span>
                      <span>{money(store.shipping)}</span>
                    </div>
                    <div className="grand-total">
                      <strong>Total</strong>
                      <strong>{money(product.price * quantity + store.shipping)}</strong>
                    </div>
                  </div>
                  <label className="checkbox">
                    <input required type="checkbox" name="consent" />{' '}
                    <span>
                      I agree to share my contact and delivery details so Lightmare can process this
                      order.
                    </span>
                  </label>
                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}
                  <button className="button wide" disabled={busy} type="submit">
                    {busy ? 'Placing your request…' : 'Place order request'}
                    <ArrowUpRight size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { getProduct } = await import('@/lib/products');
  const product = await getProduct(String(params?.slug || ''));
  if (!product) return { notFound: true };
  const { getLanding } = await import('@/lib/cms');
  const { getPaymentSettings } = await import('@/lib/payment-settings');
  const [landing, payment] = await Promise.all([getLanding(), getPaymentSettings()]);
  const { revision: _revision, ...paymentSettings } = payment;
  return { props: { product, content: landing.content, paymentSettings } };
};
