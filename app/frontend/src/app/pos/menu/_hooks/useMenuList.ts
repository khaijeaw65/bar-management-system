"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAdminMenuCategories, getAdminMenuItems } from "@/lib/api/menu";
import { filterItems } from "../_lib/filter";

export function useMenuList() {
  const items = useQuery({ queryKey: ["menu", "items", "admin"], queryFn: getAdminMenuItems, retry: false });
  const categories = useQuery({
    queryKey: ["menu", "categories", "admin"],
    queryFn: getAdminMenuCategories,
    retry: false,
  });
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  return {
    items,
    categories,
    query,
    setQuery,
    categoryId,
    setCategoryId,
    visible: filterItems(items.data?.items ?? [], query, categoryId),
    refetch: () => {
      void items.refetch();
      void categories.refetch();
    },
  };
}
