import { useRouter } from 'next/router';
import QuerySearch from '@/components/QuerySearch';
import Pagination from '@/components/Pagination';
import { pagination, canonicalPage, type Paging } from '@/lib/pagination';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import type { Order } from '@/lib/admin-data';
import { money } from '@/lib/catalog';
import { statuses } from '@/lib/validation';
export default function Orders({
  orders,
  paging,
  demo,
  error,
}: {
  orders: Order[];
  demo: boolean;
  error: string;
  paging: Paging;
}) {
  const router = useRouter();
  const filter = typeof router.query.status === 'string' ? router.query.status : 'all';
  const [selected, setSelected] = useState<string | null>(null),
    [message, setMessage] = useState(error),
    [busy, setBusy] = useState(false);
  const visible = orders;
  const order = orders.find((o) => o.reference === selected);
  async function update(o: Order, status?: string) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(`/api/admin/orders/${o.reference}`, {
        method: status ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status ? { status } : {}),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await router.replace(router.asPath, undefined, { scroll: false });
      setMessage(status ? 'Order status updated.' : 'Order emails sent.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminLayout>
      <div className="eyebrow">LIGHTMARE PH / ORDERS</div>
      <h1>
        Every order. <em>A little joy.</em>
      </h1>
      <p>Manage all orders, from first hello to dispatch.</p>
      {demo && (
        <div className="notice">
          You’re viewing dummy orders. Editing is disabled until Aiven is connected.
        </div>
      )}
      <div className="order-filters">
        <QuerySearch label="Search orders" placeholder="Search name, email, or order reference…" />
        <select
          aria-label="Filter by status"
          value={filter}
          onChange={(e) => {
            const query: Record<string, string | string[] | undefined> = {
              ...router.query,
              status: e.target.value,
            };
            delete query.page;
            void router.push({ pathname: router.pathname, query }, undefined, { scroll: false });
          }}
        >
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>REFERENCE</th>
              <th>CUSTOMER</th>
              <th>TOTAL</th>
              <th>STATUS</th>
              <th>EMAIL</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.reference}>
                <td>
                  {o.reference}
                  <small className="date">{o.created_at.slice(0, 10)}</small>
                </td>
                <td>
                  {o.customer_name}
                  <small className="date">{o.email}</small>
                </td>
                <td>{money(o.total)}</td>
                <td>
                  <span className={`badge ${o.status}`}>{o.status}</span>
                </td>
                <td>{o.email_status}</td>
                <td>
                  <button className="text-link" onClick={() => setSelected(o.reference)}>
                    Details ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="empty">No orders match your search.</p>}
      </div>
      <Pagination paging={paging} />
      {order && (
        <section className="order-panel" aria-label="Order details">
          <div className="section-heading">
            <h2>{order.reference}</h2>
            <button onClick={() => setSelected(null)}>Close ×</button>
          </div>
          <div className="order-detail-grid">
            <div>
              <h3>{order.customer_name}</h3>
              <p>
                {order.email}
                <br />
                {order.phone}
              </p>
              <p>
                {order.address}
                <br />
                {order.city}, {order.postal_code}
                <br />
                Philippines
              </p>
            </div>
            <div>
              <h3>{order.product_name}</h3>
              <p>
                {order.size} / {order.color} × {order.quantity}
              </p>
              <strong>{money(order.total)} including shipping</strong>
              <p>
                Payment:{' '}
                <strong>
                  {order.payment_method === 'gcash'
                    ? 'GCash'
                    : order.payment_method === 'bank'
                      ? 'Bank transfer'
                      : 'Cash on delivery'}
                </strong>
              </p>
              {order.payment_details && (
                <p className="cms-copy">Instructions at order time: {order.payment_details}</p>
              )}
              <p>Notes: {order.notes || 'None'}</p>
            </div>
          </div>
          <label>
            Order status
            <select
              disabled={busy || demo}
              value={order.status}
              onChange={(e) => update(order, e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button className="button" disabled={busy || demo} onClick={() => update(order)}>
            Resend order emails
          </button>
          <p className="form-note">
            Only mark as paid after verifying payment separately. Resending sends the customer
            invoice and configured admin summary with the current order status. Both emails are
            retried, including any that were already delivered.
          </p>
        </section>
      )}
    </AdminLayout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { isAdmin } = await import('@/lib/auth');
  if (!(await isAdmin(req))) return { redirect: { destination: '/admin/login', permanent: false } };
  try {
    const { orderPage } = await import('@/lib/list-data');
    const result = await orderPage(query);
    if (query.page !== undefined && query.page !== String(result.paging.page))
      return {
        redirect: {
          destination: canonicalPage('/admin/orders', query, result.paging.page),
          permanent: false,
        },
      };
    return { props: { ...result, error: '', demo: false } };
  } catch {
    return {
      props: {
        orders: [],
        paging: pagination(0, 1),
        demo: false,
        error: 'Unable to load orders. Please try again.',
      },
    };
  }
};
