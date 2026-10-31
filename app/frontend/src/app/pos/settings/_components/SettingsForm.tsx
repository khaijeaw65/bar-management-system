"use client";

import type { VenueSettings } from "@bar/contracts";
import { Alert, Button, FieldError, Input, Label, TextField } from "@heroui/react";
import type { ReactNode } from "react";
import { CutoffField } from "./CutoffField";
import { LeaveDialog } from "@/components/ui/LeaveDialog";
import { SettingsSection } from "./SettingsSection";
import { SettingSwitch } from "./SettingSwitch";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import { useSettingsForm } from "./useSettingsForm";

// `payment` sits between ร้าน and การทำงาน (CD-13 order) but saves on its own form.
export function SettingsForm({
  venue,
  payment,
  readOnly,
}: Readonly<{ venue: VenueSettings; payment: ReactNode; readOnly: boolean }>) {
  const form = useSettingsForm(venue);
  const guard = useLeaveGuard(form.dirty);
  const { draft, errors } = form;

  return (
    <>
      <SettingsSection title="ร้าน">
        <TextField value={draft.name} isReadOnly={readOnly} isInvalid={errors.name !== undefined} onChange={(value) => form.set("name", value)}>
          <Label>ชื่อร้าน</Label>
          <Input />
          {errors.name ? <FieldError>{errors.name}</FieldError> : null}
        </TextField>
      </SettingsSection>
      {payment}
      <SettingsSection title="การทำงาน">
        <SettingSwitch
          label="จอครัว"
          help="ปิด = ใบเดียวต่อออเดอร์, ไม่มีพร้อมเสิร์ฟ"
          isSelected={draft.kitchenDisplayEnabled}
          isDisabled={readOnly}
          onChange={(value) => form.set("kitchenDisplayEnabled", value)}
        />
        <SettingSwitch
          label="QR ที่เคาน์เตอร์"
          help="ปิด = พนักงานเปิดที่นั่งเคาน์เตอร์เอง"
          isSelected={draft.counterQrEnabled}
          isDisabled={readOnly}
          onChange={(value) => form.set("counterQrEnabled", value)}
        />
        <CutoffField readOnly={readOnly} value={draft.businessDayCutoff} error={errors.businessDayCutoff} onChange={(value) => form.set("businessDayCutoff", value)} />
      </SettingsSection>
      {form.failure ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Description>{form.failure}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      {readOnly ? null : (
        <div className="flex justify-end">
          <Button size="lg" isPending={form.pending} isDisabled={!form.dirty || Object.keys(errors).length > 0} onPress={form.save}>
            บันทึก
          </Button>
        </div>
      )}
      {guard.target ? <LeaveDialog onStay={guard.stay} onLeave={guard.leave} /> : null}
    </>
  );
}
