"use client";

import { Button, Chip } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useDisconnected } from "@/hooks/useSocketEvent";
import { useTicketBoard } from "@/hooks/useTicketBoard";
import { getVenue } from "@/lib/api/venue";
import { usePermissions } from "@/lib/permissions/usePermissions";
import { DisconnectedBanner } from "../../tables/_components/DisconnectedBanner";
import { columnsFor, ticketsIn, type StationFilter } from "../board";
import { useBoardEvents } from "../_hooks/useBoardEvents";
import { useTicketActions } from "../_hooks/useTicketActions";
import { BoardColumn } from "./BoardColumn";
import { TicketCard } from "./TicketCard";
import { TicketDrawer } from "./TicketDrawer";

const filters: ReadonlyArray<{ key: StationFilter; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "bar", label: "เฉพาะบาร์" },
  { key: "food", label: "เฉพาะครัว" },
];

export function OrdersBoard() {
  const board = useTicketBoard();
  const canAct = usePermissions().can("orders:update_status");
  const venue = useQuery({ queryKey: ["venue"], queryFn: getVenue, staleTime: 60_000, retry: false });
  const searchParams = useSearchParams();
  const ticketParam = searchParams.get("ticketId");
  const [station, setStation] = useState<StationFilter>("all");
  const [openId, setOpenId] = useState<string | null>(ticketParam);
  const fresh = useBoardEvents(setOpenId);
  const actions = useTicketActions();
  const disconnected = useDisconnected(() => void board.refetch());

  useEffect(() => {
    if (ticketParam) setOpenId(ticketParam);
  }, [ticketParam]);

  const kitchenOn = venue.data?.kitchenDisplayEnabled === true;
  const columns = columnsFor(kitchenOn);
  const items = board.data?.items ?? [];
  const opened = items.find((ticket) => ticket.id === openId || ticket.orderId === openId) ?? null;
  const loading = board.isPending || venue.isPending;

  if (board.isError || venue.isError) {
    return (
      <LoadError
        onRetry={() => {
          void board.refetch();
          void venue.refetch();
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title">ออเดอร์</h1>
        {kitchenOn ? (
          <fieldset className="m-0 flex gap-2 border-0 p-0">
            <legend className="sr-only">กรองสถานี</legend>
            {filters.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={station === filter.key ? "primary" : "secondary"}
                aria-pressed={station === filter.key}
                onPress={() => setStation(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </fieldset>
        ) : null}
      </div>
      {disconnected ? <DisconnectedBanner /> : null}
      {loading ? null : (
        <div className="flex flex-wrap gap-2">
          {columns.map((column) => (
            <Chip key={column.key} size="sm">
              {column.label} {ticketsIn(items, column.key, kitchenOn, station).length}
            </Chip>
          ))}
        </div>
      )}
      <div className={kitchenOn ? "grid grid-cols-4 gap-4" : "grid grid-cols-3 gap-4"}>
        {columns.map((column) => {
          const tickets = ticketsIn(items, column.key, kitchenOn, station);
          return (
            <BoardColumn key={column.key} column={column} tickets={tickets} loading={loading}>
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  kitchenOn={kitchenOn}
                  canAct={canAct}
                  pending={actions.pendingIds.has(ticket.id)}
                  fresh={fresh.has(ticket.id)}
                  onOpen={() => setOpenId(ticket.id)}
                  onAct={(kind) => actions.act(ticket, kind)}
                />
              ))}
            </BoardColumn>
          );
        })}
      </div>
      {opened ? (
        <TicketDrawer
          ticket={opened}
          kitchenOn={kitchenOn}
          canAct={canAct}
          resolving={actions.pendingIds.has(opened.id)}
          onResolve={() => actions.resolve(opened)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </section>
  );
}
