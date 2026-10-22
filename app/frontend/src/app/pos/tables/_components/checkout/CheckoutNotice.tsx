import { Alert } from "@heroui/react";
import type { CheckoutFault } from "./useCheckout";

export function CheckoutNotice({ fault }: Readonly<{ fault: CheckoutFault }>) {
  if (fault === "promptpay") {
    return (
      <Alert status="warning">
        <Alert.Content>
          <Alert.Description>ยังไม่ได้ตั้งพร้อมเพย์ — ใช้เงินสด หรือตั้งค่าก่อน</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  if (fault === "network") {
    return (
      <Alert status="danger">
        <Alert.Content>
          <Alert.Title>สร้าง QR ไม่สำเร็จ ลองอีกครั้ง</Alert.Title>
          <Alert.Description>ยังไม่ได้ล็อกยอด — กดสร้าง QR อีกครั้งได้ ระบบไม่สร้างซ้ำ</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  if (fault === "failed") {
    return (
      <Alert status="danger">
        <Alert.Content>
          <Alert.Description>ชำระเงินไม่สำเร็จ ลองอีกครั้ง</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  return null;
}
