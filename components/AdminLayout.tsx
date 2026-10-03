import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Store,
  Globe,
  PanelsTopLeft,
  LogOut,
  Settings,
  CreditCard,
  Truck,
  Menu,
  X,
} from 'lucide-react';
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
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
        <title>Lightmare PH — Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <aside className={menuOpen ? 'admin-sidebar expanded' : 'admin-sidebar'}>
        <div className="admin-sidebar-header">
          <Link href="/admin" className="wordmark">
            <img
              className="admin-brand-logo"
              src="/images/lightmare-logo-blue.png"
              alt="Lightmare PH"
              width={220}
              height={104}
            />
          </Link>
          <button
            type="button"
            className="admin-menu-toggle"
            aria-controls="admin-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close admin navigation' : 'Open admin navigation'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <small>THE BACK OFFICE</small>
        <nav id="admin-navigation" aria-label="Admin navigation" onClick={() => setMenuOpen(false)}>
          <Link className={router.pathname === '/admin' ? 'active' : ''} href="/admin">
            <LayoutDashboard size={18} /> Overview
          </Link>
          <Link
            className={router.pathname === '/admin/orders' ? 'active' : ''}
            href="/admin/orders"
          >
            <ShoppingBag size={18} /> Orders
          </Link>
          <Link href="/" className="admin-secondary-link">
            <Globe size={18} aria-hidden="true" /> View storefront
          </Link>
          <Link
            className={router.pathname === '/admin/products' ? 'active' : ''}
            href="/admin/products"
          >
            <Shirt size={18} /> Products
          </Link>
          <Link href="/shop" className="admin-secondary-link">
            <Store size={18} aria-hidden="true" /> Browse products
          </Link>
          <Link
            className={router.pathname === '/admin/content' ? 'active' : ''}
            href="/admin/content"
          >
            <PanelsTopLeft size={18} /> Landing Page
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
          <Link
            className={router.pathname === '/admin/shipping' ? 'active' : ''}
            href="/admin/shipping"
          >
            <Truck size={18} /> Shipping
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
