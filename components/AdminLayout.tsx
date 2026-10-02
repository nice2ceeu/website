import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  ListOrdered,
  ArrowUpRight,
  LogOut,
  Settings,
  CreditCard,
} from 'lucide-react';
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState('');
  async function logout() {
    try {
      const r = await fetch('/api/admin/logout', { method: 'POST' });
      if (!r.ok) throw new Error();
      await router.push('/admin/login');
    } catch {
      setError('Could not sign out. Please try again.');
    }
  }
  return (
    <div className="admin">
      <Head>
        <title>Lightmare — Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <aside>
        <Link href="/admin" className="wordmark">
          lightmare<span>®</span>
        </Link>
        <small>THE BACK OFFICE</small>
        <nav>
          <Link className={router.pathname === '/admin' ? 'active' : ''} href="/admin">
            <LayoutDashboard size={18} /> Overview
          </Link>
          <Link
            className={router.pathname === '/admin/orders' ? 'active' : ''}
            href="/admin/orders"
          >
            <ListOrdered size={18} /> Orders
          </Link>
          <Link href="/" className="admin-secondary-link">
            <ArrowUpRight size={16} aria-hidden="true" /> View storefront
          </Link>
          <Link
            className={router.pathname === '/admin/products' ? 'active' : ''}
            href="/admin/products"
          >
            <ListOrdered size={18} /> Products
          </Link>
          <Link href="/shop" className="admin-secondary-link">
            <ArrowUpRight size={16} aria-hidden="true" /> Browse products
          </Link>
          <Link
            className={router.pathname === '/admin/content' ? 'active' : ''}
            href="/admin/content"
          >
            <LayoutDashboard size={18} /> Landing Page
          </Link>
          <Link
            className={router.pathname === '/admin/settings' ? 'active' : ''}
            href="/admin/settings"
          >
            <Settings size={18} /> Settings
          </Link>
          <Link
            className={router.pathname === '/admin/payments' ? 'active' : ''}
            href="/admin/payments"
          >
            <CreditCard size={18} /> Payments
          </Link>
        </nav>
        <button onClick={logout}>
          <LogOut size={17} /> Sign out
        </button>
        {error && <p role="alert">{error}</p>}
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
