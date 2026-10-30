import { Alert } from "@heroui/react";
import type { CartState } from "@/lib/order/cart";

export function CartNotice({ state }: Readonly<{ state: CartState }>) {
  if (state.notice === "network") {
    return (
      <Alert status="danger" role="alert">
        <Alert.Content>
          <Alert.Title>สั่งไม่สำเร็จ ลองอีกครั้ง</Alert.Title>
          <Alert.Description>ตะกร้ายังอยู่ครบ — กดสั่งซ้ำจะไม่เกิดออเดอร์ซ้ำ</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  if (state.rateLimited) {
    return (
      <Alert status="warning" role="alert">
        <Alert.Content>
          <Alert.Title>{state.rateLimited}</Alert.Title>
          <Alert.Description>ตะกร้ายังอยู่ครบ — รอสักครู่แล้วกดสั่งอีกครั้ง</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  if (state.lines.some((line) => line.unavailable)) {
    return (
      <Alert status="warning" role="alert">
        <Alert.Content>
          <Alert.Title>มีรายการที่สั่งไม่ได้</Alert.Title>
          <Alert.Description>ลบรายการที่หมดออกก่อนจึงจะส่งได้</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  return null;
}
