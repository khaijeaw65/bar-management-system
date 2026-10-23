"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useMenuLive } from "@/hooks/useMenuLive";
import { useDisconnected } from "@/hooks/useSocketEvent";
import { getMenuCategories, getMenuItems } from "@/lib/api/menu";

export function useOrderMenu() {
  const items = useQuery({
    queryKey: ["menu", "items"],
    queryFn: getMenuItems,
    refetchInterval: 60_000,
    retry: false,
  });
  const categories = useQuery({
    queryKey: ["menu", "categories"],
    queryFn: getMenuCategories,
    retry: false,
  });
  const refetch = useCallback(() => {
    void items.refetch();
    void categories.refetch();
  }, [items, categories]);
  useMenuLive();
  const disconnected = useDisconnected(refetch);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  return { items, categories, disconnected, query, setQuery, categoryId, setCategoryId, refetch };
}
