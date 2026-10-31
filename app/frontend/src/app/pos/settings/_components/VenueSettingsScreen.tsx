"use client";

import { Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { LoadError } from "@/components/ui/LoadError";
import { VENUE_KEY } from "@/hooks/useVenueEvents";
import { getVenue } from "@/lib/api/venue";
import { usePermissions } from "@/lib/permissions/usePermissions";
import { PaymentSection } from "./PaymentSection";
import { SettingsForm } from "./SettingsForm";

export function VenueSettingsScreen() {
  const { can } = usePermissions();
  const venue = useQuery({ queryKey: VENUE_KEY, queryFn: getVenue, staleTime: 60_000, retry: false });

  if (venue.isPending) {
    return (
      <div aria-busy="true" aria-label="กำลังโหลดการตั้งค่า" className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    );
  }
  if (venue.isError) return <LoadError onRetry={() => void venue.refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-1.5 text-small text-text-muted">
        <Lock size={14} aria-hidden />
        {can("venue:update") ? "เฉพาะเจ้าของร้านแก้ไขได้" : "ดูได้อย่างเดียว — ไม่มีสิทธิ์แก้ไข"}
      </p>
      <SettingsForm
        venue={venue.data}
        readOnly={!can("venue:update")}
        payment={can("venue:read_payment") ? <PaymentSection canEdit={can("venue:update_payment")} /> : null}
      />
    </div>
  );
}
