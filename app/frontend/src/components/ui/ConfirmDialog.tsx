"use client";

import { Button, Modal } from "@heroui/react";
import type { ReactNode } from "react";

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "ยกเลิก",
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
}: Readonly<{
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>) {
  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onCancel(); }}>
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog aria-label={title}>
          <div className="flex flex-col gap-4">
            <Modal.Heading className="text-heading">{title}</Modal.Heading>
            {children}
            <div className="flex gap-2">
              <Button size="lg" variant="secondary" className="min-h-11 flex-1" onPress={onCancel}>
                {cancelLabel}
              </Button>
              <Button size="lg" variant={danger ? "danger" : "primary"} className="min-h-11 flex-1" isDisabled={busy} onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
