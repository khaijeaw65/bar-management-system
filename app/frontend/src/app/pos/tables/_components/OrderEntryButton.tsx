"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

export function OrderEntryButton({
  visitId,
  prominent,
}: Readonly<{
  visitId: string;
  prominent?: boolean;
}>) {
  const router = useRouter();
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
