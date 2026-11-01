"use client";

import type { SeatAdmin, TableSeatKind } from "@bar/contracts";
import { Button, Chip, Skeleton, toast } from "@heroui/react";
import { ArrowDown, ArrowUp, Pencil, Plus, QrCode } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadError } from "@/components/ui/LoadError";
import { cn } from "@/lib/utils/cn";
import {
  activateSeat,
  deactivateSeat,
  getSeatsAdmin,
  reorderSeats,
  SEATS_ADMIN_KEY,
} from "@/lib/api/tables-admin";
import { ApiError } from "@/lib/api/errors";
import { SeatFormDialog } from "./SeatFormDialog";
import { QrPrintModal } from "./QrPrintModal";

export function TablesAdminScreen() {
  const queryClient = useQueryClient();
  const seatsQuery = useQuery({
    queryKey: SEATS_ADMIN_KEY,
    queryFn: getSeatsAdmin,
    staleTime: 30_000,
    retry: false,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<SeatAdmin | null>(null);
  const [qrSeat, setQrSeat] = useState<SeatAdmin | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (seatsQuery.isPending) {
    return <Skeleton aria-label="กำลังโหลด" className="h-64 w-full max-w-4xl rounded-card" />;
  }

  if (seatsQuery.isError) {
    return <LoadError onRetry={() => void seatsQuery.refetch()} />;
  }

  const items = seatsQuery.data?.items ?? [];
  const counterSeats = items
    .filter((s) => s.kind === "counter")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const tableSeats = items
    .filter((s) => s.kind === "table")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  async function handleToggleActive(seat: SeatAdmin, nextActive: boolean) {
    setUpdatingId(seat.id);
    try {
      if (nextActive) {
        await activateSeat(seat.id);
        toast.success(`เปิดที่นั่ง ${seat.label} แล้ว`);
      } else {
        await deactivateSeat(seat.id);
        toast.success(`ปิดที่นั่ง ${seat.label} แล้ว`);
      }
      await queryClient.invalidateQueries({ queryKey: SEATS_ADMIN_KEY });
    } catch (err) {
      if (err instanceof ApiError && err.code === "SEAT_IN_USE") {
        toast.danger("มีแขกอยู่ที่โต๊ะนี้ ปิดโต๊ะก่อน");
      } else if (err instanceof ApiError) {
        toast.danger(typeof err.message === "string" ? err.message : "เกิดข้อผิดพลาด");
      } else {
        toast.danger("เกิดข้อผิดพลาด");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMove(seat: SeatAdmin, direction: "up" | "down", list: SeatAdmin[]) {
    const idx = list.findIndex((s) => s.id === seat.id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const newList = [...list];
    const [moved] = newList.splice(idx, 1);
    newList.splice(targetIdx, 0, moved);

    try {
      await reorderSeats({
        kind: seat.kind,
        ids: newList.map((s) => s.id),
      });
      await queryClient.invalidateQueries({ queryKey: SEATS_ADMIN_KEY });
    } catch {
      toast.danger("จัดลำดับไม่สำเร็จ");
    }
  }

  function renderSection(title: string, kind: TableSeatKind, list: SeatAdmin[]) {
    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{title}</h2>
          <span className="text-small text-text-muted">{list.length} ที่นั่ง</span>
        </div>
        {list.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-hairline p-6 text-center text-body text-text-muted">
            ยังไม่มี{title}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((seat, index) => {
              const isFirst = index === 0;
              const isLast = index === list.length - 1;
              const statusText = seat.hasLiveVisit
                ? "มีแขก"
                : seat.isActive
                  ? "ใช้งาน"
                  : "ปิดอยู่";
              const statusColor = seat.hasLiveVisit
                ? "warning"
                : seat.isActive
                  ? "success"
                  : "default";

              return (
                <li
                  key={seat.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line-hairline bg-surface p-3 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        isDisabled={isFirst}
                        aria-label={`เลื่อน ${seat.label} ขึ้น`}
                        onPress={() => void handleMove(seat, "up", list)}
                        className="h-6 w-6 min-w-0 p-0"
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        isDisabled={isLast}
                        aria-label={`เลื่อน ${seat.label} ลง`}
                        onPress={() => void handleMove(seat, "down", list)}
                        className="h-6 w-6 min-w-0 p-0"
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-semibold">{seat.label}</span>
                      <Chip size="sm" variant="soft" color={statusColor}>
                        {statusText}
                      </Chip>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={seat.isActive}
                      aria-label={`สถานะ ${seat.label}`}
                      disabled={updatingId === seat.id}
                      onClick={() => void handleToggleActive(seat, !seat.isActive)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                        seat.isActive ? "bg-accent" : "border border-line-hairline bg-surface-raised",
                        updatingId === seat.id && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="sr-only">สถานะ {seat.label}</span>
                      <span
                        className={cn(
                          "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                          seat.isActive ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </button>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="min-h-9"
                      onPress={() => setQrSeat(seat)}
                    >
                      <QrCode size={16} aria-hidden />
                      พิมพ์ QR
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`แก้ไข ${seat.label}`}
                      onPress={() => {
                        setEditingSeat(seat);
                        setFormOpen(true);
                      }}
                      className="h-9 w-9 min-w-0 p-0"
                    >
                      <Pencil size={16} />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">โต๊ะและที่นั่ง</h1>
          <p className="text-small text-text-muted">
            จัดการโต๊ะและเคาน์เตอร์บาร์ พร้อมพิมพ์ QR code สำหรับลูกค้าสั่งอาหาร
          </p>
        </div>
        <Button
          size="lg"
          className="min-h-11"
          onPress={() => {
            setEditingSeat(null);
            setFormOpen(true);
          }}
        >
          <Plus size={18} aria-hidden />
          เพิ่มที่นั่ง
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {renderSection("โต๊ะ", "table", tableSeats)}
        {renderSection("เคาน์เตอร์", "counter", counterSeats)}
      </div>

      {formOpen ? (
        <SeatFormDialog
          seat={editingSeat}
          isOpen={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingSeat(null);
          }}
          onSuccess={() => {
            setFormOpen(false);
            setEditingSeat(null);
            void queryClient.invalidateQueries({ queryKey: SEATS_ADMIN_KEY });
          }}
        />
      ) : null}

      {qrSeat ? (
        <QrPrintModal
          seat={qrSeat}
          isOpen={qrSeat !== null}
          onClose={() => setQrSeat(null)}
          onRegenerate={(newToken) => {
            setQrSeat((prev) => (prev ? { ...prev, qrToken: newToken } : null));
            void queryClient.invalidateQueries({ queryKey: SEATS_ADMIN_KEY });
          }}
        />
      ) : null}
    </div>
  );
}
