import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { money, type Product } from '@/lib/catalog';
export default function HeroCarousel({ products }: { products: Product[] }) {
  const slides = products.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduced(query.matches);
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (reduced || hover || focused || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % slides.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [reduced, hover, focused, slides.length]);
  const featured = slides[index % (slides.length || 1)];
  return (
    <div
      className="hero-visual"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false);
      }}
    >
      <div className="edition">
        THE EVERYDAY COLLECTION <span>VOL. 01 / 2026</span>
      </div>
      <div className="hero-tee" key={featured?.slug}>
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
      <span className="scribble carousel-scribble">your off-duty uniform ↗</span>
      <Link className="hero-caption" href={featured ? `/products/${featured.slug}` : '/shop'}>
        <span>
          {featured?.name || 'EXPLORE LIGHTMARE'}
          <br />
          <small>
            {featured ? `${featured.color} / ${money(featured.price)}` : 'Discover the collection'}
          </small>
        </span>
        <ArrowUpRight />
      </Link>
    </div>
  );
}
