import { View, Text } from 'react-native';
import { Card, Chip } from 'heroui-native';
import type { Ticket } from '@bar/contracts';
import { timeAgo } from '../../lib/utils';

export interface OrderCardProps {
  ticket: Ticket;
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

function getStatusMeta(status: TicketStatus): StatusMeta {
  return STATUS_MAP[status] ?? {
    label: status,
    bgClass: 'bg-status-neutral-bg',
    textClass: 'text-status-neutral-fg',
  };
}

export function OrderCard({ ticket }: OrderCardProps) {
  const orderNumberStr = `#${String(ticket.orderNumber).padStart(4, '0')}`;
  const stationLabel = ticket.station === 'food' ? 'ครัว' : ticket.station === 'bar' ? 'บาร์' : null;
  const firstOrderedBy = ticket.items.find((item) => item.orderedByName)?.orderedByName ?? null;
  const seatAndInfo = [ticket.seat.label, firstOrderedBy, stationLabel].filter(Boolean).join(' · ');
  const statusMeta = getStatusMeta(ticket.status);

  const visibleItems = ticket.items.slice(0, 3);
  const remainingCount = ticket.items.length - 3;

  return (
    <Card className="bg-surface-card border border-line p-4 rounded-xl gap-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-text-body font-sans">{orderNumberStr}</Text>
          <Text className="text-sm text-text-muted font-sans">{timeAgo(ticket.createdAt)}</Text>
        </View>
        <Chip className={`px-2 py-0.5 rounded-full ${statusMeta.bgClass}`}>
          <Chip.Label className={`text-xs font-semibold font-sans ${statusMeta.textClass}`}>
            {statusMeta.label}
          </Chip.Label>
        </Chip>
      </View>

      <Text className="text-sm font-medium text-text-muted font-sans">{seatAndInfo}</Text>

      <View className="gap-1 mt-1">
        {visibleItems.map((item) => {
          const isCancelled = item.cancelledAt !== null;
          return (
            <Text
              key={item.id}
              testID={isCancelled ? 'cancelled-order-item' : undefined}
              className={`text-sm font-sans ${
                isCancelled ? 'line-through text-text-faint' : 'text-text-body'
              }`}
              style={isCancelled ? { textDecorationLine: 'line-through' } : undefined}
            >
              {item.quantity}× {item.name}
            </Text>
          );
        })}
        {remainingCount > 0 && (
          <Text className="text-xs text-text-faint font-sans">+ {remainingCount} รายการ</Text>
        )}
      </View>
    </Card>
  );
}
