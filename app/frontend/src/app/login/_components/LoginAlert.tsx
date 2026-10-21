"use client";

import { Alert } from "@heroui/react";

export function LoginAlert({ onDismiss }: Readonly<{ onDismiss: () => void }>) {
  return (
    <Alert status="danger" role="alert">
      <Alert.Content>
        <Alert.Description>เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง</Alert.Description>
      </Alert.Content>
      <button type="button" className="text-small text-danger-fg" onClick={onDismiss}>
        ปิด
      </button>
    </Alert>
  );
}
