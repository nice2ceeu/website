import { useRouter } from 'next/router';
import QuerySearch from '@/components/QuerySearch';
import Pagination from '@/components/Pagination';
import { queryText, pagination, canonicalPage, type Paging } from '@/lib/pagination';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { money, type Product } from '@/lib/catalog';
import type { GetServerSideProps } from 'next';
import { defaultLanding, type LandingContent } from '@/lib/landing-content';

export default function Shop({
  products,
  error,
  content,
  paging,
  colors,
}: {
  products: Product[];
  error: string;
  content: LandingContent;
  paging: Paging;
  colors: string[];
}) {
  const router = useRouter();
  const query = queryText(router.query.q),
    color = queryText(router.query.color) || 'all',
    sort = queryText(router.query.sort) || 'featured';
  const visible = products;
  function updateFilter(key: string, value: string) {
    const query = { ...router.query, [key]: value };
    delete query.page;
    void router.push({ pathname: router.pathname, query }, undefined, { scroll: false });
  }
  function reset() {
    void router.push('/shop', undefined, { scroll: false });
  }
  return (
    <Layout title="Shop all tees" content={content}>
      <section className="section shop-page">
        <Link className="back-link" href="/">
          Home / Shop
        </Link>
        <div className="section-heading">
          <div>
            <div className="eyebrow">THE EVERYDAY COLLECTION / 01</div>
            <h1>
              Find your <em>kind of tee.</em>
            </h1>
          </div>
          <p>
            Original designs. A little more you.
            <br />
            Browse the collection and make one yours.
          </p>
        </div>
        <div className="shop-controls">
          <label>
            Search tees
            <QuerySearch label="Search tees" placeholder="Search designs or colors…" />
          </label>
          <label>
            Color
            <select value={color} onChange={(event) => updateFilter('color', event.target.value)}>
              <option value="all">All colors</option>
              {colors.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select value={sort} onChange={(event) => updateFilter('sort', event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </label>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="shop-results">
          <span role="status">
            {paging.total} {paging.total === 1 ? 'tee' : 'tees'}
          </span>
          {(query || color !== 'all' || sort !== 'featured') && (
            <button className="text-link" onClick={reset}>
              Reset filters
            </button>
          )}
        </div>
        <div className="product-grid">
          {visible.map((product) => (
            <Link href={`/products/${product.slug}`} className="product-card" key={product.slug}>
              <div className="product-image" style={{ background: product.bg }}>
                <span className="product-number">LIGHTMARE PH ORIGINAL</span>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={`${product.name} in ${product.color}`} />
                ) : (
                  <div className="empty">Image coming soon</div>
                )}
                <span className="quick-shop">
                  Find your fit <ArrowUpRight size={17} />
                </span>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <span>{money(product.price)}</span>
              </div>
              <div className="product-meta">
                <span>
                  <i
                    aria-hidden="true"
                    style={{
                      background:
                        product.color === 'Blush'
                          ? '#dfb4b2'
                          : product.color === 'Butter'
                            ? '#ebdba6'
                            : '#ede8dd',
                    }}
                  />
                  {product.color}
                </span>
                <span>{product.availableSizes?.join(' / ')}</span>
              </div>
            </Link>
          ))}
        </div>
        <Pagination paging={paging} />
        {!visible.length && (
          <div className="shop-empty">
            <h2>
              No tees found <em>just yet.</em>
            </h2>
            <p>Try another search or clear your filters to see the full collection.</p>
            <button className="button" onClick={reset}>
              Show all tees <ArrowUpRight size={18} />
            </button>
          </div>
        )}
        <p className="sample-note">
          Preview collection — sample designs and prices. Product images are illustrative mockups.
        </p>
      </section>
    </Layout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { productPage } = await import('@/lib/list-data');
    const { db } = await import('@/lib/db');
    const { getLanding } = await import('@/lib/cms');
    const [result, cmsResult, [rows]] = await Promise.all([
      productPage(query, false, 12),
      getLanding()
        .then((cms) => cms.content)
        .catch(() => defaultLanding),
      db().query(
        'SELECT DISTINCT color FROM products WHERE active=TRUE AND deleted_at IS NULL ORDER BY color',
      ),
    ]);
    if (query.page !== undefined && query.page !== String(result.paging.page))
      return {
        redirect: {
          destination: canonicalPage('/shop', query, result.paging.page),
          permanent: false,
        },
      };
    return {
      props: {
        ...result,
        colors: (rows as { color: string }[]).map((row) => row.color),
        content: cmsResult,
        error: '',
      },
    };
  } catch {
    res.statusCode = 503;
    return {
      props: {
        products: [],
        paging: pagination(0, 1, 12),
        colors: [],
        content: defaultLanding,
        error: 'The collection is temporarily unavailable. Please try again later.',
      },
    };
  }
};
