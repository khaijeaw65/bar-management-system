"use client";

import { Button, Skeleton } from "@heroui/react";
import { Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useCustomerTab } from "../../_hooks/useCustomerTab";
import { raiseSentToast } from "../../_lib/sent-toast";
import { filterOrders, type TabFilter as Filter } from "../_lib/tab";
import { TabFilter } from "./TabFilter";
import { TabFooter } from "./TabFooter";
import { TabOrderCard } from "./TabOrderCard";

export function TabScreen() {
  const router = useRouter();
  const tab = useCustomerTab();
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(raiseSentToast, []);
  const toMenu = () => router.push("/customer/menu");

  if (tab.isError && !tab.data) {
    return (
      <div className="p-4">
        <LoadError onRetry={() => void tab.refetch()} />
      </div>
    );
  }
  if (!tab.data) return <Skeleton aria-busy className="m-4 h-40 rounded-card" />;
  const orders = filterOrders(tab.data.orders, filter);
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <h2 className="text-heading">บิลโต๊ะ</h2>
        <TabFilter value={filter} onChange={setFilter} />
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-text-muted">
            <Receipt aria-hidden className="size-10" />
            <p>{filter === "mine" ? "คุณยังไม่ได้สั่งอะไร" : "ยังไม่มีออเดอร์"}</p>
            <Button size="lg" variant="secondary" onPress={toMenu}>
              ดูเมนู
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 pb-4">
            {orders.map((order) => (
              <TabOrderCard key={order.orderNumber} order={order} />
            ))}
          </ul>
        )}
      </div>
      <TabFooter total={tab.data.total} asOf={tab.data.asOf} onOrderMore={toMenu} />
    </div>
  );
}
