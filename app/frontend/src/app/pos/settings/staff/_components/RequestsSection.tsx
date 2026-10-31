"use client";

import type { AccessRequest, StaffMember } from "@bar/contracts";
import { Button, Modal, Skeleton, toast } from "@heroui/react";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useAccessRequests } from "@/hooks/useAccessRequests";
import { iamFailure, useRefreshIam } from "@/hooks/useIamWrite";
import { rejectAccessRequest, reopenAccessRequest } from "@/lib/api/staff";
import { ApproveDialog } from "./ApproveDialog";
import { StaffAvatar } from "./StaffAvatar";

const when = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

function RejectDialog({ request, onClose }: Readonly<{ request: AccessRequest; onClose: () => void }>) {
  const refresh = useRefreshIam();
  const [saving, setSaving] = useState(false);

  async function reject() {
    setSaving(true);
    try {
      await rejectAccessRequest(request.id);
      toast.success("ปฏิเสธคำขอแล้ว");
    } catch (error) {
      toast.danger(iamFailure(error).message);
    } finally {
      await refresh();
      setSaving(false);
      onClose();
    }
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container size="sm">
        <Modal.Dialog aria-label="ปฏิเสธคำขอ">
          <div className="flex flex-col gap-4">
            <Modal.Heading className="text-heading">ปฏิเสธคำขอของ {request.displayName ?? "ผู้ใช้ LINE"}?</Modal.Heading>
            <p className="text-body text-text-muted">บัญชี LINE นี้จะเข้าใช้งานไม่ได้จนกว่าจะเปิดคำขออีกครั้ง</p>
            <div className="flex gap-2">
              <Button size="lg" variant="secondary" className="min-h-11 flex-1" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button size="lg" variant="danger" className="min-h-11 flex-1" isDisabled={saving} onPress={() => void reject()}>
                ปฏิเสธ
              </Button>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function RequestsSection({ onApproved }: Readonly<{ onApproved: (member: StaffMember) => void }>) {
  const requests = useAccessRequests("pending");
  const [approving, setApproving] = useState<AccessRequest | null>(null);
  const [rejecting, setRejecting] = useState<AccessRequest | null>(null);

  return (
    <section aria-labelledby="requests-heading" className="flex flex-col gap-3">
      <h2 id="requests-heading" className="text-heading">คำขอเข้าใช้งาน</h2>
      {requests.isPending ? <Skeleton className="h-16 w-full rounded-card" /> : null}
      {requests.isError ? <LoadError onRetry={() => void requests.refetch()} /> : null}
      {requests.data?.length === 0 ? <p className="text-body text-text-muted">ไม่มีคำขอใหม่</p> : null}
      <ul className="flex flex-col gap-2">
        {requests.data?.map((request) => (
          <li key={request.id} className="flex flex-wrap items-center gap-3 rounded-card border border-line-hairline bg-surface p-3">
            <StaffAvatar name={request.displayName} url={request.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium">{request.displayName ?? "ผู้ใช้ LINE"}</p>
              <p className="text-small text-text-muted">ขอเมื่อ {when.format(new Date(request.requestedAt))}</p>
            </div>
            <Button size="lg" className="min-h-11" onPress={() => setApproving(request)}>
              อนุมัติ
            </Button>
            <Button size="lg" variant="secondary" className="min-h-11" onPress={() => setRejecting(request)}>
              ปฏิเสธ
            </Button>
          </li>
        ))}
      </ul>
      {approving ? (
        <ApproveDialog
          request={approving}
          onClose={() => setApproving(null)}
          onApproved={(member) => {
            setApproving(null);
            onApproved(member);
          }}
        />
      ) : null}
      {rejecting ? <RejectDialog request={rejecting} onClose={() => setRejecting(null)} /> : null}
    </section>
  );
}

export function RejectedRequests() {
  const rejected = useAccessRequests("rejected");
  const refresh = useRefreshIam();
  const [open, setOpen] = useState(false);
  const count = rejected.data?.length ?? 0;

  async function reopen(request: AccessRequest) {
    try {
      await reopenAccessRequest(request.id);
    } catch (error) {
      toast.danger(iamFailure(error).message);
    } finally {
      await refresh();
    }
  }

  if (count === 0) return null;

  return (
    <section aria-label="คำขอที่ปฏิเสธ" className="flex flex-col gap-2">
      <Button variant="ghost" className="min-h-11 self-start" aria-expanded={open} onPress={() => setOpen((value) => !value)}>
        คำขอที่ปฏิเสธ ({count})
      </Button>
      {open ? (
        <ul className="flex flex-col gap-2">
          {rejected.data?.map((request) => (
            <li key={request.id} className="flex items-center gap-3 rounded-card border border-line-hairline bg-surface p-3">
              <StaffAvatar name={request.displayName} url={request.avatarUrl} />
              <p className="min-w-0 flex-1 truncate text-body">{request.displayName ?? "ผู้ใช้ LINE"}</p>
              <Button size="lg" variant="secondary" className="min-h-11" onPress={() => void reopen(request)}>
                เปิดคำขออีกครั้ง
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
