"use client";

import { Alert, Button } from "@heroui/react";
import { formatTHB } from "@/lib/utils/format";
import { orderedLines, previewOf, type CartAction, type CartState } from "../cart";
import { CartLineRow } from "./CartLine";
import { usePlaceOrder } from "../_hooks/usePlaceOrder";

function alertCopy(state: CartState): { title: string; body: string } | null {
  const blocked = state.lines.filter((line) => line.unavailable).length;
  if (state.notice === "network" && blocked > 0) {
    return { title: "ส่งออเดอร์ไม่สำเร็จ", body: "มีรายการหมดระหว่างรอ — ส่งตะกร้านี้ซ้ำไม่ได้ ทิ้งตะกร้าแล้วสั่งใหม่" };
  }
  if (blocked > 0) return { title: `มีรายการที่สั่งไม่ได้ ${blocked} รายการ`, body: "ลบออกก่อนจึงจะส่งได้" };
  if (state.closed) return { title: "โต๊ะนี้ถูกปิดแล้ว", body: "ออเดอร์ไม่ถูกส่ง — กลับไปที่โต๊ะแล้วเลือกใหม่" };
  if (state.forbidden) {
    return { title: "บัญชีนี้ไม่มีสิทธิ์ส่งออเดอร์แล้ว", body: "ตะกร้ายังอยู่ — ให้ผู้จัดการตรวจสิทธิ์ หรือให้พนักงานอื่นส่งแทน" };
  }
  if (state.notice === "network") return { title: "ส่งออเดอร์ไม่สำเร็จ", body: "ตะกร้ายังอยู่ครบ — ส่งซ้ำจะไม่เกิดออเดอร์ซ้ำ" };
  if (state.notice === "reused") return { title: "ออเดอร์นี้อาจถูกส่งไปแล้ว", body: "ตรวจที่โต๊ะก่อนสั่งเพิ่ม" };
  return null;
}

function CartFooter({
  total,
  pending,
  sendDisabled,
  blocked,
  notice,
  onSend,
  onLeave,
}: Readonly<{
  total: string;
  pending: boolean;
  sendDisabled: boolean;
  blocked: boolean;
  notice: CartState["notice"];
  onSend: () => void;
  onLeave: () => void;
}>) {
  return (
    <footer className="flex flex-col gap-3 px-5 py-4 shadow-(--shadow-sheet)">
      <p className="flex items-baseline justify-between">
        <span className="text-text-muted">รวม</span>
        <span className="text-pos-total text-text-accent tabular-nums">{formatTHB(total)}</span>
      </p>
      {notice === "reused" ? (
        <Button size="lg" fullWidth onPress={onLeave}>
          กลับไปที่โต๊ะ
        </Button>
      ) : null}
      {notice === "network" && !blocked ? (
        <Button size="lg" fullWidth isPending={pending} onPress={onSend}>
          ส่งอีกครั้ง
        </Button>
      ) : null}
      {notice === "network" ? (
        <Button size="lg" fullWidth variant="secondary" onPress={onLeave}>
          ทิ้งตะกร้า
        </Button>
      ) : null}
      {notice === null ? (
        <Button size="lg" fullWidth isPending={pending} isDisabled={sendDisabled} onPress={onSend}>
          ส่งออเดอร์
        </Button>
      ) : null}
    </footer>
  );
}

export function CartPanel({
  visitId,
  state,
  dispatch,
  onSent,
  onLeave,
}: Readonly<{
  visitId: string;
  state: CartState;
  dispatch: (action: CartAction) => void;
  onSent: (count: number) => void;
  onLeave: () => void;
}>) {
  const place = usePlaceOrder(visitId, state, dispatch, onSent);
  const preview = previewOf(state.lines);
  const alert = alertCopy(state);
  const blocked = state.lines.some((line) => line.unavailable);
  const locked = state.pending || state.closed || state.notice !== null;
  const lines = orderedLines(state.lines);

  return (
    <aside className="flex w-90 shrink-0 flex-col border-l border-line bg-surface-overlay" aria-label="ตะกร้า">
      <header className="flex items-center justify-between px-5 py-4">
        <h2 className="text-heading">ตะกร้า</h2>
        <span className="text-small text-text-muted">{preview.count} รายการ</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {alert ? (
          <Alert status="danger" role="alert">
            <Alert.Content>
              <Alert.Title>{alert.title}</Alert.Title>
              <Alert.Description>{alert.body}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        {lines.length === 0 ? <p className="py-6 text-text-muted">ยังไม่มีรายการ — แตะเมนูเพื่อเพิ่ม</p> : null}
        <ul>
          {lines.map((line) => (
            <CartLineRow
              key={line.id}
              line={line}
              locked={locked}
              onQty={(quantity) => dispatch({ type: "qty", id: line.id, quantity })}
              onRemove={() => dispatch({ type: "remove", id: line.id })}
            />
          ))}
        </ul>
      </div>
      <CartFooter
        total={preview.total}
        pending={place.pending}
        sendDisabled={blocked || state.pending || state.closed || state.forbidden || preview.count === 0}
        blocked={blocked}
        notice={state.notice}
        onSend={place.send}
        onLeave={onLeave}
      />
    </aside>
  );
}
