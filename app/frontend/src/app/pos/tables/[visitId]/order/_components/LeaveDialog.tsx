"use client";

import { AlertDialog, Button } from "@heroui/react";

export function LeaveDialog({
  onStay,
  onDiscard,
}: Readonly<{
  onStay: () => void;
  onDiscard: () => void;
}>) {
  return (
    <AlertDialog.Root isOpen onOpenChange={(open) => { if (!open) onStay(); }}>
      <AlertDialog.Backdrop isDismissable={false} isKeyboardDismissDisabled>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>ทิ้งตะกร้า?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>รายการในตะกร้าจะไม่ถูกส่ง</AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="secondary" onPress={onStay}>
                อยู่ต่อ
              </Button>
              <Button variant="danger" onPress={onDiscard}>
                ทิ้งตะกร้า
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog.Root>
  );
}
