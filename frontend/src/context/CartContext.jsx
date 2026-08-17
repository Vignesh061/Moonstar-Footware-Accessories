/**
 * CartContext — localStorage-backed cart with React Context.
 *
 * Structured so it can later be swapped for a server-side cart
 * without changing any consumer components (same API surface).
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'moonstar_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCart());

  // Persist on every change
  useEffect(() => {
    saveCart(items);
  }, [items]);

  /** Add a product to cart, or increase quantity if already present.
   *  selectedAttributes: { Color: 'Black', Size: '32', ... } */
  const addItem = useCallback((product, quantity = 1, selectedAttributes = {}) => {
    setItems((prev) => {
      // Key = product id + sorted attribute string so same product with
      // different attributes is treated as a separate cart line.
      const attrKey = Object.entries(selectedAttributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
      const cartKey = `${product.id}__${attrKey}`;

      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          cartKey,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          price: product.price,
          originalPrice: product.originalPrice ?? product.original_price,
          discount: product.discount ?? product.discount_percent,
          selectedAttributes,
          quantity,
          stock: product.stock,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((cartKey) => {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  }, []);

  const updateQuantity = useCallback((cartKey, quantity) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
