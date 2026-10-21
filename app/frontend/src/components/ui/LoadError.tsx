"use client";

import { Alert, Button } from "@heroui/react";

export function LoadError({
  title = "โหลดข้อมูลไม่สำเร็จ",
  description,
  onRetry,
}: Readonly<{
  title?: string;
  description?: string;
  onRetry: () => void;
}>) {
  return (
    <Alert status="danger" role="alert">
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {description ? <Alert.Description>{description}</Alert.Description> : null}
      </Alert.Content>
      <Button size="sm" variant="danger" onPress={onRetry}>
        ลองอีกครั้ง
      </Button>
    </Alert>
  );
}
