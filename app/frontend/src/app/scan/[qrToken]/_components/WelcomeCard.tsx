"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import type { CustomerSession } from "@bar/contracts";
import { useState } from "react";

export function WelcomeCard({
  session,
  pending,
  onEnter,
}: Readonly<{ session: CustomerSession; pending: boolean; onEnter: (name: string) => void }>) {
  const [name, setName] = useState(session.displayName ?? "");
  const tooLong = name.trim().length > 30;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 bg-bg-app p-6">
      <div className="flex flex-col gap-1">
        <p className="text-small text-text-muted">โต๊ะ {session.seat.label}</p>
        <h1 className="text-title text-text-body">บอกชื่อเล่นของคุณ</h1>
        <p className="text-small text-text-muted">เพื่อให้พนักงานเรียกเมื่อเครื่องดื่มพร้อม</p>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!tooLong) onEnter(name);
        }}
      >
        <TextField value={name} isInvalid={tooLong} onChange={setName}>
          <Label>ชื่อเล่น</Label>
          <Input placeholder="เช่น ต้น" autoComplete="off" />
        </TextField>
        {tooLong ? <p className="text-small text-text-danger">ชื่อต้องไม่เกิน 30 ตัวอักษร</p> : null}
        <Button type="submit" size="lg" className="min-h-13 w-full" isPending={pending} isDisabled={tooLong || pending}>
          ดูเมนู
        </Button>
        <Button variant="ghost" className="min-h-11" isDisabled={pending} onPress={() => onEnter("")}>
          ข้ามขั้นตอนนี้
        </Button>
      </form>
      <p className="text-center text-small text-text-faint">ไม่ต้องสมัครสมาชิก · ชื่อเล่นใช้กับโต๊ะนี้เท่านั้น</p>
    </main>
  );
}
