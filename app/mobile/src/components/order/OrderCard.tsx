import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Card, Chip } from 'heroui-native';
import type { Ticket } from '@bar/contracts';
import { timeAgo } from '../../lib/utils';
import { orderTag } from '../../lib/tickets/copy';
import { seatLine } from '../../lib/tickets/seat-line';
import { OrderItemLines } from './OrderItemLines';

export interface OrderCardProps {
  ticket: Ticket;
  /** The order has more than one ticket in the list → show the station (R18). */
  isSplit: boolean;
  /** New order just arrived (queue·5). */
  highlighted?: boolean;
  /** Status button or read-only line, bottom-left (R7). */
  footer?: ReactNode;
}

type TicketStatus = Ticket['status'];

interface StatusMeta {
  label: string;
  bgClass: string;
  textClass: string;
}

const STATUS_MAP: Record<TicketStatus, StatusMeta> = {
  pending: { label: 'ใหม่', bgClass: 'bg-status-new-bg', textClass: 'text-status-new-fg' },
  accepted: { label: 'กำลังเตรียม', bgClass: 'bg-status-making-bg', textClass: 'text-status-making-fg' },
  ready: { label: 'พร้อมเสิร์ฟ', bgClass: 'bg-status-served-bg', textClass: 'text-status-served-fg' },
  issue: { label: 'มีปัญหา', bgClass: 'bg-status-void-bg', textClass: 'text-status-void-fg' },
  sent: { label: 'เสิร์ฟแล้ว', bgClass: 'bg-status-neutral-bg', textClass: 'text-status-neutral-fg' },
  cancelled: { label: 'ยกเลิก', bgClass: 'bg-status-void-bg', textClass: 'text-status-void-fg' },
};

/** "กำลังเตรียม · บีม" — the acceptor's name rides on the accepted chip (R14). */
function chipLabel(ticket: Ticket): string {
  const base = STATUS_MAP[ticket.status].label;
  return ticket.status === 'accepted' && ticket.acceptedBy ? `${base} · ${ticket.acceptedBy.displayName}` : base;
}

export function OrderCard({ ticket, isSplit, highlighted = false, footer }: Readonly<OrderCardProps>) {
  const statusMeta = STATUS_MAP[ticket.status];

  return (
    <Card
      testID={highlighted ? 'order-card-highlighted' : 'order-card'}
      className={`border p-4 rounded-xl gap-2 ${
        highlighted ? 'bg-accent-soft border-accent' : 'bg-surface-card border-line'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-shrink">
          <Text className="text-base font-bold text-text-body font-sans">{orderTag(ticket.orderNumber)}</Text>
          <Chip className={`px-2 py-0.5 rounded-full ${statusMeta.bgClass}`}>
            <Chip.Label className={`text-xs font-semibold font-sans ${statusMeta.textClass}`}>
              {chipLabel(ticket)}
            </Chip.Label>
          </Chip>
        </View>
        <Text className="text-sm text-text-muted font-sans">{timeAgo(ticket.createdAt)}</Text>
      </View>

      <Text numberOfLines={1} className="text-sm font-medium text-text-muted font-sans">
        {seatLine(ticket, isSplit)}
      </Text>

      <OrderItemLines items={ticket.items} />

      {footer}
    </Card>
  );
}
