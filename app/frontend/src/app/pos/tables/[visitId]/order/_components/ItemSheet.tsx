"use client";

import { Button, FieldError, Label, Modal, Radio, RadioGroup, TextArea, TextField } from "@heroui/react";
import type { MenuItem } from "@bar/contracts";
import { useReducer } from "react";
import { formatTHB } from "@/lib/utils/format";
import { scaleMoney } from "@/lib/utils/money";
import type { NewLine } from "../cart";
import { lineFrom, selectionReady, tilePrice } from "../catalog";
import { createItemDraft, itemDraftReducer } from "../item-draft";
import { ModifierGroup } from "./ModifierGroup";
import { NameChips } from "./NameChips";
import { QtyStepper } from "./QtyStepper";

function VariantPicker({
  item,
  variantId,
  onChange,
}: Readonly<{
  item: MenuItem;
  variantId: string;
  onChange: (variantId: string) => void;
}>) {
  return (
    <RadioGroup value={variantId} onChange={onChange}>
      <Label>ตัวเลือก</Label>
      {item.variants.map((entry) => (
        <Radio key={entry.id} value={entry.id} aria-label={`${entry.name} ${formatTHB(entry.price)}`} isDisabled={!entry.isAvailable}>
          <Radio.Content aria-label={`${entry.name} ${formatTHB(entry.price)}`}>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            <Label>
              {entry.name} {formatTHB(entry.price)}
            </Label>
          </Radio.Content>
        </Radio>
      ))}
    </RadioGroup>
  );
}

function NoteField({ notes, onChange }: Readonly<{ notes: string; onChange: (value: string) => void }>) {
  return (
    <TextField value={notes} isInvalid={notes.length > 500} onChange={onChange}>
      <Label>หมายเหตุ (ไม่บังคับ)</Label>
      <TextArea placeholder="เช่น หวานน้อย" />
      {notes.length > 500 ? <FieldError>โน้ตยาวเกินไป</FieldError> : null}
    </TextField>
  );
}

function SheetFooter({
  quantity,
  ready,
  preview,
  onQuantity,
  onClose,
  onAdd,
}: Readonly<{
  quantity: number;
  ready: boolean;
  preview: string;
  onQuantity: (quantity: number) => void;
  onClose: () => void;
  onAdd: () => void;
}>) {
  return (
    <Modal.Footer className="flex items-center gap-2">
      <QtyStepper value={quantity} onChange={onQuantity} />
      <Button size="lg" variant="secondary" onPress={onClose}>
        ยกเลิก
      </Button>
      <Button size="lg" isDisabled={!ready} onPress={onAdd}>
        เพิ่มลงตะกร้า · {formatTHB(preview)}
      </Button>
    </Modal.Footer>
  );
}

export function ItemSheet({
  item,
  names,
  onClose,
  onRemember,
  onAdd,
}: Readonly<{
  item: MenuItem;
  names: readonly string[];
  onClose: () => void;
  onRemember: (name: string) => void;
  onAdd: (line: NewLine) => void;
}>) {
  const [draft, dispatch] = useReducer(itemDraftReducer, item, createItemDraft);
  const variant = item.variants.find((entry) => entry.id === draft.variantId) ?? item.variants[0];
  const ready = variant ? selectionReady(variant, draft.optionIds) && draft.notes.length <= 500 : false;
  const preview = variant ? scaleMoney(lineFrom(item, variant, draft.optionIds, draft.who, draft.notes, draft.quantity).unitPrice, draft.quantity) : item.basePrice;

  function addName(): void {
    const name = draft.name.trim();
    if (!name || name.length > 30) return;
    onRemember(name);
    dispatch({ type: "who", name });
  }

  function addLine(): void {
    if (!variant || !ready) return;
    onAdd(lineFrom(item, variant, draft.optionIds, draft.who, draft.notes, draft.quantity));
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container size="lg">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>{item.name}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <p className="text-small text-text-muted">{tilePrice(item)}</p>
            {item.variants.length > 0 ? (
              <VariantPicker item={item} variantId={draft.variantId} onChange={(variantId) => dispatch({ type: "variant", variantId })} />
            ) : null}
            {variant?.modifierGroups.map((group) => (
              <ModifierGroup key={group.id} group={group} optionIds={draft.optionIds} onChange={(optionIds) => dispatch({ type: "options", optionIds })} />
            ))}
            <NameChips
              names={names}
              who={draft.who}
              draft={draft.name}
              naming={draft.naming}
              onWho={(name) => dispatch({ type: "who", name })}
              onDraft={(value) => dispatch({ type: "name", value })}
              onNaming={(open) => dispatch({ type: "naming", open })}
              onAdd={addName}
            />
            <NoteField notes={draft.notes} onChange={(value) => dispatch({ type: "notes", value })} />
          </Modal.Body>
          <SheetFooter
            quantity={draft.quantity}
            ready={ready}
            preview={preview}
            onQuantity={(quantity) => dispatch({ type: "quantity", quantity })}
            onClose={onClose}
            onAdd={addLine}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
