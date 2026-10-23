"use client";

import type { MenuCategory, MenuItem, ModifierGroupAdmin } from "@bar/contracts";
import { Breadcrumbs, Button, Chip } from "@heroui/react";
import Link from "next/link";
import { LeaveDialog } from "@/components/ui/LeaveDialog";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import { useMenuDraft } from "../../_hooks/useMenuDraft";
import { usePhotoUpload } from "../../_hooks/usePhotoUpload";
import { useMenuSave } from "../../_hooks/useMenuSave";
import { AddOnsSection } from "./AddOnsSection";
import { BasicsSection } from "./BasicsSection";
import { EditorAlerts } from "./EditorAlerts";
import { PhotoField } from "./PhotoField";
import { RenameDialog } from "./RenameDialog";
import { TypeSection } from "./TypeSection";
import { VariantsSection } from "./VariantsSection";

export function MenuEditor({
  item,
  categories,
  groups,
}: Readonly<{ item?: MenuItem; categories: MenuCategory[]; groups: ModifierGroupAdmin[] }>) {
  const state = useMenuDraft(item);
  const save = useMenuSave(state);
  const upload = usePhotoUpload((photo) => state.patch({ photo: { kind: "new", ...photo } }));
  const guard = useLeaveGuard(state.dirty);
  const { draft } = state;

  return (
    <form
      noValidate
      aria-label={item ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.submit();
      }}
    >
      <Breadcrumbs>
        <Breadcrumbs.Item>
          <Link href="/pos/menu">เมนู</Link>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>{item ? state.base.name : "เพิ่มเมนูใหม่"}</Breadcrumbs.Item>
      </Breadcrumbs>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{item ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}</h1>
        {state.dirty ? <Chip size="sm">ยังไม่บันทึก</Chip> : null}
      </div>
      <EditorAlerts
        errorCount={Object.keys(save.errors).length}
        stale={save.stale}
        failure={save.failure}
        onReload={(latest) => {
          state.reload(latest);
          save.clearStale();
        }}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <BasicsSection draft={draft} errors={save.errors} categories={categories}
            onChange={state.patch}
            photo={
              <PhotoField
                savedUrl={state.item?.imageUrl ?? null}
                photo={draft.photo}
                upload={upload.state}
                onPick={upload.pick}
                onCancel={upload.cancel}
                onRemove={() => state.patch({ photo: { kind: "remove" } })}
              />
            }
          />
          <TypeSection draft={draft} errors={save.errors} onChange={state.patch} />
        </div>
        <div className="flex flex-col gap-4">
          <VariantsSection
            draft={draft}
            errors={save.errors}
            onChange={state.patchVariant}
            onAdd={state.addVariant}
            onRemove={state.removeVariant}
          />
          <AddOnsSection groups={groups} selected={draft.modifierGroupIds} onToggle={state.toggleGroup} />
        </div>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 bg-surface-overlay py-3">
        <Button variant="secondary" onPress={() => guard.go("/pos/menu")}>
          ยกเลิก
        </Button>
        <Button type="submit" isPending={save.pending} isDisabled={upload.state.status === "uploading"}>
          บันทึก
        </Button>
      </div>
      {save.renames ? (
        <RenameDialog renames={save.renames} onConfirm={save.confirmRename} onCancel={save.cancelRename} />
      ) : null}
      {guard.target ? <LeaveDialog onStay={guard.stay} onLeave={guard.leave} /> : null}
    </form>
  );
}
