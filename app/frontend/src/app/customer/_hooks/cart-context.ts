"use client";

import { createContext, useContext } from "react";
import type { CartAction, CartState } from "@/lib/order/cart";

export interface CartContextValue {
  state: CartState;
  dispatch: (action: CartAction) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCartContext(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCartContext must be used inside CartProvider");
  return value;
}
