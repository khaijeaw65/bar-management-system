"use client";

import { useEffect, useReducer } from "react";
import { cartReducer, type CartAction, type CartState } from "@/lib/order/cart";
import { loadCart, saveCart } from "../_lib/cart-storage";

export function useCustomerCart(sessionId: string): { state: CartState; dispatch: (action: CartAction) => void } {
  const [state, dispatch] = useReducer(cartReducer, sessionId, loadCart);
  useEffect(() => {
    saveCart(sessionId, state);
  }, [sessionId, state]);
  return { state, dispatch };
}
