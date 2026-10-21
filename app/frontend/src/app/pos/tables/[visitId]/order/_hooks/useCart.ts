"use client";

import { useReducer } from "react";
import { cartReducer, createCart, type CartAction, type CartState } from "../cart";

export function useCart(): { state: CartState; dispatch: (action: CartAction) => void } {
  const [state, dispatch] = useReducer(cartReducer, undefined, createCart);
  return { state, dispatch };
}
