"use client";

import { toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { placeOrder } from "@/lib/api/customer";
import { sendFailure, type CartAction, type CartState } from "@/lib/order/cart";
import { customerBody } from "../_lib/menu";

export function useSendOrder(state: CartState, dispatch: (action: CartAction) => void) {
  const router = useRouter();
  const sending = useRef(false);
  const mutation = useMutation({
    // The key stays in the cart state until a 201, so a retry after a network error never duplicates the order.
    mutationFn: () => placeOrder(customerBody(state.lines), state.idempotencyKey),
    onMutate: () => dispatch({ type: "pending", value: true }),
    onSuccess: (order) => {
      dispatch({ type: "reset" });
      toast.success(`ส่งออเดอร์แล้ว · #${String(order.orderNumber).padStart(3, "0")}`);
      router.replace("/customer/menu");
    },
    onError: (error) => dispatch(sendFailure(error)),
    onSettled: () => {
      sending.current = false;
      dispatch({ type: "pending", value: false });
    },
  });

  const blocked = state.lines.some((line) => line.unavailable) || !state.lines.some((line) => !line.unavailable);

  function send(): void {
    if (sending.current || state.pending || state.closed || state.notice === "reused" || blocked) return;
    sending.current = true;
    mutation.mutate();
  }

  return { send, pending: state.pending || mutation.isPending, blocked };
}
