import React, { createContext, useContext, useEffect, useState } from 'react';

type CartItem = { crop_id: string; name: string; price_per_unit: number; quantity: number; farmer_id: string; farmer_name?: string };

const STORAGE_KEY = 'agri_cart_v1';

const CartContext = createContext<any>(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as CartItem[] : [];
    } catch (e) {
      console.warn('Failed to read cart from localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to write cart to localStorage', e);
    }
  }, [items]);

  const add = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.crop_id === item.crop_id);
      if (existing) {
        return prev.map(i => i.crop_id === item.crop_id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (crop_id: string, quantity: number) => {
    setItems(prev => prev.map(i => i.crop_id === crop_id ? { ...i, quantity: Math.max(0, Math.floor(quantity)) } : i).filter(i => i.quantity > 0));
  };

  const remove = (crop_id: string) => setItems(prev => prev.filter(i => i.crop_id !== crop_id));
  const clearForFarmer = (farmer_id: string) => setItems(prev => prev.filter(i => i.farmer_id !== farmer_id));
  const clearAll = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, add, updateQuantity, remove, clearForFarmer, clearAll }}>
      {children}
    </CartContext.Provider>
  );
};
