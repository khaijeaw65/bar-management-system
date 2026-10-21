import { Alert } from "@heroui/react";

export function MenuListError({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <Alert status="danger" role="alert">
      <Alert.Content>
        <Alert.Title>โหลดข้อมูลไม่สำเร็จ</Alert.Title>
        <Alert.Description>เกิดข้อผิดพลาดในการดึงข้อมูลเมนู</Alert.Description>
      </Alert.Content>
      <button type="button" onClick={onRetry} className="text-small font-semibold text-danger-fg">
        ลองอีกครั้ง
      </button>
    </Alert>
  );
}
