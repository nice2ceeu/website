export const store = {
  name: 'LIGHTMARE',
  currency: 'PHP',
  shipping: 12000,
  country: 'Philippines',
  email: 'hello@example.com',
  instagram: '',
  tiktok: '',
};
export const sizes = ['XS', 'S', 'M', 'L', 'XL'] as const;
export type Product = {
  slug: string;
  name: string;
  caption: string;
  price: number;
  color: string;
  ink: string;
  design: string;
  sub: string;
  tag: string;
  bg: string;
  id?: number;
  imageUrl?: string;
  availableSizes?: string[];
  active?: boolean;
};
export function money(cents: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: store.currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
