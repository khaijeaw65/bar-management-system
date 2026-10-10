"use client";

import { useState } from "react";
import { CategoryFilters } from "./CategoryFilters";
import { MenuEmpty } from "./MenuEmpty";
import { MenuGrid } from "./MenuGrid";
import { MenuHeader } from "./MenuHeader";
import { ResultsLine } from "./ResultsLine";
import { filterMenuItems, type MenuCategoryId } from "./menu-data";

export function MenuScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MenuCategoryId>("all");
  const results = filterMenuItems(query, category);

  return (
    <div className="dark min-h-screen bg-bg-app">
      <main className="mx-auto flex min-h-[800px] w-[1280px] flex-col gap-6 bg-bg-app px-12 py-10 text-text-body">
        <MenuHeader query={query} onQueryChange={setQuery} />
        <CategoryFilters selected={category} onSelect={setCategory} />
        <ResultsLine count={results.length} query={query.trim()} />
        {results.length === 0 ? <MenuEmpty onClear={() => setQuery("")} /> : <MenuGrid items={results} />}
      </main>
    </div>
  );
}
