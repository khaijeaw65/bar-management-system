"use client";

import { Button, Chip } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export function OrderHeader({
  label,
  onBack,
}: Readonly<{
  label: string;
  onBack: () => void;
}>) {
  return (
    <header className="flex items-center gap-3">
      <Button variant="ghost" onPress={onBack}>
        <ArrowLeft aria-hidden size={18} />
        กลับไปที่โต๊ะ
      </Button>
      <Chip size="sm" variant="soft">
        โต๊ะ {label}
      </Chip>
    </header>
  );
}
