"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";
import { lineLoginUrl } from "@/lib/api/auth";
import { DemoLoginSection } from "./DemoLoginSection";
import { LoginAlert } from "./LoginAlert";

export function LoginCard({ failed }: Readonly<{ failed: boolean }>) {
  const [pending, setPending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  function startLogin() {
    setPending(true);
    // Let the pending label paint before the browser leaves this page.
    window.setTimeout(() => window.location.assign(lineLoginUrl()), 250);
  }

  return (
    <Card className="w-full max-w-md shadow-(--shadow-dialog)">
      <Card.Header className="flex flex-col items-center gap-1 pt-8 text-center">
        <p className="text-label tracking-caps text-text-accent">THE LOFT BAR</p>
        <Card.Title className="text-xl">เดอะ ลอฟท์ บาร์</Card.Title>
        <Card.Description>ระบบจัดการบาร์</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4 px-8 pb-8">
        {failed && !dismissed ? <LoginAlert onDismiss={() => setDismissed(true)} /> : null}
        <Button
          size="lg"
          fullWidth
          className="bg-line-brand text-line-brand-fg"
          isDisabled={pending}
          isPending={pending}
          onPress={startLogin}
        >
          {/* Brand glyph in public/. next/image cannot load this SVG under jsdom. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/line-logo.svg" alt="" width={20} height={20} />
          {pending ? "กำลังเปลี่ยนเส้นทาง..." : "เข้าสู่ระบบด้วย LINE"}
        </Button>
        <p className="text-center text-small text-text-muted">เฉพาะพนักงานที่ลงทะเบียนแล้ว</p>
        {process.env.NODE_ENV !== "production" ? <DemoLoginSection /> : null}
      </Card.Content>
    </Card>
  );
}
