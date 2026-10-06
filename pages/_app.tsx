import type { AppProps } from 'next/app';
import Head from 'next/head';
import CartProvider from '@/components/CartProvider';
import '@/styles/globals.css';
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" key="favicon" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" key="favicon-png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
          key="apple-touch-icon"
        />
      </Head>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </>
  );
}

