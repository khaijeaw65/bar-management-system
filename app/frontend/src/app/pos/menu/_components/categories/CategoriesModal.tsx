"use client";

import type { MenuCategory } from "@bar/contracts";
import { Button, Modal, Skeleton, toast } from "@heroui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { GridList, GridListItem, useDragAndDrop } from "react-aria-components";
import { LoadError } from "@/components/ui/LoadError";
import { ApiError } from "@/lib/api/errors";
import { movedIds, useCategories } from "../../_hooks/useCategories";
import { CategoryNameInput } from "./CategoryNameInput";
import { CategoryRow } from "./CategoryRow";

function CategoryList({ items, manager }: Readonly<{ items: MenuCategory[]; manager: ReturnType<typeof useCategories> }>) {
  const ids = items.map((category) => category.id);
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ "text/plain": String(key) })),
    onReorder: (event) => {
      const [moved] = [...event.keys];
      if (moved !== undefined) manager.reorder(movedIds(ids, String(moved), String(event.target.key), event.target.dropPosition === "after"));
    },
  });
  const remove = async (category: MenuCategory) => {
    try {
      await manager.remove(category.id);
    } catch (error) {
      const notEmpty = error instanceof ApiError && error.code === "CATEGORY_NOT_EMPTY";
      toast.danger(notEmpty ? "ลบไม่ได้ — ยังมีเมนูในหมวดนี้" : "ลบหมวดไม่สำเร็จ — ลองอีกครั้ง");
    }
  };

  return (
    <GridList aria-label="หมวดเมนู" items={items} dragAndDropHooks={dragAndDropHooks} className="flex flex-col gap-3">
      {(category) => (
        <GridListItem id={category.id} textValue={category.name} className="outline-none">
          <CategoryRow
            category={category}
            first={ids[0] === category.id}
            last={ids.at(-1) === category.id}
            onMove={(direction) => {
              const at = ids.indexOf(category.id) + direction;
              const target = ids[at];
              if (target) manager.reorder(movedIds(ids, category.id, target, direction === 1));
            }}
            onActive={(isActive) => manager.setActive(category.id, isActive)}
            onRename={(name) => manager.rename(category.id, name)}
            onDelete={() => void remove(category)}
          />
        </GridListItem>
      )}
    </GridList>
  );
}

function Body({ manager }: Readonly<{ manager: ReturnType<typeof useCategories> }>) {
  const [adding, setAdding] = useState(false);
  const { list } = manager;
  if (list.isPending) return <Skeleton aria-busy="true" aria-label="กำลังโหลดหมวด" className="h-40 w-full rounded-card" />;
  if (list.isError) return <LoadError onRetry={() => void list.refetch()} />;

  return (
    <div className="flex flex-col gap-3">
      {list.data.items.length === 0 ? <p className="text-text-muted">ยังไม่มีหมวด</p> : <CategoryList items={list.data.items} manager={manager} />}
      {adding ? (
        <CategoryNameInput
          initial=""
          label="ชื่อหมวดใหม่"
          onSave={async (name) => {
            await manager.create(name);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <div>
          <Button variant="secondary" size="sm" onPress={() => setAdding(true)}>
            <Plus size={16} aria-hidden />
            เพิ่มหมวด
          </Button>
        </div>
      )}
    </div>
  );
}

export function CategoriesModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const manager = useCategories();

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container size="md">
        <Modal.Dialog className="max-w-140">
          <div className="flex flex-col gap-4">
            <Modal.Heading className="text-heading">จัดการหมวด</Modal.Heading>
            <Body manager={manager} />
            <div className="flex justify-end">
              <Button onPress={onClose}>เสร็จ</Button>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
