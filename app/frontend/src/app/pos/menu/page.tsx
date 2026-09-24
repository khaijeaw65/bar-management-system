import { MenuList } from "./_components/MenuList";

export default function MenuPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">เมนู</h1>
      <MenuList />
    </section>
  );
}
