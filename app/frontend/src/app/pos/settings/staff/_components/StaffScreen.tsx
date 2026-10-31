"use client";

import { useState } from "react";
import { RejectedRequests, RequestsSection } from "./RequestsSection";
import { StaffList } from "./StaffList";

export function StaffScreen() {
  const [highlightId, setHighlightId] = useState<string | null>(null);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-semibold">พนักงาน</h1>
      <RequestsSection onApproved={(member) => setHighlightId(member.id)} />
      <RejectedRequests />
      <StaffList highlightId={highlightId} />
    </div>
  );
}
