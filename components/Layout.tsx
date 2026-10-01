import Link from 'next/link';
import Head from 'next/head';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { defaultLanding, type LandingContent } from '@/lib/landing-content';
export default function Layout({
  children,
  title = 'Good tees. No script.',
  content = defaultLanding,
}: {
  children: ReactNode;
  title?: string;
  content?: LandingContent;
}) {
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const { asPath } = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    async function checkSession() {
      try {
        const response = await fetch('/api/admin/session', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const session = response.ok ? await response.json() : null;
        if (!controller.signal.aborted) setAdmin(session?.authenticated === true);
      } catch {
        if (!controller.signal.aborted) setAdmin(false);
      }
    }
    void checkSession();
    window.addEventListener('focus', checkSession);
    return () => {
      controller.abort();
      window.removeEventListener('focus', checkSession);
    };
  }, [asPath]);
  return (
    <>
      <Head>
        <title>{`${title} — LIGHTMARE`}</title>
        <meta name="description" content={content.copy.metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="announcement">{content.copy.announcement}</div>
      <header className="header">
        <Link className="wordmark" href="/">
          lightmare<span>®</span>
        </Link>
        <nav className={open ? 'nav open' : 'nav'} aria-label="Main navigation">
          <Link href="/shop" onClick={() => setOpen(false)}>
            Shop tees
          </Link>
          <Link href="/#our-story" onClick={() => setOpen(false)}>
            Our story
          </Link>
          <Link href="/#size-guide" onClick={() => setOpen(false)}>
            Size guide
          </Link>
          <Link href="/#faq" onClick={() => setOpen(false)}>
            FAQs
          </Link>
        </nav>
        <div className="storefront-account">
          <Link className="header-shop" href={admin ? '/admin' : '/shop'}>
            {admin ? 'Back to admin' : 'Find your tee'} <ArrowUpRight size={17} />
          </Link>
        </div>
        <button
          className="menu"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      <main>{children}</main>
      <footer>
        <div className="footer-top">
          <Link className="wordmark" href="/">
            lightmare<span>®</span>
          </Link>
          <p>{content.copy.footerTagline}</p>
          <div>
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
            <a href={`mailto:${content.contactEmail}`}>Say hello ↗</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LIGHTMARE. A little out of line.</span>
          <span>{content.copy.footerNote}</span>
        </div>
      </footer>
    </>
  );
}
