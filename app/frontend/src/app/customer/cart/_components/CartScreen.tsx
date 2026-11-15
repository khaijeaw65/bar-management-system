"use client";

import { Button, Spinner } from "@heroui/react";
import { ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import { orderedLines, previewOf } from "@/lib/order/cart";
import { useCartContext } from "../../_hooks/cart-context";
import { useGuestSession } from "../../_hooks/useGuestSession";
import { useSendOrder } from "../../_hooks/useSendOrder";
import { CartFooter } from "./CartFooter";
import { CartLineRow } from "./CartLineRow";
import { CartNotice } from "./CartNotice";
import { NicknameRow } from "./NicknameRow";

export function CartScreen() {
  const router = useRouter();
  const { state, dispatch } = useCartContext();
  const { query } = useGuestSession();
  const { send, pending, redirecting, blocked } = useSendOrder(state, dispatch);
  const locked = pending || state.notice !== null;

  if (redirecting) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center text-text-muted">
        <Spinner size="lg" />
        <p className="text-body-md">กำลังส่งออเดอร์...</p>
      </div>
    );
  }

  if (state.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-text-muted">
        <ShoppingBasket aria-hidden className="size-10" />
        <p>ตะกร้ายังว่าง</p>
        <Button size="lg" variant="secondary" onPress={() => router.push("/customer/menu")}>
          เลือกเมนูเพิ่ม
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3 px-4 pt-4">
        <h2 className="text-heading">ตะกร้าของฉัน</h2>
        <NicknameRow name={query.data?.displayName ?? null} />
        <CartNotice state={state} />
        <ul>
          {orderedLines(state.lines).map((line) => (
            <CartLineRow key={line.id} line={line} locked={locked} dispatch={dispatch} />
          ))}
        </ul>
        <Button variant="ghost" className="min-h-11 self-start" onPress={() => router.push("/customer/menu")}>
          + เลือกเมนูเพิ่ม
        </Button>
      </div>
      <CartFooter total={previewOf(state.lines).total} pending={pending} blocked={blocked} onSend={send} />
    </div>
  );
}
