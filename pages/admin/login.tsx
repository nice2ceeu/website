import Head from 'next/head';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
export default function Login() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const router = useRouter();
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await router.push('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <Head>
        <title>Admin sign in — Lightmare PH</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Link className="wordmark" href="/">
        lightmare ph<span>®</span>
      </Link>
      <form className="login-card" onSubmit={login}>
        <div className="eyebrow">THE BACK OFFICE</div>
        <h1>
          Welcome <em>back.</em>
        </h1>
        <p>A little behind-the-scenes magic.</p>
        <label>
          Email
          <input name="email" type="email" required autoComplete="username" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            maxLength={256}
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button wide" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
      <Link href="/">← Back to Lightmare PH</Link>
    </div>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { isAdmin } = await import('@/lib/auth');
  return (await isAdmin(req))
    ? { redirect: { destination: '/admin', permanent: false } }
    : { props: {} };
};
