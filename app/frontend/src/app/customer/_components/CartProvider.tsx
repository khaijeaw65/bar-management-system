"use client";

import { useEffect, type ReactNode } from "react";
import { useCustomerCart } from "../_hooks/useCustomerCart";
import { CartContext } from "../_hooks/cart-context";
import { useCustomerMenu } from "../_hooks/useCustomerMenu";

export function CartProvider({ sessionId, children }: Readonly<{ sessionId: string; children: ReactNode }>) {
  const cart = useCustomerCart(sessionId);
  const items = useCustomerMenu().data?.items;
  const { dispatch } = cart;

  // A refetched menu can sell a line out; flag it so the cart blocks the send (the server still has the last word).
  useEffect(() => {
    if (items) dispatch({ type: "sync", items });
  }, [items, dispatch]);

  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}
