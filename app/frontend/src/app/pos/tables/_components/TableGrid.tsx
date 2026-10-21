"use client";

import { Button } from "@heroui/react";
import type { TableSummary } from "@bar/contracts";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useTableLive } from "@/hooks/useSocketEvent";
import { getTables } from "@/lib/api/tables";
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

export function TableGrid() {
  const tables = useQuery({ queryKey: ["tables"], queryFn: getTables, retry: false });
  const disconnected = useTableLive();
  const now = useMinuteClock();
  const [draft, setDraft] = useState<{ seatId: string | null } | null>(null);
  const params = useSearchParams();
  const router = useRouter();
  const items = tables.data?.items ?? [];
  const selectedId = params.get("visit");

  function selectVisit(visitId: string) {
    const next = new URLSearchParams(params.toString());
    next.set("visit", visitId);
    router.replace(`/pos/tables?${next.toString()}`);
  }

  function clearVisit() {
    const next = new URLSearchParams(params.toString());
    next.delete("visit");
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
          <SeatSection title="เคาน์เตอร์" seats={items.filter((seat) => seat.kind === "counter").sort(byOrder)} now={now} selectedId={selectedId} onSeat={onSeat} />
          <SeatSection title="โต๊ะ" seats={items.filter((seat) => seat.kind === "table").sort(byOrder)} now={now} selectedId={selectedId} onSeat={onSeat} />
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
      {selectedId ? <SessionDrawer key={selectedId} visitId={selectedId} onClose={clearVisit} /> : null}
    </section>
  );
}
