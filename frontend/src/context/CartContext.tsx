import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { MOCK_PRODUCTS } from '../data/mockData';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  shipping: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ordershield_cart');
    if (saved) {
      try {
        const parsed: CartItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => {
              const fresh = MOCK_PRODUCTS.find((p) => p.id === item.product?.id || p.sku === item.product?.sku);
              if (fresh) {
                return { ...item, product: fresh };
              }
              return item;
            })
            .filter((item) => MOCK_PRODUCTS.some((p) => p.id === item.product?.id));
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('ordershield_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: Math.min(product.stockQuantity, i.quantity + quantity) } : i
        );
      }
      return [...prev, { id: Date.now(), product, quantity: Math.min(product.stockQuantity, quantity) }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: Math.min(i.product.stockQuantity, quantity) } : i
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemCount,
        subtotal,
        shipping,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
