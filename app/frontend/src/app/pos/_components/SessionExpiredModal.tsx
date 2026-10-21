"use client";

import { AlertDialog, Button, ProgressBar } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

export function SessionExpiredModal({ onLogin }: Readonly<{ onLogin: () => void }>) {
  const [seconds, setSeconds] = useState(5);
  const left = useRef(false);
  const onLoginRef = useRef(onLogin);

  useEffect(() => {
    onLoginRef.current = onLogin;
  }, [onLogin]);

  function leave() {
    if (left.current) return;
    left.current = true;
    onLoginRef.current();
  }

  useEffect(() => {
    if (seconds > 0) {
      const id = setTimeout(() => setSeconds((current) => current - 1), 1000);
      return () => clearTimeout(id);
    }
    if (left.current) return;
    left.current = true;
    onLoginRef.current();
  }, [seconds]);

  return (
    <AlertDialog.Root isOpen onOpenChange={() => undefined}>
      <AlertDialog.Backdrop isDismissable={false} isKeyboardDismissDisabled>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>หมดเวลาการใช้งาน</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="flex flex-col gap-3">
              <p>ระบบจะพาไปหน้าเข้าสู่ระบบใน {seconds} วินาที</p>
              <ProgressBar.Root
                aria-label="นับถอยหลัง"
                value={seconds}
                minValue={0}
                maxValue={5}
              >
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar.Root>
              <p className="text-small text-text-muted">กรุณาเข้าสู่ระบบอีกครั้งเพื่อดำเนินการต่อ</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button fullWidth onPress={leave}>
                เข้าสู่ระบบอีกครั้ง
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog.Root>
  );
}
