"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/lib/permissions/usePermissions";

export function OrderEntryButton({
  visitId,
  prominent,
}: Readonly<{
  visitId: string;
  prominent?: boolean;
}>) {
  const router = useRouter();
  if (!usePermissions().can("orders:create")) return null;
  return (
    <Button
      size={prominent ? "lg" : "sm"}
      variant={prominent ? "primary" : "secondary"}
      onPress={() => router.push(`/pos/tables/${visitId}/order`)}
    >
      สั่งแทนลูกค้า
    </Button>
  );
}
