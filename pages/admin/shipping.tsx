import { useState, type FormEvent } from 'react';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@/components/AdminLayout';
import { shippingAreas, type ShippingSettings } from '@/lib/shipping-pricing';

export default function Shipping({
  settings: initial,
  initialRevision,
}: {
  settings: ShippingSettings;
  initialRevision: number;
}) {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [revision, setRevision] = useState(initialRevision);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, revision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save shipping settings.');
      setRevision(data.revision);
      setSaved(settings);
      setMessage('Shipping rates published.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save shipping settings.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminLayout>
      <div className="eyebrow">LIGHTMARE PH / SHIPPING SETTINGS</div>
      <h1>Shipping fees</h1>
      <p>
        Set delivery-area fees in pesos. Changes apply to new orders; existing orders keep their
        saved shipping fee.
      </p>
      <form onSubmit={publish} className="payment-settings-form">
        <fieldset disabled={busy} className="cart-checkout-fields">
          <section className="order-panel">
            <h2>Delivery areas</h2>
            {(Object.keys(shippingAreas) as Array<keyof typeof shippingAreas>).map((area) => (
              <label key={area}>
                {shippingAreas[area]} (PHP)
                <input
                  required
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  value={settings[area] / 100}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      [area]: Math.round(Number(event.target.value) * 100),
                    })
                  }
                />
              </label>
            ))}
          </section>
          <section className="order-panel">
            <h2>Free shipping</h2>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.freeShippingThreshold !== null}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    freeShippingThreshold: event.target.checked ? 200000 : null,
                  })
                }
              />
              <strong>Offer free shipping above a minimum product subtotal</strong>
            </label>
            {settings.freeShippingThreshold !== null && (
              <label>
                Minimum product subtotal (PHP)
                <input
                  required
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  value={settings.freeShippingThreshold / 100}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      freeShippingThreshold: Math.round(Number(event.target.value) * 100),
                    })
                  }
                />
              </label>
            )}
            <p>
              The threshold includes products only. Customers at or above it receive free shipping
              to any supported delivery area.
            </p>
          </section>
        </fieldset>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="product-actions">
          <button className="button" disabled={busy || !dirty}>
            {busy ? 'Publishing…' : 'Publish shipping settings'}
          </button>
          <button
            className="text-link"
            type="button"
            disabled={busy || !dirty}
            onClick={() => setSettings(saved)}
          >
            Discard changes
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { isAdmin } = await import('@/lib/auth');
  if (!(await isAdmin(req))) return { redirect: { destination: '/admin/login', permanent: false } };
  try {
    const { getShippingSettings } = await import('@/lib/shipping-settings');
    const { revision, ...settings } = await getShippingSettings();
    return { props: { settings, initialRevision: revision } };
  } catch {
    return { redirect: { destination: '/admin?setup=shipping', permanent: false } };
  }
};
