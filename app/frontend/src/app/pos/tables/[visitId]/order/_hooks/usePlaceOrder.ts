"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { placeOrder } from "@/lib/api/orders";
import { placeBody, previewOf, sendFailure, type CartAction, type CartState } from "../cart";

export function usePlaceOrder(
  visitId: string,
  state: CartState,
  dispatch: (action: CartAction) => void,
  onSent: (count: number) => void,
) {
  const sending = useRef(false);
  const mutation = useMutation({
    mutationFn: () => {
      const count = previewOf(state.lines).count;
      return placeOrder(visitId, placeBody(state.lines), state.idempotencyKey).then((order) => ({ order, count }));
    },
    onMutate: () => dispatch({ type: "pending", value: true }),
    onSuccess: (result) => onSent(result.count),
    onError: (error) => dispatch(sendFailure(error)),
    onSettled: () => {
      sending.current = false;
      dispatch({ type: "pending", value: false });
    },
  });

  function send(): void {
    if (sending.current || state.pending || state.closed || state.forbidden) return;
    if (state.lines.some((line) => line.unavailable) || !state.lines.some((line) => !line.unavailable)) return;
    sending.current = true;
    mutation.mutate();
  }

  return { send, pending: state.pending || mutation.isPending };
}
