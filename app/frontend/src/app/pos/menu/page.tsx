import { Suspense } from "react";
import { MenuList } from "./_components/MenuList";
import { MenuListSkeleton } from "./_components/MenuListSkeleton";

export default function MenuPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">เมนู</h1>
      <Suspense fallback={<MenuListSkeleton />}>
        <MenuList />
      </Suspense>
    </section>
  );
}
