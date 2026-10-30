"use client";

import { Button } from "@heroui/react";
import type { TableSummary } from "@bar/contracts";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useTableLive } from "@/hooks/useSocketEvent";
import { useAcknowledgeCall } from "@/hooks/useStaffCalls";
import { usePendingBySeat } from "@/hooks/useTicketBoard";
import { getTables, TABLES_KEY } from "@/lib/api/tables";
import { CheckoutModal } from "./checkout/CheckoutModal";
import { DisconnectedBanner } from "./DisconnectedBanner";
import { FloorSummary } from "./FloorSummary";
import { OpenTableModal } from "./OpenTableModal";
import { SessionDrawer } from "./SessionDrawer";
import { SeatSection } from "./SeatSection";
import { TableGridSkeleton } from "./TableGridSkeleton";
import { useMinuteClock } from "./table-time";

function byOrder(a: TableSummary, b: TableSummary): number {
  return a.sortOrder - b.sortOrder;
}

function withPay(params: URLSearchParams, on: boolean): Route {
  const next = new URLSearchParams(params.toString());
  if (on) next.set("pay", "1");
  else next.delete("pay");
  const query = next.toString();
  return (query ? `/pos/tables?${query}` : "/pos/tables") as Route;
}

export function TableGrid() {
  const tables = useQuery({ queryKey: TABLES_KEY, queryFn: getTables, retry: false });
  const disconnected = useTableLive();
  const now = useMinuteClock();
  const pending = usePendingBySeat();
  const acknowledge = useAcknowledgeCall();
  const [draft, setDraft] = useState<{ seatId: string | null } | null>(null);
  const params = useSearchParams();
  const router = useRouter();
  const items = tables.data?.items ?? [];
  const selectedId = params.get("visit");
  const payOpen = params.get("pay") === "1" && selectedId !== null;

  function selectVisit(visitId: string) {
    const next = new URLSearchParams(params.toString());
    next.set("visit", visitId);
    router.replace(`/pos/tables?${next.toString()}`);
  }

  function clearVisit() {
    const next = new URLSearchParams(params.toString());
    next.delete("visit");
    next.delete("pay");
    const query = next.toString();
    router.replace(query ? `/pos/tables?${query}` : "/pos/tables");
  }

  function onSeat(seat: TableSummary) {
    if (!seat.currentVisit) {
      setDraft({ seatId: seat.id });
      return;
    }
    selectVisit(seat.currentVisit.id);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-title">โต๊ะ</h1>
        <Button size="lg" isDisabled={!tables.data || items.length === 0} onPress={() => setDraft({ seatId: null })}>
          + เปิดโต๊ะ
        </Button>
      </div>
      {tables.isPending ? <TableGridSkeleton /> : null}
      {!tables.isPending && !tables.data ? (
        <LoadError
          title="โหลดข้อมูลโต๊ะไม่สำเร็จ"
          description="เกิดข้อผิดพลาด"
          onRetry={() => void tables.refetch()}
        />
      ) : null}
      {tables.data && items.length === 0 ? <p className="text-text-muted">ยังไม่มีโต๊ะ — เพิ่มโต๊ะในหน้าตั้งค่า</p> : null}
      {items.length > 0 ? (
        <>
          {disconnected ? <DisconnectedBanner /> : null}
          <FloorSummary items={items} />
          <SeatSection title="เคาน์เตอร์" seats={items.filter((seat) => seat.kind === "counter").sort(byOrder)} now={now} selectedId={selectedId} pending={pending} onSeat={onSeat} onAcknowledge={acknowledge.mutate} />
          <SeatSection title="โต๊ะ" seats={items.filter((seat) => seat.kind === "table").sort(byOrder)} now={now} selectedId={selectedId} pending={pending} onSeat={onSeat} onAcknowledge={acknowledge.mutate} />
        </>
      ) : null}
      {draft ? (
        <OpenTableModal
          key={draft.seatId ?? "blank"}
          seats={items}
          initialSeatId={draft.seatId}
          onClose={() => setDraft(null)}
          onJoined={(visitId) => {
            setDraft(null);
            selectVisit(visitId);
          }}
        />
      ) : null}
      {selectedId ? (
        <SessionDrawer
          key={selectedId}
          visitId={selectedId}
          holdEscape={payOpen}
          onClose={clearVisit}
          onPay={() => router.replace(withPay(params, true))}
        />
      ) : null}
      {payOpen && selectedId ? <CheckoutModal visitId={selectedId} onClose={() => router.replace(withPay(params, false))} /> : null}
    </section>
  );
}
