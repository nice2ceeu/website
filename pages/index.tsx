import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import Layout from '@/components/Layout';
import { money, type Product } from '@/lib/catalog';
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
  const { add } = useCart();
  const c = content.copy;
  const [aboutOpen, setAboutOpen] = useState(false);
  const slider = useRef<HTMLDivElement>(null);
  const lastProduct = useRef<HTMLDivElement>(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [canSlideLeft, setCanSlideLeft] = useState(false);
  const [canSlideRight, setCanSlideRight] = useState(false);
  function updateSlider() {
    const element = slider.current;
    if (!element) return;
    setCanSlideLeft(element.scrollLeft > 1);
    setCanSlideRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }
  function slide(direction: number) {
    const element = slider.current;
    const card = element?.querySelector<HTMLElement>('.product-card');
    if (!element || !card) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  useEffect(() => {
    const element = slider.current;
    if (!element) return;
    updateSlider();
    const resize = new ResizeObserver(updateSlider);
    resize.observe(element);
    const last = lastProduct.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) setShowBrowse(true);
      },
      { root: element, threshold: 0.6 },
    );
    if (last) observer.observe(last);
    return () => {
      resize.disconnect();
      observer.disconnect();
    };
  }, [products.length, showBrowse]);
  useEffect(() => {
    if (window.location.hash || window.scrollY > 0 || !products.length) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;
    const timer = window.setTimeout(() => {
      if (!reducedMotion.matches && window.scrollY === 0) {
        document.getElementById('tees')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 3000);
    const cancel = () => window.clearTimeout(timer);
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    events.forEach((event) => window.addEventListener(event, cancel, { passive: true }));
    return () => {
      cancel();
      events.forEach((event) => window.removeEventListener(event, cancel));
    };
  }, [products.length]);

  return (
    <Layout title={c.metaTitle} content={content}>
      <section
        className="hero reference-hero"
        style={
          {
            '--hero-text': content.hero.textColor,
            '--hero-button': content.hero.buttonColor,
            '--hero-button-text': content.hero.buttonTextColor,
          } as CSSProperties
        }
      >
        <div className="hero-copy">
          <h1>{content.hero.title}</h1>
          <p className="cms-copy">{content.hero.subtitle}</p>
          <Link className="button" href={content.hero.buttonHref}>
            {content.hero.button}
          </Link>
        </div>
        <div className="hero-visual">
          <div className="hero-tee">
            <img
              src={content.hero.imageUrl}
              alt={content.hero.alt}
              style={{ objectPosition: `${content.hero.imagePosition}% center` }}
              fetchPriority="high"
            />
          </div>
        </div>
      </section>
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
        <div className="collection-slider-controls" aria-label="Collection controls">
          <button
            type="button"
            aria-label="Previous products"
            aria-controls="featured-products"
            disabled={!canSlideLeft}
            onClick={() => slide(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next products"
            aria-controls="featured-products"
            disabled={!canSlideRight}
            onClick={() => slide(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div
          className="product-grid collection-slider"
          id="featured-products"
          ref={slider}
          onScroll={updateSlider}
          tabIndex={0}
          aria-label="Featured products. Swipe or use the arrow buttons to browse."
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              event.preventDefault();
              slide(event.key === 'ArrowRight' ? 1 : -1);
            }
          }}
        >
          {products.slice(0, 6).map((p, i) => (
            <div
              className="product-card"
              key={p.slug}
              ref={i === Math.min(products.length, 6) - 1 ? lastProduct : undefined}
            >
              <Link
                href={`/products/${p.slug}`}
                className="product-image"
                style={{ background: p.bg }}
              >
                <span className="product-number">0{i + 1} / ORIGINAL</span>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={`${p.name} in ${p.color}`} />
                ) : (
                  <div className="empty">Image coming soon</div>
                )}
              </Link>
              <button
                type="button"
                className="quick-shop"
                onClick={() => {
                  add(p);
                }}
              >
                Add to cart <ArrowUpRight size={17} />
              </button>
              <div className="product-info">
                <h3>
                  <Link href={`/products/${p.slug}`}>{p.name}</Link>
                </h3>
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
            </div>
          ))}
          {(showBrowse || !products.length) && (
            <Link href="/shop" className="collection-browse-card">
              <span>Discover the full collection</span>
              <strong>Browse all products</strong>
              <ArrowRight size={28} aria-hidden="true" />
            </Link>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="sample-note">{c.collectionNote}</p>
      </section>
      <section className="section about-section" id="about-us" aria-labelledby="about-label">
        <div className="eyebrow" id="about-label">
          {c.aboutLabel}
        </div>
        {c.aboutHeading && <h2 className="cms-copy">{c.aboutHeading}</h2>}
        {c.aboutBody && <p className="cms-copy">{c.aboutBody}</p>}
        <button
          type="button"
          className="button about-toggle"
          aria-expanded={aboutOpen}
          aria-controls="about-description"
          onClick={() => setAboutOpen((open) => !open)}
        >
          {c.aboutToggleText}
          <span aria-hidden="true">{aboutOpen ? '−' : '+'}</span>
        </button>
        <div id="about-description" className="about-description" hidden={!aboutOpen}>
          <p className="cms-copy">{c.aboutDescription}</p>
        </div>
      </section>
      <div className="ticker">
        {content.ticker.map((text, i) => (
          <span key={i}>{text} ✳</span>
        ))}
      </div>
      <section className="story" id="our-story">
        <div className="story-art">
          <span>
            {c.storyArt}
            <br />
            <em>{c.storyArtAccent}</em>
          </span>
          <div>✳</div>
          <small>THE LIGHTMARE PH STATE OF MIND</small>
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
      <section className="contact-section section" id="contact" aria-labelledby="contact-title">
        <Mail size={24} aria-hidden="true" />
        <h2 id="contact-title">HOW CAN I CONTACT YOU</h2>
        <p>Send us a DM on Instagram, Tiktok or email.</p>
        <a className="button" href="#social-links">
          Here <ArrowUpRight size={18} aria-hidden="true" />
        </a>
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
  const { getProducts } = await import('@/lib/products');
  const { getLanding } = await import('@/lib/cms');
  const [productResult, cmsResult] = await Promise.allSettled([
    getProducts(false, 6),
    getLanding(),
  ]);
  if (productResult.status === 'rejected') {
    res.statusCode = 503;
  }
  return {
    props: {
      products: productResult.status === 'fulfilled' ? productResult.value : [],
      content: cmsResult.status === 'fulfilled' ? cmsResult.value.content : defaultLanding,
      error:
        productResult.status === 'rejected'
          ? 'The collection is temporarily unavailable. Please try again later.'
          : '',
    },
  };
};
