"use client";

import { Tabs } from "@heroui/react";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { CheckoutModal } from "@/app/pos/tables/_components/checkout/CheckoutModal";
import { DisconnectedBanner } from "@/app/pos/tables/_components/DisconnectedBanner";
import { usePaymentCenter } from "../_hooks/usePaymentCenter";
import { ActiveBillsTab } from "./ActiveBillsTab";
import { PayHeader } from "./PayHeader";
import { PayMetrics } from "./PayMetrics";
import { PaymentHistoryTab } from "./PaymentHistoryTab";

export function PayScreen() {
  const {
    tablesQuery,
    todayQuery,
    pendingQrTables,
    activeUnpaidTables,
    unpaidCount,
    todaySummary,
    businessDate,
    todayItems,
    socketDown,
    refreshAll,
  } = usePaymentCenter();

  const [activeTab, setActiveTab] = useState<string>("active");
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);

  if (tablesQuery.isError || todayQuery.isError) {
    return (
      <LoadError
        title="โหลดข้อมูลการชำระเงินไม่สำเร็จ"
        onRetry={refreshAll}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {socketDown ? <DisconnectedBanner /> : null}

      <PayHeader businessDate={businessDate} />

      <PayMetrics summary={todaySummary} unpaidCount={unpaidCount} />

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(String(key))}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="แถบการชำระเงิน">
            <Tabs.Tab id="active">
              รอชำระ ({activeUnpaidTables.length + pendingQrTables.length})
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="history">
              ประวัติการชำระวันนี้ ({todayItems.length})
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="active" className="pt-4">
          <ActiveBillsTab
            pendingQrTables={pendingQrTables}
            activeUnpaidTables={activeUnpaidTables}
            todayItems={todayItems}
            onOpenCheckout={(visitId) => setActiveVisitId(visitId)}
          />
        </Tabs.Panel>

        <Tabs.Panel id="history" className="pt-4">
          <PaymentHistoryTab items={todayItems} />
        </Tabs.Panel>
      </Tabs>

      {activeVisitId ? (
        <CheckoutModal
          visitId={activeVisitId}
          onClose={() => {
            setActiveVisitId(null);
            refreshAll();
          }}
        />
      ) : null}
    </div>
  );
}
