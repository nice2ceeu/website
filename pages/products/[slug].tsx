import { useState } from 'react';
import { useCart } from '@/components/CartProvider';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Minus, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import SizeGuide from '@/components/SizeGuide';
import { Product, money, sizes } from '@/lib/catalog';
import { defaultLanding, type LandingContent } from '@/lib/landing-content';
export default function ProductPage({
  product,
  content,
}: {
  product: Product;
  content: LandingContent;
}) {
  return <ProductDetail key={product.slug} product={product} content={content} />;
}
function ProductDetail({ product, content }: { product: Product; content: LandingContent }) {
  const { add } = useCart();
  const [size, setSize] = useState(product.availableSizes?.[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  return (
    <Layout title={product.name} content={content}>
      <div className="product-page section">
        <Link className="back-link" href="/shop">
          ← Back to the collection
        </Link>
        <div className="product-detail">
          <div>
            <div className="detail-image" style={{ background: product.bg }}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={`${product.name} in ${product.color}`} />
              ) : (
                <div className="empty">Image coming soon</div>
              )}
            </div>
            <p className="sample-note">Sample product · illustrative design mockup</p>
          </div>
          <div>
            <div className="eyebrow">LIGHTMARE PH ORIGINAL / VOL. 01</div>
            <h1>{product.name}</h1>
            <div className="detail-price">{money(product.price)}</div>
            <p>
              {product.caption} An easy, relaxed silhouette for days that don’t need a dress code.
            </p>
            <div className="choice-label">
              COLOR <strong>{product.color}</strong>
            </div>
            <div className="color-choice">● {product.color}</div>
            <div className="choice-label">
              SIZE <SizeGuide content={content} />
            </div>
            <div className="sizes">
              {(product.availableSizes || sizes).map((s) => (
                <button
                  type="button"
                  key={s}
                  aria-pressed={size === s}
                  className={size === s ? 'selected' : ''}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="quantity-row">
              <span>QUANTITY</span>
              <div>
                <button
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus size={14} />
                </button>
                <span>{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  disabled={quantity >= 10}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <button
              className="button wide"
              type="button"
              onClick={() => {
                add(product, size, quantity);
              }}
            >
              Add to cart <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { getProduct } = await import('@/lib/products');
  const product = await getProduct(String(params?.slug || ''));
  if (!product) return { notFound: true };
  const { getLanding } = await import('@/lib/cms');
  const content = await getLanding()
    .then((landing) => landing.content)
    .catch(() => defaultLanding);
  return { props: { product, content } };
};
