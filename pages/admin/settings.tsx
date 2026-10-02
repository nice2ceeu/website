import { useState, type FormEvent } from 'react';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@/components/AdminLayout';

export default function Settings() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    const form = event.currentTarget;
    try {
      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to change password.');
      form.reset();
      setMessage('Password changed. Other admin sessions have been signed out.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to change password.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminLayout>
      <div className="eyebrow">LIGHTMARE PH / SETTINGS</div>
      <h1>Admin settings</h1>
      <section className="order-panel admin-settings-panel">
        <h2>Change password</h2>
        <p>Use at least 12 characters. Changing it signs out every other admin session.</p>
        <form className="form-grid" onSubmit={changePassword}>
          <label className="full">
            Current password
            <input
              required
              name="currentPassword"
              type="password"
              maxLength={256}
              autoComplete="current-password"
            />
          </label>
          <label>
            New password
            <input
              required
              name="newPassword"
              type="password"
              minLength={12}
              maxLength={256}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              required
              name="confirmPassword"
              type="password"
              minLength={12}
              maxLength={256}
              autoComplete="new-password"
            />
          </label>
          {message && (
            <p className="notice full" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="error full" role="alert">
              {error}
            </p>
          )}
          <div className="full">
            <button className="button" disabled={busy}>
              {busy ? 'Changing password…' : 'Change password'}
            </button>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { isAdmin } = await import('@/lib/auth');
  return (await isAdmin(req))
    ? { props: {} }
    : { redirect: { destination: '/admin/login', permanent: false } };
};
