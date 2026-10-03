import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import type { Order } from '@/lib/admin-data';
import { money, type Product } from '@/lib/catalog';
export default function Dashboard({
  orders,
  demo,
  error,
  productCount,
  products,
  stats,
}: {
  orders: Order[];
  demo: boolean;
  error: string;
  productCount: number | null;
  products: Product[];
  stats: { total: number; pending: number; paid: number; emails: number };
}) {
  return (
    <AdminLayout>
      <div className="eyebrow">LIGHTMARE PH / OVERVIEW</div>
      <h1>
        A good day to <em>make things happen.</em>
      </h1>
      <p>Here’s what’s happening in your little corner of the world.</p>
      {demo && (
        <div className="notice">
          Demo data — connect Aiven MySQL to see real orders. No sample orders are saved to the
          database.
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <div className="stats">
        {[
          ['Total products', productCount === null ? 'Unavailable' : String(productCount)],
          ['Total orders', String(stats.total)],
          ['Pending payment', String(stats.pending)],
          ['Paid order value', money(stats.paid)],
          ['Email needs attention', String(stats.emails)],
        ].map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2>Product catalog</h2>
        <Link className="text-link" href="/admin/products">
          Manage all products →
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>PRICE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={{ pathname: '/admin/products', query: { q: p.slug } }}>{p.name}</Link>
                </td>
                <td>{money(p.price)}</td>
                <td>
                  <span className={`badge ${p.active ? 'paid' : ''}`}>
                    {p.active ? 'Published' : 'Draft'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && <p className="empty">No products to show.</p>}
      </div>
      <p className="sample-note">
        Product count includes published products and drafts. Deleted products are excluded.
      </p>
      <div className="section-heading">
        <h2>Recent orders</h2>
        <Link className="text-link" href="/admin/orders">
          View all orders →
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>REFERENCE</th>
              <th>CUSTOMER</th>
              <th>ITEMS</th>
              <th>TOTAL</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.reference}>
                <td>
                  <Link href={{ pathname: '/admin/orders', query: { q: o.reference } }}>
                    {o.reference}
                  </Link>
                </td>
                <td>{o.customer_name}</td>
                <td>
                  {o.items.map((item) => item.productName).join(', ')}
                  <small className="date">
                    {o.items.reduce((sum, item) => sum + item.quantity, 0)} tees
                  </small>
                </td>
                <td>{money(o.total)}</td>
                <td>
                  <span className={`badge ${o.status}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="empty">Your first order is waiting to happen.</p>}
      </div>
      <p className="sample-note">
        Showing the five latest orders and products. Totals cover all records; paid order value
        includes shipping.
      </p>
    </AdminLayout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { isAdmin } = await import('@/lib/auth');
  if (!(await isAdmin(req))) return { redirect: { destination: '/admin/login', permanent: false } };
  try {
    const { overviewData } = await import('@/lib/list-data');
    return { props: { ...(await overviewData()), demo: false, error: '' } };
  } catch {
    return {
      props: {
        orders: [],
        products: [],
        productCount: null,
        stats: { total: 0, pending: 0, paid: 0, emails: 0 },
        demo: false,
        error: 'Unable to load overview. Please try again.',
      },
    };
  }
};
