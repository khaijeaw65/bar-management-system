import { Card } from "@heroui/react";

export function NotRegisteredCard() {
  return (
    <Card className="w-full max-w-md shadow-(--shadow-dialog)">
      <Card.Header className="flex flex-col gap-2 px-8 pt-8">
        <Card.Title>บัญชีนี้ยังไม่ได้ลงทะเบียน</Card.Title>
        <Card.Description>บัญชี LINE นี้ยังไม่ได้ลงทะเบียนเป็นพนักงาน</Card.Description>
        <p className="text-small text-text-muted">ติดต่อเจ้าของร้านเพื่อเพิ่มสิทธิ์</p>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4 px-8 pb-8">
        <div className="rounded-card bg-surface-input p-4">
          <p className="text-small font-semibold">วิธีขอสิทธิ์</p>
          <ol className="mt-2 list-decimal pl-5 text-small text-text-muted">
            <li>แจ้งชื่อและหน้าที่ให้เจ้าของร้าน</li>
            <li>รอการยืนยันทาง LINE</li>
            <li>เข้าสู่ระบบใหม่อีกครั้ง</li>
          </ol>
        </div>
        <a
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-btn bg-surface-hover text-small font-semibold"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </a>
      </Card.Content>
    </Card>
  );
}
