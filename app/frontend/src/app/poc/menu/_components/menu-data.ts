export interface MenuItem {
  id: string;
  name: string;
  category: "draft" | "cocktail" | "highball" | "food";
  price: string;
  soldOut: boolean;
}

export type MenuCategoryId = "all" | MenuItem["category"];

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  count: number;
}

/** Fixed sample. Counts are category totals and do not follow the search. */
export const MENU_ITEMS: readonly MenuItem[] = [
  { id: "chang-draft", name: "ช้างดราฟต์", category: "draft", price: "฿120.00", soldOut: false },
  {
    id: "rain-cocktail",
    name: "ค็อกเทลพิเศษประจำเดือน “ฝนแรกที่บางกอก” จินมะลิ ส้มซ่า โซดาตะไคร้",
    category: "cocktail",
    price: "฿320.00",
    soldOut: false,
  },
  { id: "lime-highball", name: "ไฮบอลมะนาวโซดา", category: "highball", price: "฿180.00", soldOut: false },
  { id: "yum-moo-yor", name: "ยำหมูยอ", category: "food", price: "฿150.00", soldOut: true },
];

export const CATEGORIES: readonly MenuCategory[] = [
  { id: "all", label: "ทั้งหมด", count: 4 },
  { id: "draft", label: "เบียร์สด", count: 1 },
  { id: "cocktail", label: "ค็อกเทล", count: 1 },
  { id: "highball", label: "ไฮบอล", count: 1 },
  { id: "food", label: "อาหาร", count: 1 },
];

export function isCategoryId(value: unknown): value is MenuCategoryId {
  return CATEGORIES.some((category) => category.id === value);
}

export function filterMenuItems(query: string, category: MenuCategoryId): MenuItem[] {
  const needle = query.trim().toLocaleLowerCase("th");
  return MENU_ITEMS.filter((item) => {
    const inCategory = category === "all" || item.category === category;
    const matchesName = needle.length === 0 || item.name.toLocaleLowerCase("th").includes(needle);
    return inCategory && matchesName;
  });
}
