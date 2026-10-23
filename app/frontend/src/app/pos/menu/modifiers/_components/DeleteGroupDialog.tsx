"use client";

import type { ModifierGroupAdmin } from "@bar/contracts";
import { AlertDialog, Button } from "@heroui/react";

export function DeleteGroupDialog({
  group,
  pending,
  failed,
  onConfirm,
  onCancel,
}: Readonly<{ group: ModifierGroupAdmin; pending: boolean; failed: boolean; onConfirm: () => void; onCancel: () => void }>) {
  return (
    <AlertDialog.Root isOpen onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialog.Backdrop isDismissable={false}>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>ลบกลุ่ม {group.name}?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-text-muted">ลบแล้วกู้คืนไม่ได้</p>
              {failed ? <p role="alert" className="mt-2 text-text-danger">ลบไม่สำเร็จ — ลองอีกครั้ง</p> : null}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="secondary" onPress={onCancel}>ยกเลิก</Button>
              <Button variant="danger" isPending={pending} onPress={onConfirm}>ลบ</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog.Root>
  );
}
