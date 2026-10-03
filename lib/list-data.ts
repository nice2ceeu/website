import type { RowDataPacket } from 'mysql2';
import { db } from './db';
import { fromRow } from './products';
import { pagination, pageNumber, queryText, type Query } from './pagination';
import type { Order } from './admin-data';
import { statuses } from './validation';
import { readOrderItems } from './order-items';

const literalLike = (value: string) =>
  `%${value.replace(/[!%_]/g, (character) => '!' + character)}%`;
export async function productPage(query: Query, admin = false, pageSize = 10) {
  const q = queryText(query.q),
    color = queryText(query.color),
    sort = queryText(query.sort);
  const clauses = ['deleted_at IS NULL'];
  const values: unknown[] = [];
  if (!admin) clauses.push('active=TRUE');
  if (q) {
    clauses.push(
      "(name LIKE ? ESCAPE '!' OR slug LIKE ? ESCAPE '!' OR caption LIKE ? ESCAPE '!' OR color LIKE ? ESCAPE '!')",
    );
    values.push(...Array(4).fill(literalLike(q)));
  }
  if (!admin && color && color !== 'all') {
    clauses.push('color=?');
    values.push(color);
  }
  const where = clauses.join(' AND ');
  const [counts] = await db().query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,COALESCE(SUM(active=TRUE),0) AS published FROM products WHERE ${where}`,
    values,
  );
  const paging = pagination(Number(counts[0].total), pageNumber(query.page), pageSize);
  const order = admin
    ? 'id DESC'
    : {
        'price-low': 'price ASC,id ASC',
        'price-high': 'price DESC,id ASC',
        name: 'name ASC,id ASC',
      }[sort] || 'id ASC';
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT * FROM products WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...values, pageSize, paging.offset],
  );
  return { products: rows.map(fromRow), paging, published: Number(counts[0].published) };
}
export async function orderPage(query: Query, pageSize = 10) {
  const q = queryText(query.q),
    status = queryText(query.status);
  const clauses = ['1=1'];
  const values: unknown[] = [];
  if (q) {
    clauses.push(
      "(reference LIKE ? ESCAPE '!' OR customer_name LIKE ? ESCAPE '!' OR email LIKE ? ESCAPE '!')",
    );
    values.push(...Array(3).fill(literalLike(q)));
  }
  if (statuses.includes(status as (typeof statuses)[number])) {
    clauses.push('status=?');
    values.push(status);
  }
  const where = clauses.join(' AND ');
  const [counts] = await db().query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM orders WHERE ${where}`,
    values,
  );
  const paging = pagination(Number(counts[0].total), pageNumber(query.page), pageSize);
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT * FROM orders WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`,
    [...values, pageSize, paging.offset],
  );
  return {
    orders: JSON.parse(
      JSON.stringify(
        rows.map((row) => ({
          ...row,
          items: readOrderItems(row as Parameters<typeof readOrderItems>[0]),
        })),
      ),
    ) as Order[],
    paging,
  };
}
export async function overviewData() {
  const [orders, products, [stats]] = await Promise.all([
    orderPage({}, 5),
    productPage({}, true, 5),
    db().query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total,COALESCE(SUM(status='pending'),0) AS pending,COALESCE(SUM(CASE WHEN status IN ('paid','processing','shipped') THEN total ELSE 0 END),0) AS paid,COALESCE(SUM(email_status IN ('pending','failed')),0) AS emails FROM orders",
    ),
  ]);
  return {
    orders: orders.orders,
    products: products.products,
    productCount: products.paging.total,
    stats: {
      total: Number(stats[0].total),
      pending: Number(stats[0].pending),
      paid: Number(stats[0].paid),
      emails: Number(stats[0].emails),
    },
  };
}
