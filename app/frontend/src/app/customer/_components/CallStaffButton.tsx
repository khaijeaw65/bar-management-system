"use client";

import { Button } from "@heroui/react";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useCallStaff } from "../_hooks/useCallStaff";
import { CallStaffSheet } from "./CallStaffSheet";

// Lives in the header so the 60 s lock survives closing the sheet and moving between pages.
export function CallStaffButton() {
  const [open, setOpen] = useState(false);
  const call = useCallStaff();
  return (
    <>
      <Button isIconOnly className="size-11" variant="ghost" aria-label="เรียกพนักงาน" onPress={() => setOpen(true)}>
        <Bell aria-hidden size={20} />
      </Button>
      {open ? <CallStaffSheet call={call} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
