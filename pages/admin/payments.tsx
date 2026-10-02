import { useState, type FormEvent } from 'react';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@/components/AdminLayout';
import type { PaymentSettings } from '@/lib/payment-settings';

export default function Payments({
  settings: initial,
  initialRevision,
}: {
  settings: PaymentSettings;
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
      const response = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, revision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save payment settings.');
      setRevision(data.revision);
      setSaved(settings);
      setMessage('Payment instructions published.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save payment settings.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminLayout>
      <div className="eyebrow">LIGHTMARE / PAYMENT SETTINGS</div>
      <h1>Payment instructions</h1>
      <p>
        These are instructions only. Lightmare does not collect or verify payments through a payment
        gateway.
      </p>
      <form onSubmit={publish} className="payment-settings-form">
        <section className="order-panel">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.gcashEnabled}
              onChange={(event) => setSettings({ ...settings, gcashEnabled: event.target.checked })}
            />
            <strong>Offer GCash</strong>
          </label>
          <label>
            GCash instructions
            <textarea
              rows={5}
              maxLength={1000}
              placeholder={'Send payment to:\nAccount name: Lightmare\nGCash number: 09•• ••• ••••'}
              value={settings.gcashDetails}
              onChange={(event) => setSettings({ ...settings, gcashDetails: event.target.value })}
            />
          </label>
        </section>
        <section className="order-panel">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.bankEnabled}
              onChange={(event) => setSettings({ ...settings, bankEnabled: event.target.checked })}
            />
            <strong>Offer bank transfer</strong>
          </label>
          <label>
            Bank transfer instructions
            <textarea
              rows={6}
              maxLength={1000}
              placeholder={
                'Send payment to:\nBank: Example Bank\nAccount name: Lightmare\nAccount number: ••••••••'
              }
              value={settings.bankDetails}
              onChange={(event) => setSettings({ ...settings, bankDetails: event.target.value })}
            />
          </label>
        </section>
        <section className="order-panel">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.codEnabled}
              onChange={(event) => setSettings({ ...settings, codEnabled: event.target.checked })}
            />
            <strong>Offer cash on delivery (COD)</strong>
          </label>
          <p className="form-note">COD displays no advance-payment instructions.</p>
        </section>
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
            {busy ? 'Publishing…' : 'Publish payment settings'}
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
    const { getPaymentSettings } = await import('@/lib/payment-settings');
    const { revision, ...settings } = await getPaymentSettings();
    return { props: { settings, initialRevision: revision } };
  } catch {
    return { redirect: { destination: '/admin?setup=payments', permanent: false } };
  }
};
