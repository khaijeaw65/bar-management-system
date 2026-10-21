"use client";

import { Modal, toast } from "@heroui/react";
import { OpenVisitRequestSchema, type OpenVisitResponse, type TableSummary } from "@bar/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { openVisit } from "@/lib/api/tables";
import { AttachDialog } from "./AttachDialog";
import { OpenTableForm } from "./OpenTableForm";

function guestIssue(value: string): string | null {
  if (value.length <= 100) return null;
  const parsed = OpenVisitRequestSchema.safeParse({
    tableSeatId: "10000000-0000-4000-8000-000000000001",
    guestLabel: value,
    via: "pos",
  });
  const issue = parsed.error?.issues.find((item) => item.path[0] === "guestLabel");
  return issue?.message ?? "ชื่อแขกยาวเกินไป";
}

export function OpenTableModal({
  seats,
  initialSeatId,
  onClose,
  onJoined,
}: Readonly<{
  seats: TableSummary[];
  initialSeatId: string | null;
  onClose: () => void;
  onJoined: (visitId: string) => void;
}>) {
  const client = useQueryClient();
  const free = seats.filter((seat) => seat.currentVisit === null).sort((a, b) => a.sortOrder - b.sortOrder);
  const [seatId, setSeatId] = useState<string | null>(initialSeatId);
  const [guest, setGuest] = useState("");
  const [attached, setAttached] = useState<OpenVisitResponse | null>(null);

  const mutation = useMutation({
    mutationFn: openVisit,
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: ["tables"] });
      if (result.attached) {
        setAttached(result);
        return;
      }
      const name = result.visit.guestLabel;
      toast.success(`เปิด ${result.visit.seatLabel} แล้ว`, name ? { description: `แขก ${name}` } : undefined);
      onClose();
    },
  });

  function submit() {
    if (!seatId || guestIssue(guest) || mutation.isPending) return;
    mutation.mutate({ tableSeatId: seatId, guestLabel: guest.trim() || null, via: "pos" });
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container size="md">
        <Modal.Dialog>
            {attached ? (
              <AttachDialog
                visit={attached.visit}
                onJoin={() => onJoined(attached.visit.id)}
                onPickOther={() => {
                  setAttached(null);
                  setSeatId(null);
                  mutation.reset();
                }}
              />
            ) : (
              <OpenTableForm
                seats={free}
                seatId={seatId}
                guest={guest}
                problem={guestIssue(guest)}
                failed={mutation.isError}
                pending={mutation.isPending}
                onSeat={(next) => {
                  setSeatId(next);
                  mutation.reset();
                }}
                onGuest={(value) => {
                  setGuest(value);
                  mutation.reset();
                }}
                onClose={onClose}
                onSubmit={submit}
              />
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
  );
}
