"use client";

import { Button, Drawer, Modal } from "@heroui/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

// Half sheet for a plain item, full-screen for one with options (CD-06 R2).
function CloseButton({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <Button isIconOnly className="size-11 shrink-0" variant="ghost" aria-label="ปิด" onPress={onClose}>
      <X aria-hidden size={20} />
    </Button>
  );
}

export function SheetShell({
  full,
  title,
  onClose,
  footer,
  children,
}: Readonly<{ full: boolean; title: string; onClose: () => void; footer: ReactNode; children: ReactNode }>) {
  const onOpenChange = (open: boolean): void => {
    if (!open) onClose();
  };
  if (full) {
    return (
      <Modal.Backdrop isOpen onOpenChange={onOpenChange}>
        <Modal.Container size="full">
          <Modal.Dialog>
            <Modal.Header className="flex flex-row items-center justify-between gap-2">
              <Modal.Heading>{title}</Modal.Heading>
              <CloseButton onClose={onClose} />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">{children}</Modal.Body>
            <Modal.Footer className="flex items-center gap-2">{footer}</Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    );
  }
  return (
    <Drawer.Backdrop isOpen onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog>
          <Drawer.Header className="flex flex-row items-center justify-between gap-2">
            <Drawer.Heading>{title}</Drawer.Heading>
            <CloseButton onClose={onClose} />
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">{children}</Drawer.Body>
          <Drawer.Footer className="flex items-center gap-2">{footer}</Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
