import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { LandingContent } from '@/lib/landing-content';

export default function HeroCarousel({ slides }: { slides: LandingContent['carouselSlides'] }) {
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
  const featured = slides[index % slides.length];
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
      <div className="hero-tee" key={featured.imageUrl}>
        <img src={featured.imageUrl} alt={featured.alt} />
      </div>
      <div className="round-stamp">
        WEAR IT YOUR WAY
        <br />
        <span>✳</span>
        <br />
        LIGHTMARE PH ORIGINALS
      </div>
      <span className="scribble carousel-scribble">your off-duty uniform ↗</span>
      <Link className="hero-caption" href="/shop">
        <span>
          LIGHTMARE PH
          <br />
          <small>Discover the collection</small>
        </span>
        <ArrowUpRight />
      </Link>
    </div>
  );
}
