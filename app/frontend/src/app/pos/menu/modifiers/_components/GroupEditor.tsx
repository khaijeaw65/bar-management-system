"use client";

import type { ModifierGroupAdmin } from "@bar/contracts";
import { Button, Drawer, FieldError, Input, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { LeaveDialog } from "@/components/ui/LeaveDialog";
import { useGroupDraft } from "../_hooks/useGroupDraft";
import { useGroupSave } from "../_hooks/useGroupSave";
import { activeCount, ruleLabel } from "../_lib/group";
import { OptionRows } from "./OptionRows";
import { RuleFields } from "./RuleFields";

// `group` undefined = a new group. Closing with unsaved changes asks first.
export function GroupEditor({ group, onClose }: Readonly<{ group?: ModifierGroupAdmin; onClose: () => void }>) {
  const state = useGroupDraft(group);
  const save = useGroupSave(group?.id, state.draft, onClose);
  const [leaving, setLeaving] = useState(false);
  const { draft } = state;
  const close = () => (state.dirty ? setLeaving(true) : onClose());
  const messages = Object.values(save.errors);

  return (
    <Drawer.Root isOpen onOpenChange={(open) => { if (!open) close(); }}>
      <Drawer.Backdrop isDismissable={false}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-120 max-w-full">
            <Drawer.Header>
              <Drawer.Heading>{group ? `แก้ไขกลุ่ม ${group.name}` : "เพิ่มกลุ่มตัวเลือกเสริม"}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="flex flex-col gap-4">
              {messages.length > 0 ? <p role="alert" className="text-small text-text-danger">แก้ {messages.length} จุดก่อนบันทึก: {messages[0]}</p> : null}
              {save.failure ? <p role="alert" className="text-small text-text-danger">{save.failure}</p> : null}
              <TextField value={draft.name} isInvalid={save.errors.name !== undefined} onChange={(name) => state.patch({ name })}>
                <Label>ชื่อกลุ่ม</Label>
                <Input />
                {save.errors.name ? <FieldError>{save.errors.name}</FieldError> : null}
              </TextField>
              <RuleFields draft={draft} errors={save.errors} onChange={state.patch} />
              <OptionRows options={draft.options} errors={save.errors} onChange={state.patchOption} onAdd={state.addOption} onRemove={state.removeOption} />
              <p className="text-small text-text-muted">ลูกค้าเห็น: {draft.name || "ชื่อกลุ่ม"} · {ruleLabel(draft)} · เลือกได้จาก {activeCount(draft)} ตัวเลือก</p>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="secondary" onPress={close}>ยกเลิก</Button>
              <Button isPending={save.pending} onPress={save.submit}>บันทึก</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
      {leaving ? <LeaveDialog onStay={() => setLeaving(false)} onLeave={onClose} /> : null}
    </Drawer.Root>
  );
}
