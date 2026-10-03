import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { sizes, type Product } from '@/lib/catalog';
const savedCart = z
  .array(
    z.object({
      product: z
        .object({
          slug: z.string(),
          name: z.string(),
          price: z.number().int().nonnegative(),
          color: z.string(),
          imageUrl: z.string().optional(),
          availableSizes: z.array(z.enum(sizes)).optional(),
        })
        .passthrough(),
      size: z.enum(sizes),
      quantity: z.number().int().min(1).max(10),
    }),
  )
  .max(20);
export type CartItem = { product: Product; size: string; quantity: number };
const CartContext = createContext<{
  items: CartItem[];
  isOpen: boolean;
  add: (product: Product, size?: string, quantity?: number) => void;
  update: (index: number, size: string, quantity: number) => void;
  remove: (index: number) => void;
  openCart: (open: boolean) => void;
  clear: () => void;
} | null>(null);
export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('Cart provider missing');
  return cart;
}
export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, openCart] = useState(false);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    try {
      const result = savedCart.safeParse(
        JSON.parse(localStorage.getItem('lightmare-cart') || '[]'),
      );
      if (result.success) setItems(result.data as CartItem[]);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem('lightmare-cart', JSON.stringify(items));
      } catch {}
    }
  }, [items, ready]);
  function add(product: Product, size = product.availableSizes?.[0] || 'M', quantity = 1) {
    const existing = items.find((item) => item.product.slug === product.slug && item.size === size);
    const message =
      existing && existing.quantity >= 10
        ? 'You can add up to 10 tees of each size.'
        : !existing && items.length >= 20
          ? 'Your cart is full. You can add up to 20 product and size combinations.'
          : `${product.name} added to cart.`;
    setToast((previous) => ({ message, id: (previous?.id || 0) + 1 }));
    setItems((current) => {
      const match = current.findIndex(
        (item) => item.product.slug === product.slug && item.size === size,
      );
      if (match >= 0)
        return current.map((item, index) =>
          index === match ? { ...item, quantity: Math.min(10, item.quantity + quantity) } : item,
        );
      if (current.length >= 20) return current;
      return [...current, { product, size, quantity: Math.min(10, Math.max(1, quantity)) }];
    });
  }
  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        add,
        update: (index, size, quantity) =>
          setItems((current) =>
            current.map((item, i) => (i === index ? { ...item, size, quantity } : item)),
          ),
        remove: (index) => setItems((current) => current.filter((_, i) => i !== index)),
        clear: () => setItems([]),
      }}
    >
      {children}
      {toast && (
        <div className="cart-toast" role="status" aria-live="polite" aria-atomic="true">
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => {
              setToast(null);
              openCart(true);
            }}
          >
            View cart
          </button>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}
