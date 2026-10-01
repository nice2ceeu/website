import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Package, Heart, Sun } from 'lucide-react';
import Layout from '@/components/Layout';
import { money, store, type Product } from '@/lib/catalog';
import type { GetServerSideProps } from 'next';
import { defaultLanding, type LandingContent } from '@/lib/landing-content';
export default function Home({
  products,
  error,
  content,
}: {
  products: Product[];
  error: string;
  content: LandingContent;
}) {
  const c = content.copy;
  const featured = products.find((p) => p.slug === content.featuredSlug) || products[0];
  return (
    <Layout title={c.metaTitle} content={content}>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="little-line" /> {c.heroEyebrow}
          </div>
          <h1>
            {c.heroTitle}
            <br />
            <em>{c.heroAccent}</em>
            <span className="hero-star">✳</span>
          </h1>
          <p className="cms-copy">{c.heroDescription}</p>
          <Link className="button" href="/shop">
            {c.heroButton} <ArrowUpRight size={19} />
          </Link>
          <div className="hero-note">{c.heroNote}</div>
        </div>
        <div className="hero-visual">
          <div className="edition">
            THE EVERYDAY COLLECTION <span>VOL. 01 / 2026</span>
          </div>
          <div className="hero-tee">
            {featured ? (
              featured.imageUrl ? (
                <img src={featured.imageUrl} alt={featured.name} />
              ) : (
                <div className="empty">Image coming soon</div>
              )
            ) : (
              <div className="empty">New favorites are on their way.</div>
            )}
          </div>
          <div className="round-stamp">
            WEAR IT YOUR WAY
            <br />
            <span>✳</span>
            <br />
            LIGHTMARE ORIGINALS
          </div>
          <span className="scribble">your off-duty uniform ↗</span>
          <Link className="hero-caption" href={featured ? `/products/${featured.slug}` : '/shop'}>
            <span>
              {featured?.name || 'EXPLORE LIGHTMARE'}
              <br />
              <small>
                {featured
                  ? `${featured.color} / ${money(featured.price)}`
                  : 'Discover the collection'}
              </small>
            </span>
            <ArrowUpRight />
          </Link>
        </div>
      </section>
      <div className="ticker">
        {content.ticker.map((text, i) => (
          <span key={i}>{text} ✳</span>
        ))}
      </div>
      <section className="section collection" id="tees">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{c.collectionLabel}</div>
            <h2>
              {c.collectionTitle} <em>{c.collectionAccent}</em>
            </h2>
          </div>
          <p className="cms-copy">{c.collectionDescription}</p>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p, i) => (
            <Link href={`/products/${p.slug}`} className="product-card" key={p.slug}>
              <div className="product-image" style={{ background: p.bg }}>
                <span className="product-number">0{i + 1} / ORIGINAL</span>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={`${p.name} in ${p.color}`} />
                ) : (
                  <div className="empty">Image coming soon</div>
                )}
                <span className="quick-shop">
                  Find your fit <ArrowUpRight size={17} />
                </span>
              </div>
              <div className="product-info">
                <h3>{p.name}</h3>
                <span>{money(p.price)}</span>
              </div>
              <div className="product-meta">
                <span>
                  <i
                    style={{
                      background:
                        p.color === 'Blush'
                          ? '#dfb4b2'
                          : p.color === 'Butter'
                            ? '#ebdba6'
                            : '#ede8dd',
                    }}
                  />
                  {p.color}
                </span>
                <span>{p.availableSizes?.join(' / ')}</span>
              </div>
            </Link>
          ))}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Link className="text-link" href="/shop">
          Browse all products →
        </Link>
        <p className="sample-note">{c.collectionNote}</p>
      </section>
      <section className="story" id="our-story">
        <div className="story-art">
          <span>
            {c.storyArt}
            <br />
            <em>{c.storyArtAccent}</em>
          </span>
          <div>✳</div>
          <small>THE LIGHTMARE STATE OF MIND</small>
        </div>
        <div className="story-copy">
          <div className="eyebrow">{c.storyEyebrow}</div>
          <h2>
            {c.storyTitle} <em>{c.storyAccent}</em>
          </h2>
          <p className="cms-copy">{c.storyBody}</p>
          <a className="text-link" href="/shop">
            Find your kind of everyday <ArrowRight size={18} />
          </a>
        </div>
      </section>
      <section className="section" id="size-guide">
        <div className="section-heading">
          <div>
            <div className="eyebrow">A GOOD FIT CHANGES EVERYTHING</div>
            <h2>
              {c.sizeTitle} <em>{c.sizeAccent}</em>
            </h2>
          </div>
          <p className="cms-copy">{c.sizeIntro}</p>
        </div>
        <div className="size-layout">
          <div>
            <h3>{c.sizeFitTitle}</h3>
            <p className="cms-copy">{c.sizeBody}</p>
            <small>{c.sizeNote}</small>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SIZE</th>
                  {content.measurements.map((row) => (
                    <th key={row.size}>{row.size}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Width (cm)</th>
                  {content.measurements.map((row) => (
                    <td key={row.size}>{row.width}</td>
                  ))}
                </tr>
                <tr>
                  <th>Length (cm)</th>
                  {content.measurements.map((row) => (
                    <td key={row.size}>{row.length}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="ordering section" id="how-to-order">
        <div className="eyebrow">FROM OUR LITTLE WORLD TO YOUR WARDROBE</div>
        <h2>
          {c.orderTitle} <em>{c.orderAccent}</em>
        </h2>
        <div className="steps">
          {content.steps.map(({ title: name, body: desc }, i) => (
            <div key={name}>
              <span>0{i + 1}</span>
              <h3>{name}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="shipping section" id="shipping">
        <div>
          <Package />
          <h3>{c.shippingTitle}</h3>
          <p>
            {c.shippingAreas}
            <br />
            Flat-rate shipping: {money(store.shipping)} per order.
            <br />
            {c.shippingEstimate}
          </p>
        </div>
        <div>
          <Heart />
          <h3>{c.careTitle}</h3>
          <p className="cms-copy">{c.careBody}</p>
        </div>
        <div>
          <Sun />
          <h3>{c.everydayTitle}</h3>
          <p className="cms-copy">{c.everydayBody}</p>
        </div>
      </section>
      <section className="section faq" id="faq">
        <div>
          <div className="eyebrow">THE NEED-TO-KNOWS</div>
          <h2>
            {c.faqTitle} <em>{c.faqAccent}</em>
          </h2>
          <p>
            Still curious? <a href={`mailto:${content.contactEmail}`}>Say hello ↗</a>
          </p>
        </div>
        <div>
          {content.faqs.map(({ question: q, answer: a }, i) => (
            <details key={i}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="social-section">
        <div className="eyebrow">THE LIGHTMARE CLUB</div>
        <h2>
          {c.socialTitle} <em>{c.socialAccent}</em>
        </h2>
        <p>{c.socialBody}</p>
        <div className="social-links">
          {content.instagram ? (
            <a href={content.instagram}>Instagram ↗</a>
          ) : (
            <span>Instagram · coming soon</span>
          )}
          {content.tiktok ? (
            <a href={content.tiktok}>TikTok ↗</a>
          ) : (
            <span>TikTok · coming soon</span>
          )}
        </div>
      </section>
      <section className="bottom-cta">
        <span>✳</span>
        <div>
          <div className="eyebrow">{c.ctaEyebrow}</div>
          <h2>
            {c.ctaTitle} <em>{c.ctaAccent}</em>
          </h2>
        </div>
        <Link className="button light" href="/shop">
          {c.ctaButton} <ArrowUpRight size={19} />
        </Link>
      </section>
    </Layout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { getProducts } = await import('@/lib/products');
    const { getLanding } = await import('@/lib/cms');
    const [products, cms] = await Promise.all([getProducts(), getLanding()]);
    return { props: { products, content: cms.content, error: '' } };
  } catch {
    res.statusCode = 503;
    return {
      props: {
        products: [],
        content: defaultLanding,
        error: 'The collection is temporarily unavailable. Please try again later.',
      },
    };
  }
};
