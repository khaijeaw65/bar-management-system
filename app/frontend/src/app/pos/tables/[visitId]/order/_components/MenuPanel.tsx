"use client";

import { Alert, SearchField, Tabs } from "@heroui/react";
import type { MenuCategory, MenuItem } from "@bar/contracts";
import { sortedCategories, visibleItems } from "../catalog";
import { MenuResults } from "./MenuResults";

export function MenuPanel({
  items,
  categories,
  counts,
  query,
  categoryId,
  status,
  disconnected,
  locked,
  onQuery,
  onCategory,
  onRetry,
  onPick,
}: Readonly<{
  items: MenuItem[];
  categories: MenuCategory[];
  counts: ReadonlyMap<string, number>;
  query: string;
  categoryId: string;
  status: "loading" | "error" | "ready";
  disconnected: boolean;
  locked: boolean;
  onQuery: (value: string) => void;
  onCategory: (id: string) => void;
  onRetry: () => void;
  onPick: (item: MenuItem) => void;
}>) {
  const shown = visibleItems(items, categoryId, query);
  const tabs = sortedCategories(categories);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3" aria-label="เมนู">
      <SearchField aria-label="ค้นหาเมนู" value={query} onChange={onQuery} isDisabled={status === "loading"}>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="ค้นหาเมนู" />
        </SearchField.Group>
      </SearchField>
      {disconnected ? (
        <Alert status="warning" role="alert">
          <Alert.Content>
            <Alert.Title>การเชื่อมต่อขาด</Alert.Title>
            <Alert.Description>
              สถานะเมนูอาจไม่ล่าสุด — ยังสั่งได้ ระบบตรวจของหมด / โปรหมดเวลาอีกครั้งตอนส่ง
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <Tabs selectedKey={categoryId} onSelectionChange={(key) => onCategory(String(key))}>
        <Tabs.List aria-label="หมวดเมนู">
          <Tabs.Tab id="all">ทั้งหมด</Tabs.Tab>
          {tabs.map((category) => (
            <Tabs.Tab key={category.id} id={category.id}>
              {category.name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <MenuResults
        status={status}
        items={shown}
        counts={counts}
        locked={locked}
        onRetry={onRetry}
        onPick={onPick}
      />
    </section>
  );
}
