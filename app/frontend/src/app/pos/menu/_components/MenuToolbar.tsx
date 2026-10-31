"use client";

import type { MenuCategory } from "@bar/contracts";
import { Button, SearchField } from "@heroui/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoriesModal } from "./categories/CategoriesModal";
import { ToggleChip } from "./ToggleChip";

export function MenuToolbar({
  categories,
  query,
  categoryId,
  onQuery,
  onCategory,
  canWrite,
}: Readonly<{
  categories: MenuCategory[];
  query: string;
  categoryId: string;
  onQuery: (value: string) => void;
  onCategory: (id: string) => void;
  canWrite: boolean;
}>) {
  const router = useRouter();
  const [managing, setManaging] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <SearchField aria-label="ค้นหาเมนู" value={query} onChange={onQuery} className="max-w-xs flex-1">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="ค้นหาเมนู" />
          </SearchField.Group>
        </SearchField>
        {canWrite ? (
          <div className="flex gap-2">
            <Button variant="secondary" onPress={() => setManaging(true)}>
              จัดการหมวด
            </Button>
            <Button variant="secondary" onPress={() => router.push("/pos/menu/modifiers")}>
              ตัวเลือกเสริม
            </Button>
            <Button onPress={() => router.push("/pos/menu/new")}>
              <Plus size={16} aria-hidden />
              เพิ่มเมนูใหม่
            </Button>
          </div>
        ) : null}
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">หมวดเมนู</legend>
        <ToggleChip selected={categoryId === "all"} onToggle={() => onCategory("all")}>
          ทั้งหมด
        </ToggleChip>
        {categories.map((category) => (
          <ToggleChip key={category.id} selected={categoryId === category.id} onToggle={() => onCategory(category.id)}>
            {category.name}
          </ToggleChip>
        ))}
      </fieldset>
      {managing ? <CategoriesModal onClose={() => setManaging(false)} /> : null}
    </div>
  );
}
