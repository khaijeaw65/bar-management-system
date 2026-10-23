"use client";

import type { MenuItem } from "@bar/contracts";
import { Alert, Button } from "@heroui/react";

export function EditorAlerts({
  errorCount,
  stale,
  failure,
  onReload,
}: Readonly<{ errorCount: number; stale: MenuItem | null; failure: string | null; onReload: (latest: MenuItem) => void }>) {
  return (
    <>
      {stale ? (
        <Alert status="warning" role="alert">
          <Alert.Content>
            <Alert.Title>เมนูนี้ถูกแก้โดยคนอื่น</Alert.Title>
            <Alert.Description>โหลดฉบับล่าสุดก่อนแก้ต่อ — ค่าที่พิมพ์ไว้จะอยู่จนกว่าจะโหลด</Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="secondary" onPress={() => onReload(stale)}>
            โหลดฉบับล่าสุด
          </Button>
        </Alert>
      ) : null}
      {errorCount > 0 ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Title>ยังบันทึกไม่ได้ — แก้ {errorCount} จุดที่ทำเครื่องหมายไว้</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      {failure ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Title>บันทึกไม่สำเร็จ</Alert.Title>
            <Alert.Description>{failure}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </>
  );
}
