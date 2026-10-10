import { MenuItemCard } from "./MenuItemCard";
import type { MenuItem } from "./menu-data";

interface MenuGridProps {
  items: readonly MenuItem[];
}

export function MenuGrid({ items }: MenuGridProps) {
  return (
    <section aria-label="รายการเมนู" className="grid grid-cols-4 items-start gap-6">
      {items.map((item) => (
        <div key={item.id} className="min-w-0">
          <MenuItemCard item={item} />
        </div>
      ))}
    </section>
  );
}
