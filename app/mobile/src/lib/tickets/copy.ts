import type { Ticket } from '@bar/contracts';

/** "#0044" — the order number as staff say it. */
export function orderTag(orderNumber: number): string {
  return `#${String(orderNumber).padStart(4, '0')}`;
}

/** Lines still to make (cancelled lines excluded). */
export function activeLineCount(tickets: readonly Pick<Ticket, 'items'>[]): number {
  return tickets.reduce((sum, t) => sum + t.items.filter((i) => i.cancelledAt === null).length, 0);
}

/** CD-08 §6 strings used by the queue. */
export const QUEUE_COPY = {
  readOnly: 'บัญชีนี้ดูคิวได้อย่างเดียว — เปลี่ยนสถานะไม่ได้ ให้ผู้จัดการตรวจสิทธิ์',
  staleTitle: 'ออเดอร์นี้ถูกอัปเดตจากเครื่องอื่นแล้ว',
  staleBody: 'แสดงสถานะล่าสุดแล้ว ตรวจก่อนกดอีกครั้ง',
  takenBody: 'ไม่ต้องทำซ้ำ — ข้ามไปออเดอร์ถัดไปได้เลย',
  saveFailedTitle: 'บันทึกไม่สำเร็จ',
  saveFailedBody: 'สถานะยังไม่เปลี่ยน ตรวจการเชื่อมต่อแล้วกดอีกครั้ง',
  disconnectedTitle: 'การเชื่อมต่อขาด',
  disconnectedBody: 'ข้อมูลอาจไม่อัปเดต กำลังเชื่อมต่อใหม่',
} as const;

export function takenTitle(name: string, orderNumber: number): string {
  return `${name} รับออเดอร์ ${orderTag(orderNumber)} แล้ว`;
}

export function servedToast(ticket: Pick<Ticket, 'orderNumber' | 'seat' | 'items'>) {
  return {
    label: `เสิร์ฟ ${orderTag(ticket.orderNumber)} แล้ว · ${ticket.seat.label}`,
    description: `${activeLineCount([ticket])} รายการ · ดูได้ที่สรุปโต๊ะ`,
  };
}

export function newOrderToast(seatLabel: string, lines: number) {
  return {
    label: `ออเดอร์ใหม่ ${seatLabel}`,
    description: `${lines} รายการ · ต่อท้ายคิวแล้ว`,
  };
}
