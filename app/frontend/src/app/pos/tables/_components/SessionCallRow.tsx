"use client";

import { useAcknowledgeCall, useTables } from "@/hooks/useStaffCalls";
import { StaffCallRow } from "../../_components/StaffCallRow";
import { useMinuteClock } from "./table-time";

// The bell lives on the seat, so the drawer reads it from the floor query rather than the visit.
export function SessionCallRow({ seatId, label }: Readonly<{ seatId: string; label: string }>) {
  const call = useTables().data?.items.find((seat) => seat.id === seatId)?.staffCall;
  const acknowledge = useAcknowledgeCall();
  const now = useMinuteClock();
  if (!call) return null;
  return <StaffCallRow label={label} call={call} now={now} onAcknowledge={() => acknowledge.mutate(seatId)} />;
}
