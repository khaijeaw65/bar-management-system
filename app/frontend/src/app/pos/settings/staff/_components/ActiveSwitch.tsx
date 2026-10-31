"use client";

import type { StaffMember } from "@bar/contracts";
import { Button, Label, Modal, Switch, toast } from "@heroui/react";
import { useState } from "react";
import { iamFailure, useRefreshIam } from "@/hooks/useIamWrite";
import { updateStaff } from "@/lib/api/staff";

/** The one active switch (list row and detail header): off asks first, self is disabled with the reason (CD-13 staff·5–6). */
export function ActiveSwitch({
  member,
  isSelf,
  onFailure,
}: Readonly<{ member: StaffMember; isSelf: boolean; onFailure?: (message: string) => void }>) {
  const refresh = useRefreshIam();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  async function setActive(isActive: boolean) {
    setSaving(true);
    try {
      await updateStaff(member.id, { isActive });
      toast.success(isActive ? `เปิดบัญชี ${member.displayName} แล้ว` : `ปิดบัญชี ${member.displayName} แล้ว`);
    } catch (error) {
      const failure = iamFailure(error);
      if (failure.kind === "lockout") onFailure?.(failure.message);
      else toast.danger(failure.message);
    } finally {
      await refresh();
      setSaving(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <Switch
        isSelected={member.isActive}
        isDisabled={isSelf || saving}
        onChange={(on) => (on ? void setActive(true) : setConfirming(true))}
      >
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label className="sr-only">บัญชีใช้งาน {member.displayName}</Label>
        </Switch.Content>
      </Switch>
      {isSelf ? <span className="text-small text-text-muted">ปิดบัญชีของตัวเองไม่ได้</span> : null}
      {confirming ? (
        <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) setConfirming(false); }}>
          <Modal.Container size="sm">
            <Modal.Dialog aria-label="ปิดบัญชี">
              <div className="flex flex-col gap-4">
                <Modal.Heading className="text-heading">ปิดบัญชี {member.displayName}?</Modal.Heading>
                <p className="text-body text-text-muted">จะออกจากระบบทุกอุปกรณ์ทันที เปิดบัญชีกลับมาได้ภายหลัง</p>
                <div className="flex gap-2">
                  <Button size="lg" variant="secondary" className="min-h-11 flex-1" onPress={() => setConfirming(false)}>
                    ยกเลิก
                  </Button>
                  <Button size="lg" variant="danger" className="min-h-11 flex-1" isDisabled={saving} onPress={() => void setActive(false)}>
                    ปิดบัญชี
                  </Button>
                </div>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      ) : null}
    </>
  );
}
