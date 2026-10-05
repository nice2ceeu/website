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
  const [uploading, setUploading] = useState(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  async function uploadQr(file: File) {
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to upload QR image.');
      setSettings((current) => ({ ...current, qrImageUrl: data.url }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to upload QR image.');
    } finally {
      setUploading(false);
    }
  }
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
      <div className="eyebrow">LIGHTMARE PH / PAYMENT SETTINGS</div>
      <h1>Payment instructions</h1>
      <p>
        These are instructions only. Lightmare PH does not collect or verify payments through a
        payment gateway.
      </p>
      <form onSubmit={publish} className="payment-settings-form">
        <section className="order-panel">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.qrEnabled}
              onChange={(event) => setSettings({ ...settings, qrEnabled: event.target.checked })}
            />
            <strong>Offer QR payment</strong>
          </label>
          <label>
            Upload payment QR code
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy || uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadQr(file);
                event.target.value = '';
              }}
            />
          </label>
          {uploading && <p role="status">Uploading QR code...</p>}
          <label>
            QR image URL
            <input
              type="url"
              maxLength={2000}
              placeholder="https://..."
              value={settings.qrImageUrl}
              onChange={(event) => setSettings({ ...settings, qrImageUrl: event.target.value })}
            />
          </label>
          {settings.qrImageUrl && /^https:\/\//i.test(settings.qrImageUrl) && (
            <img className="payment-qr" src={settings.qrImageUrl} alt="Payment QR code preview" />
          )}
          <label>
            QR payment instructions
            <textarea
              rows={4}
              maxLength={1000}
              placeholder="Scan the QR code with your payment app. Account name: Lightmare PH"
              value={settings.qrDetails}
              onChange={(event) => setSettings({ ...settings, qrDetails: event.target.value })}
            />
          </label>
          <p className="form-note">
            Upload your payment provider's QR code. Customers scan it and enter their order total;
            payment is confirmed manually.
          </p>
        </section>
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
              placeholder={
                'Send payment to:\nAccount name: Lightmare PH\nGCash number: 09•• ••• ••••'
              }
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
                'Send payment to:\nBank: Example Bank\nAccount name: Lightmare PH\nAccount number: ••••••••'
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
          <button className="button" disabled={busy || uploading || !dirty}>
            {busy ? 'Publishing…' : 'Publish payment settings'}
          </button>
          <button
            className="text-link"
            type="button"
            disabled={busy || uploading || !dirty}
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
