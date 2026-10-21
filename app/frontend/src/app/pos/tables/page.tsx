import { Suspense } from "react";
import { TableGrid } from "./_components/TableGrid";
import { TableGridSkeleton } from "./_components/TableGridSkeleton";

export default function TablesPage() {
  return (
    <Suspense
      fallback={
        <section className="flex flex-col gap-4">
          <h1 className="text-title">โต๊ะ</h1>
          <TableGridSkeleton />
        </section>
      }
    >
      <TableGrid />
    </Suspense>
  );
}
