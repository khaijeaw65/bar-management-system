"use client";

import { Button, Modal } from "@heroui/react";

export function LeaveDialog({ onStay, onLeave }: Readonly<{ onStay: () => void; onLeave: () => void }>) {
  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onStay(); }}>
      <Modal.Container size="sm">
        <Modal.Dialog>
          <div className="flex flex-col gap-4">
            <Modal.Heading className="text-heading">ยังไม่ได้บันทึก</Modal.Heading>
            <p className="text-body text-text-muted">ออกจากหน้านี้แล้วการแก้ไขจะหายไป</p>
            <div className="flex gap-2">
              <Button size="lg" variant="secondary" className="flex-1" onPress={onStay}>
                อยู่ต่อ
              </Button>
              <Button size="lg" variant="danger" className="flex-1" onPress={onLeave}>
                ออกโดยไม่บันทึก
              </Button>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
