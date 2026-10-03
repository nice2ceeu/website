import { useEffect, useRef, useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { useCart } from './CartProvider';
import CartCheckout from './CartCheckout';
import { money, sizes } from '@/lib/catalog';
import type { PaymentSettings } from '@/lib/payment-settings';
export default function Cart() {
  const { items, isOpen, openCart, update, remove } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  useEffect(() => {
    if (!isOpen) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
    setCompleted(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controller = new AbortController();
    setSettings(null);
    setError('');
    fetch('/api/payment-options', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Payment options are unavailable. Please try again.');
        return response.json();
      })
      .then(setSettings)
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => {
      controller.abort();
      document.body.style.overflow = previous;
    };
  }, [isOpen, retry]);
  return (
    <>
      <button
        type="button"
        className="header-cart"
        aria-label={`Open cart, ${count} items`}
        aria-haspopup="dialog"
        onClick={() => openCart(true)}
      >
        <ShoppingBag size={22} />
        <span>{count}</span>
      </button>
      <dialog
        ref={dialog}
        className="cart-dialog"
        aria-labelledby="cart-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        onClose={() => openCart(false)}
      >
        <div className="cart-heading">
          <h2 id="cart-title">Your cart</h2>
          <button
            type="button"
            disabled={busy}
            autoFocus
            aria-label="Close cart"
            onClick={() => openCart(false)}
          >
            <X />
          </button>
        </div>
        {!items.length && !completed && (
          <p>Your cart is empty. Add a tee from the collection to get started.</p>
        )}
        {!!items.length && (
          <>
            <fieldset disabled={busy} className="cart-checkout-fields">
              <div className="cart-items">
                {items.map((item, index) => (
                  <div className="cart-item" key={item.product.slug + ':' + index}>
                    {item.product.imageUrl && (
                      <img src={item.product.imageUrl} alt={item.product.name} />
                    )}
                    {!item.product.imageUrl && (
                      <div className="cart-image-placeholder" aria-hidden="true" />
                    )}
                    <div>
                      <h3>{item.product.name}</h3>
                      <p>
                        {item.product.color} · {money(item.product.price)}
                      </p>
                      <div className="cart-item-controls">
                        <label>
                          Size
                          <select
                            value={item.size}
                            onChange={(event) => update(index, event.target.value, item.quantity)}
                          >
                            {(item.product.availableSizes || sizes).map((size) => (
                              <option key={size}>{size}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Quantity
                          <select
                            value={item.quantity}
                            onChange={(event) =>
                              update(index, item.size, Number(event.target.value))
                            }
                          >
                            {Array.from({ length: 10 }, (_, i) => (
                              <option key={i} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => remove(index)}
                          aria-label={`Remove ${item.product.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <strong>{money(item.product.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </fieldset>
            <div className="totals">
              <div>
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
            </div>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}{' '}
            <button
              type="button"
              className="text-link"
              onClick={() => setRetry((value) => value + 1)}
            >
              Retry
            </button>
          </p>
        )}
        {isOpen && settings && (
          <CartCheckout
            settings={settings}
            onBusyChange={setBusy}
            onSuccess={() => setCompleted(true)}
          />
        )}
        {isOpen && !settings && !error && !!items.length && <p role="status">Loading checkout…</p>}
      </dialog>
    </>
  );
}
