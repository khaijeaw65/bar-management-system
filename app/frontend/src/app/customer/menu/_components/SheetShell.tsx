"use client";

import { Drawer, Modal } from "@heroui/react";
import type { ReactNode } from "react";

// Half sheet for a plain item, full-screen for one with options (CD-06 R2).
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
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
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
          <Drawer.Header>
            <Drawer.Heading>{title}</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">{children}</Drawer.Body>
          <Drawer.Footer className="flex items-center gap-2">{footer}</Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
