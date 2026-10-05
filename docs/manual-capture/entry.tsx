import React from 'react';
import { createRoot } from 'react-dom/client';
import { CaptureRouter } from './router';
import Overview from '../../pages/admin/index';
import Orders from '../../pages/admin/orders';
import Products from '../../pages/admin/products';
import Content from '../../pages/admin/content';
import Payments from '../../pages/admin/payments';
import Shipping from '../../pages/admin/shipping';
import Settings from '../../pages/admin/settings';
import Login from '../../pages/admin/login';
import { products as sampleProducts } from '../../scripts/fixtures/products';
import { defaultLanding } from '../../lib/landing-content';
import { pagination } from '../../lib/pagination';
import { defaultShippingSettings } from '../../lib/shipping-pricing';

const name = new URLSearchParams(location.search).get('screen') || 'overview';
const route = name === 'overview' ? '/admin' : '/admin/' + name;
const router = {
  pathname: route,
  asPath: route,
  query: {},
  push: async () => true,
  replace: async () => true,
};
const products = sampleProducts
  .slice(0, 5)
  .map((p, i) => ({ ...p, id: i + 1, availableSizes: ['S', 'M', 'L', 'XL'], active: i !== 4 }));
const orders = ['pending', 'paid', 'processing', 'shipped', 'cancelled'].map((status, i) => ({
  reference: 'LM-A1B2C3D' + i,
  customer_name: [
    'Sample Customer',
    'Demo Customer',
    'Example Buyer',
    'Sample Buyer',
    'Demo Buyer',
  ][i],
  email: 'customer' + (i + 1) + '@example.com',
  phone: '09XX XXX XXXX',
  address: 'Sample delivery address',
  city: 'Sample City',
  postal_code: '1000',
  product_name: products[0].name,
  size: 'M',
  color: products[0].color,
  quantity: 1,
  unit_price: 69000,
  items: [
    {
      productName: products[0].name,
      productSlug: products[0].slug,
      size: 'M',
      color: products[0].color,
      quantity: 1,
      unitPrice: 69000,
    },
  ],
  shipping: 12000,
  total: 81000,
  status,
  email_status: i === 0 ? 'failed' : 'sent',
  payment_method: 'cod',
  payment_details: '',
  notes: 'Sample order for this manual.',
  created_at: '2026-10-04 09:00:00',
  shipping_adjustments: [],
}));
const pages: any = {
  overview: (
    <Overview
      orders={orders as any}
      products={products}
      productCount={products.length}
      demo={false}
      error=""
      stats={{ total: 5, pending: 1, paid: 81000, emails: 1 }}
      emailUsage={{ limit: 300, remaining: 280, emailsPerOrder: 2, status: 'available' }}
    />
  ),
  orders: <Orders orders={orders as any} demo={false} error="" paging={pagination(5, 1)} />,
  products: <Products products={products} published={4} error="" paging={pagination(5, 1)} />,
  content: <Content content={defaultLanding} revision={1} error="" />,
  payments: (
    <Payments
      settings={{
        gcashEnabled: true,
        gcashDetails:
          'Send payment to your approved GCash account.\nUse the order reference as your payment note.',
        bankEnabled: true,
        bankDetails:
          'Use your approved bank recipient details.\nContact the store with your order reference.',
        codEnabled: true,
        qrEnabled: false,
        qrDetails: '',
        qrImageUrl: '',
      }}
      initialRevision={1}
    />
  ),
  shipping: (
    <Shipping
      settings={{ ...defaultShippingSettings, freeShippingThreshold: 200000 }}
      initialRevision={1}
    />
  ),
  settings: <Settings />,
  login: <Login />,
};
createRoot(document.getElementById('root')!).render(
  <CaptureRouter.Provider value={router}>{pages[name]}</CaptureRouter.Provider>,
);
