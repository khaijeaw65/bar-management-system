"use client";

import { useId } from "react";
import { ApiError } from "@/lib/api/errors";
import { CloseConfirmModal } from "./CloseConfirmModal";
import { DrawerStatus } from "./DrawerStatus";
import { SessionBody } from "./SessionBody";
import { sessionGroups } from "./session-groups";
import { useSession } from "./useSession";

export function SessionDrawer({
  visitId,
  onClose,
  onPay = () => undefined,
  holdEscape = false,
}: Readonly<{
  visitId: string;
  onClose: () => void;
  onPay?: () => void;
  holdEscape?: boolean;
}>) {
  const session = useSession(visitId, onClose, holdEscape);
  const titleId = useId();
  const visit = session.visit.data;
  const missing = session.visit.error instanceof ApiError && session.visit.error.status === 404;
  if (missing) return null;

  const waiting = !visit && session.pending;
  const emptyLabel = waiting ? "กำลังโหลดโต๊ะ" : "โหลดข้อมูลโต๊ะไม่สำเร็จ";
  const groups = visit ? sessionGroups(visit.orders, session.venue.data?.kitchenDisplayEnabled === true) : [];

  return (
    // ponytail: HeroUI Drawer is modal and would block taps on the floor. A non-modal side panel (complementary region, not a dialog) keeps another card able to change ?visit=.
    <aside
      aria-labelledby={visit ? titleId : undefined}
      aria-label={visit ? undefined : emptyLabel}
      aria-busy={waiting || undefined}
      className="fixed inset-y-0 right-0 z-30 flex w-100 flex-col gap-4 bg-surface-overlay p-6 shadow-(--shadow-dialog)"
    >
      {visit ? (
        <SessionBody
          titleId={titleId}
          visit={visit}
          groups={groups}
          paying={session.paying}
          onClose={onClose}
          onPay={onPay}
          onCloseTable={session.requestClose}
        />
      ) : (
        <DrawerStatus
          pending={session.pending}
          onRetry={() => {
            void session.visit.refetch();
            void session.venue.refetch();
          }}
        />
      )}
      {session.confirming && visit ? (
        <CloseConfirmModal
          label={visit.seatLabel}
          bill={visit.bill}
          pending={session.close.isPending}
          failed={session.retryable}
          onDismiss={session.dismissConfirm}
          onConfirm={session.confirmClose}
          onPay={() => {
            session.dismissConfirm();
            onPay();
          }}
        />
      ) : null}
    </aside>
  );
}
